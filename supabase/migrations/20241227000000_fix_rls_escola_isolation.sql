-- Migração para corrigir isolamento de dados por escola nas políticas RLS
-- Data: 2024-12-27
-- Descrição: Corrige vazamentos de dados entre escolas nas políticas RLS

-- =============================================
-- CORREÇÃO DAS POLÍTICAS RLS PROBLEMÁTICAS
-- =============================================

-- 1. TABELA ESCOLAS - Corrigir política de leitura pública
-- PROBLEMA: Política "public_read_for_signup" permite ver todas as escolas
DROP POLICY IF EXISTS "public_read_for_signup" ON escolas;
CREATE POLICY "escola_own_read" ON escolas FOR SELECT USING (
    id = get_user_escola_id() OR 
    auth.uid() IS NULL  -- Permite leitura apenas durante cadastro (sem autenticação)
);

-- 2. TABELA USUARIOS - Corrigir política de leitura
-- PROBLEMA: is_admin_or_secretary() não verifica escola_id
DROP POLICY IF EXISTS "user_read" ON usuarios;
CREATE POLICY "user_read" ON usuarios FOR SELECT USING (
    -- Admin/Secretário: apenas usuários da mesma escola
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id()) OR
    -- Professor: apenas usuários da mesma escola
    (get_user_role() = 'professor' AND escola_id = get_user_escola_id()) OR
    -- Usuário: apenas seus próprios dados
    (auth_user_id = auth.uid())
);

-- Corrigir política de inserção
DROP POLICY IF EXISTS "user_insert" ON usuarios;
CREATE POLICY "user_insert" ON usuarios FOR INSERT WITH CHECK (
    -- Próprio usuário durante cadastro
    auth_user_id = auth.uid() OR 
    -- Admin/Secretário: apenas usuários da mesma escola
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id())
);

-- Corrigir política de atualização
DROP POLICY IF EXISTS "user_update" ON usuarios;
CREATE POLICY "user_update" ON usuarios FOR UPDATE USING (
    -- Próprio usuário
    auth_user_id = auth.uid() OR 
    -- Admin/Secretário: apenas usuários da mesma escola
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id())
);

-- 3. TABELA PROFESSOR_DISCIPLINAS - Adicionar verificação de escola
-- PROBLEMA: is_admin_or_secretary() não verifica escola
DROP POLICY IF EXISTS "pd_read" ON professor_disciplinas;
CREATE POLICY "pd_read" ON professor_disciplinas FOR SELECT USING (
    -- Admin/Secretário: verificar se professor pertence à mesma escola
    (get_user_role() IN ('admin', 'secretario') AND EXISTS (
        SELECT 1 FROM usuarios u WHERE u.id = professor_disciplinas.professor_id AND u.escola_id = get_user_escola_id()
    )) OR
    -- Professor: apenas suas próprias disciplinas
    professor_id = get_user_id()
);

DROP POLICY IF EXISTS "pd_manage" ON professor_disciplinas;
CREATE POLICY "pd_manage" ON professor_disciplinas FOR ALL USING (
    -- Admin/Secretário: verificar se professor pertence à mesma escola
    get_user_role() IN ('admin', 'secretario') AND EXISTS (
        SELECT 1 FROM usuarios u WHERE u.id = professor_disciplinas.professor_id AND u.escola_id = get_user_escola_id()
    )
);

-- 4. TABELA ALUNO_TURMAS - Adicionar verificação de escola
DROP POLICY IF EXISTS "at_read" ON aluno_turmas;
CREATE POLICY "at_read" ON aluno_turmas FOR SELECT USING (
    -- Admin/Secretário: verificar se aluno pertence à mesma escola
    (get_user_role() IN ('admin', 'secretario') AND EXISTS (
        SELECT 1 FROM usuarios u WHERE u.id = aluno_turmas.aluno_id AND u.escola_id = get_user_escola_id()
    )) OR
    -- Aluno: apenas suas próprias matrículas
    aluno_id = get_user_id() OR
    -- Professor: apenas alunos de suas turmas E da mesma escola
    (get_user_role() = 'professor' AND EXISTS (
        SELECT 1 FROM professor_disciplinas pd 
        JOIN usuarios u ON u.id = aluno_turmas.aluno_id
        WHERE pd.turma_id = aluno_turmas.turma_id 
        AND pd.professor_id = get_user_id()
        AND u.escola_id = get_user_escola_id()
    ))
);

DROP POLICY IF EXISTS "at_manage" ON aluno_turmas;
CREATE POLICY "at_manage" ON aluno_turmas FOR ALL USING (
    -- Admin/Secretário: verificar se aluno pertence à mesma escola
    get_user_role() IN ('admin', 'secretario') AND EXISTS (
        SELECT 1 FROM usuarios u WHERE u.id = aluno_turmas.aluno_id AND u.escola_id = get_user_escola_id()
    )
);

-- 5. TABELA FINANCEIRO - Adicionar verificação de escola
DROP POLICY IF EXISTS "financeiro_read" ON financeiro;
CREATE POLICY "financeiro_read" ON financeiro FOR SELECT USING (
    -- Admin/Secretário: apenas dados financeiros da mesma escola
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id()) OR
    -- Aluno: apenas seus próprios dados financeiros
    (get_user_role() = 'aluno' AND aluno_id = get_user_id())
);

DROP POLICY IF EXISTS "financeiro_manage" ON financeiro;
CREATE POLICY "financeiro_manage" ON financeiro FOR ALL USING (
    -- Admin/Secretário: apenas dados financeiros da mesma escola
    get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id()
);

-- 6. TABELA COMUNICACOES - Adicionar verificação de escola para inserção
DROP POLICY IF EXISTS "comunicacoes_insert" ON comunicacoes;
CREATE POLICY "comunicacoes_insert" ON comunicacoes FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'secretario', 'professor') AND 
    remetente_id = get_user_id() AND
    escola_id = get_user_escola_id()
);

-- Corrigir política de atualização
DROP POLICY IF EXISTS "comunicacoes_update" ON comunicacoes;
CREATE POLICY "comunicacoes_update" ON comunicacoes FOR UPDATE USING (
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id()) OR
    (remetente_id = get_user_id() AND escola_id = get_user_escola_id())
);

-- Corrigir política de exclusão
DROP POLICY IF EXISTS "comunicacoes_delete" ON comunicacoes;
CREATE POLICY "comunicacoes_delete" ON comunicacoes FOR DELETE USING (
    (get_user_role() IN ('admin', 'secretario') AND escola_id = get_user_escola_id()) OR
    (remetente_id = get_user_id() AND escola_id = get_user_escola_id())
);

-- =============================================
-- MELHORAR FUNÇÕES AUXILIARES
-- =============================================

-- Função para verificar se usuário é admin/secretário DA MESMA ESCOLA
CREATE OR REPLACE FUNCTION is_admin_or_secretary_same_school(target_escola_id UUID DEFAULT NULL) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM usuarios 
        WHERE auth_user_id = auth.uid() 
        AND funcao IN ('admin', 'secretario') 
        AND ativo = true
        AND (target_escola_id IS NULL OR escola_id = target_escola_id)
        AND escola_id = get_user_escola_id()
    );
$$;

-- Função para verificar se usuário pode acessar dados de outro usuário
CREATE OR REPLACE FUNCTION can_access_user_data(target_user_id UUID) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE AS $$
    SELECT 
        -- Próprio usuário
        target_user_id = get_user_id() OR
        -- Admin/Secretário da mesma escola
        (get_user_role() IN ('admin', 'secretario') AND EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = target_user_id 
            AND u.escola_id = get_user_escola_id()
        )) OR
        -- Professor pode ver alunos de suas turmas da mesma escola
        (get_user_role() = 'professor' AND EXISTS (
            SELECT 1 FROM usuarios u
            JOIN aluno_turmas at ON at.aluno_id = u.id
            JOIN professor_disciplinas pd ON pd.turma_id = at.turma_id
            WHERE u.id = target_user_id
            AND pd.professor_id = get_user_id()
            AND u.escola_id = get_user_escola_id()
        ));
$$;

-- =============================================
-- ADICIONAR POLÍTICAS PARA TABELAS DE CHAT
-- =============================================

-- Verificar se as tabelas de chat existem e adicionar RLS
DO $$
BEGIN
    -- Habilitar RLS nas tabelas de chat se existirem
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversas') THEN
        ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
        
        -- Política para conversas: apenas da mesma escola
        DROP POLICY IF EXISTS "conversas_escola_isolation" ON conversas;
        CREATE POLICY "conversas_escola_isolation" ON conversas FOR ALL USING (
            escola_id = get_user_escola_id()
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversa_participantes') THEN
        ALTER TABLE conversa_participantes ENABLE ROW LEVEL SECURITY;
        
        -- Política para participantes: apenas conversas da mesma escola
        DROP POLICY IF EXISTS "participantes_escola_isolation" ON conversa_participantes;
        CREATE POLICY "participantes_escola_isolation" ON conversa_participantes FOR ALL USING (
            EXISTS (
                SELECT 1 FROM conversas c 
                WHERE c.id = conversa_participantes.conversa_id 
                AND c.escola_id = get_user_escola_id()
            ) AND
            -- Usuário deve ser participante ou admin da escola
            (usuario_id = get_user_id() OR get_user_role() IN ('admin', 'secretario'))
        );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mensagens') THEN
        ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
        
        -- Política para mensagens: apenas de conversas da mesma escola
        DROP POLICY IF EXISTS "mensagens_escola_isolation" ON mensagens;
        CREATE POLICY "mensagens_escola_isolation" ON mensagens FOR ALL USING (
            EXISTS (
                SELECT 1 FROM conversas c 
                WHERE c.id = mensagens.conversa_id 
                AND c.escola_id = get_user_escola_id()
            )
        );
    END IF;
END;
$$;

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON FUNCTION is_admin_or_secretary_same_school(UUID) IS 'Verifica se o usuário é admin/secretário da mesma escola, com isolamento por escola';
COMMENT ON FUNCTION can_access_user_data(UUID) IS 'Verifica se o usuário pode acessar dados de outro usuário, respeitando o isolamento por escola';

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'Migração 20241227000000_fix_rls_escola_isolation aplicada com sucesso';
    RAISE NOTICE 'Corrigido isolamento de dados por escola nas políticas RLS';
    RAISE NOTICE 'Adicionadas verificações de escola em todas as políticas críticas';
END;
$$;