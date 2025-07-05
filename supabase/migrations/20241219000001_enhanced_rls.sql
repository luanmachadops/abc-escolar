-- =============================================
-- ABC ESCOLAR - RLS APRIMORADAS E ESPECÍFICAS
-- =============================================

-- Remover políticas genéricas existentes
DROP POLICY IF EXISTS "Escolas visíveis apenas para admins da própria escola" ON escolas;
DROP POLICY IF EXISTS "Usuários visíveis apenas para mesma escola" ON usuarios;
DROP POLICY IF EXISTS "Cursos visíveis apenas para mesma escola" ON cursos;
DROP POLICY IF EXISTS "Turmas visíveis apenas para mesma escola" ON turmas;
DROP POLICY IF EXISTS "Disciplinas visíveis apenas para mesma escola" ON disciplinas;
DROP POLICY IF EXISTS "Professor vê apenas suas disciplinas" ON professor_disciplinas;
DROP POLICY IF EXISTS "Aluno vê apenas suas matrículas" ON aluno_turmas;
DROP POLICY IF EXISTS "Comunicações visíveis apenas para mesma escola" ON comunicacoes;
DROP POLICY IF EXISTS "Financeiro visível apenas para mesma escola" ON financeiro;

-- =============================================
-- FUNÇÕES AUXILIARES APRIMORADAS
-- =============================================

-- Função para obter dados do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_data()
RETURNS TABLE(
    user_id UUID,
    escola_id UUID,
    funcao TEXT,
    ativo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.escola_id, u.funcao, u.ativo
    FROM usuarios u
    WHERE u.auth_user_id = auth.uid()
    AND u.ativo = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin ou secretário
CREATE OR REPLACE FUNCTION is_admin_or_secretary()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios
        WHERE auth_user_id = auth.uid()
        AND funcao IN ('admin', 'secretario')
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é professor
CREATE OR REPLACE FUNCTION is_professor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios
        WHERE auth_user_id = auth.uid()
        AND funcao = 'professor'
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é aluno
CREATE OR REPLACE FUNCTION is_aluno()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios
        WHERE auth_user_id = auth.uid()
        AND funcao = 'aluno'
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter turmas do professor
CREATE OR REPLACE FUNCTION get_professor_turmas()
RETURNS TABLE(turma_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT pd.turma_id
    FROM professor_disciplinas pd
    JOIN usuarios u ON u.id = pd.professor_id
    WHERE u.auth_user_id = auth.uid()
    AND pd.ativo = true
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter alunos das turmas do professor
CREATE OR REPLACE FUNCTION get_professor_alunos()
RETURNS TABLE(aluno_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT at.aluno_id
    FROM aluno_turmas at
    WHERE at.turma_id IN (
        SELECT turma_id FROM get_professor_turmas()
    )
    AND at.status = 'ativo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS PARA TABELA ESCOLAS
-- =============================================

-- A política de SELECT pública será criada em uma migração posterior.
-- As políticas de INSERT/UPDATE/DELETE serão tratadas em outro lugar.


-- =============================================
-- RLS PARA TABELA USUARIOS
-- =============================================

-- Admins e secretários veem todos os usuários da escola
CREATE POLICY "admin_secretario_usuarios_full" ON usuarios
    FOR ALL
    USING (
        escola_id IN (
            SELECT escola_id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao IN ('admin', 'secretario')
            AND ativo = true
        )
    )
    WITH CHECK (
        escola_id IN (
            SELECT escola_id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao IN ('admin', 'secretario')
            AND ativo = true
        )
    );

-- Professores veem apenas alunos de suas turmas e outros professores
CREATE POLICY "professor_usuarios_limited" ON usuarios
    FOR SELECT
    USING (
        (funcao = 'professor' AND escola_id IN (
            SELECT escola_id FROM usuarios
            WHERE auth_user_id = auth.uid()
        ))
        OR
        (funcao = 'aluno' AND id IN (
            SELECT aluno_id FROM get_professor_alunos()
        ))
        OR
        (auth_user_id = auth.uid())
    );

-- Alunos veem apenas a si mesmos
CREATE POLICY "aluno_self_only" ON usuarios
    FOR SELECT
    USING (
        auth_user_id = auth.uid()
        AND funcao = 'aluno'
    );

-- Usuários podem atualizar seus próprios dados básicos
CREATE POLICY "usuario_update_self" ON usuarios
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- =============================================
-- RLS PARA TABELA CURSOS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_cursos_full" ON cursos
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores e alunos: apenas leitura
CREATE POLICY "professor_aluno_cursos_read" ON cursos
    FOR SELECT
    USING (
        escola_id IN (
            SELECT escola_id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND ativo = true
        )
    );

-- =============================================
-- RLS PARA TABELA TURMAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_turmas_full" ON turmas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: apenas turmas onde lecionam
CREATE POLICY "professor_turmas_assigned" ON turmas
    FOR SELECT
    USING (
        id IN (SELECT turma_id FROM get_professor_turmas())
    );

-- Alunos: apenas turmas onde estão matriculados
CREATE POLICY "aluno_turmas_enrolled" ON turmas
    FOR SELECT
    USING (
        id IN (
            SELECT turma_id FROM aluno_turmas at
            JOIN usuarios u ON u.id = at.aluno_id
            WHERE u.auth_user_id = auth.uid()
            AND at.status = 'ativo'
        )
    );

-- =============================================
-- RLS PARA TABELA DISCIPLINAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_disciplinas_full" ON disciplinas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: apenas disciplinas que lecionam
CREATE POLICY "professor_disciplinas_assigned" ON disciplinas
    FOR SELECT
    USING (
        id IN (
            SELECT pd.disciplina_id FROM professor_disciplinas pd
            JOIN usuarios u ON u.id = pd.professor_id
            WHERE u.auth_user_id = auth.uid()
            AND pd.ativo = true
        )
    );

-- Alunos: disciplinas de suas turmas
CREATE POLICY "aluno_disciplinas_turma" ON disciplinas
    FOR SELECT
    USING (
        curso_id IN (
            SELECT t.curso_id FROM turmas t
            JOIN aluno_turmas at ON at.turma_id = t.id
            JOIN usuarios u ON u.id = at.aluno_id
            WHERE u.auth_user_id = auth.uid()
            AND at.status = 'ativo'
        )
    );

-- =============================================
-- RLS PARA TABELA PROFESSOR_DISCIPLINAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_prof_disc_full" ON professor_disciplinas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: apenas suas próprias atribuições
CREATE POLICY "professor_own_assignments" ON professor_disciplinas
    FOR SELECT
    USING (
        professor_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'professor'
        )
    );

-- =============================================
-- RLS PARA TABELA ALUNO_TURMAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_matriculas_full" ON aluno_turmas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: alunos de suas turmas
CREATE POLICY "professor_alunos_turmas" ON aluno_turmas
    FOR SELECT
    USING (
        turma_id IN (SELECT turma_id FROM get_professor_turmas())
    );

-- Alunos: apenas suas próprias matrículas
CREATE POLICY "aluno_own_matriculas" ON aluno_turmas
    FOR SELECT
    USING (
        aluno_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'aluno'
        )
    );

-- =============================================
-- RLS PARA TABELA COMUNICACOES
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_comunicacoes_full" ON comunicacoes
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: podem criar e ver comunicações
CREATE POLICY "professor_comunicacoes" ON comunicacoes
    FOR ALL
    USING (
        remetente_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'professor'
        )
        OR
        (
            escola_id IN (
                SELECT escola_id FROM usuarios
                WHERE auth_user_id = auth.uid()
                AND funcao = 'professor'
            )
            AND (
                destinatarios IS NULL
                OR destinatarios @> jsonb_build_array(
                    (SELECT id::text FROM usuarios WHERE auth_user_id = auth.uid())
                )
            )
        )
    )
    WITH CHECK (
        remetente_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'professor'
        )
    );

-- Alunos: apenas comunicações direcionadas a eles
CREATE POLICY "aluno_comunicacoes_destinadas" ON comunicacoes
    FOR SELECT
    USING (
        escola_id IN (
            SELECT escola_id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'aluno'
        )
        AND (
            destinatarios IS NULL
            OR destinatarios @> jsonb_build_array(
                (SELECT id::text FROM usuarios WHERE auth_user_id = auth.uid())
            )
        )
    );

-- =============================================
-- RLS PARA TABELA FINANCEIRO
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "admin_secretario_financeiro_full" ON financeiro
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Alunos: apenas seus próprios registros financeiros
CREATE POLICY "aluno_financeiro_own" ON financeiro
    FOR SELECT
    USING (
        aluno_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao = 'aluno'
        )
    );

-- =============================================
-- ÍNDICES PARA PERFORMANCE DAS RLS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_funcao ON usuarios(auth_user_id, funcao) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_professor_ativo ON professor_disciplinas(professor_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_aluno_turmas_status_ativo ON aluno_turmas(aluno_id, turma_id) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_comunicacoes_destinatarios ON comunicacoes USING GIN(destinatarios);

COMMIT;