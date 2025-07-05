-- =============================================
-- ABC ESCOLAR - MIGRAÇÃO COMPLETA CONSOLIDADA
-- Data: 2024-12-20
-- Versão: 1.0
-- Descrição: Migração completa que substitui todas as anteriores
--            Inclui schema, RLS e políticas sem conflitos
-- =============================================

BEGIN;

-- =============================================
-- EXTENSÕES NECESSÁRIAS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: escolas
-- Armazena informações das instituições de ensino
-- =============================================
CREATE TABLE IF NOT EXISTS escolas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_instituicao VARCHAR(255) NOT NULL,
    cnpj_cpf VARCHAR(18) NOT NULL UNIQUE,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'Brasil',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: usuarios
-- Armazena informações dos usuários do sistema
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('admin', 'secretario', 'professor', 'aluno')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: cursos
-- Armazena informações dos cursos oferecidos
-- =============================================
CREATE TABLE IF NOT EXISTS cursos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_meses INTEGER,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: turmas
-- Armazena informações das turmas
-- =============================================
CREATE TABLE IF NOT EXISTS turmas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    semestre INTEGER CHECK (semestre IN (1, 2)),
    capacidade_maxima INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: disciplinas
-- Armazena informações das disciplinas
-- =============================================
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    carga_horaria INTEGER NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: professor_disciplinas
-- Relaciona professores com suas disciplinas
-- =============================================
CREATE TABLE IF NOT EXISTS professor_disciplinas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    ano_letivo INTEGER NOT NULL,
    semestre INTEGER CHECK (semestre IN (1, 2)),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professor_id, disciplina_id, turma_id, ano_letivo, semestre)
);

-- =============================================
-- TABELA: aluno_turmas
-- Relaciona alunos com suas turmas (matrículas)
-- =============================================
CREATE TABLE IF NOT EXISTS aluno_turmas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    aluno_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'trancado', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(aluno_id, turma_id)
);

-- =============================================
-- TABELA: comunicacoes
-- Armazena comunicações/avisos
-- =============================================
CREATE TABLE IF NOT EXISTS comunicacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    remetente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'aviso' CHECK (tipo IN ('aviso', 'comunicado', 'urgente')),
    destinatarios JSONB, -- Array de IDs dos destinatários
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: financeiro
-- Armazena informações financeiras
-- =============================================
CREATE TABLE IF NOT EXISTS financeiro (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mensalidade', 'matricula', 'material', 'outros')),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_escola_id ON usuarios(escola_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao);
CREATE INDEX IF NOT EXISTS idx_cursos_escola_id ON cursos(escola_id);
CREATE INDEX IF NOT EXISTS idx_turmas_escola_id ON turmas(escola_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_escola_id ON disciplinas(escola_id);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_professor_id ON professor_disciplinas(professor_id);
CREATE INDEX IF NOT EXISTS idx_aluno_turmas_aluno_id ON aluno_turmas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_turmas_turma_id ON aluno_turmas(turma_id);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_escola_id ON comunicacoes(escola_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_escola_id ON financeiro(escola_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_aluno_id ON financeiro(aluno_id);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_escolas_updated_at') THEN
        CREATE TRIGGER update_escolas_updated_at BEFORE UPDATE ON escolas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usuarios_updated_at') THEN
        CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cursos_updated_at') THEN
        CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_turmas_updated_at') THEN
        CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_disciplinas_updated_at') THEN
        CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_aluno_turmas_updated_at') THEN
        CREATE TRIGGER update_aluno_turmas_updated_at BEFORE UPDATE ON aluno_turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_financeiro_updated_at') THEN
        CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON financeiro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- =============================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =============================================

-- Função para obter dados do usuário atual usando auth.jwt()
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'funcao')::text,
    'guest'
  );
$$;

-- Função para obter escola do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_escola()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'escola_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Função para obter ID do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Função para verificar se usuário é admin ou secretário
CREATE OR REPLACE FUNCTION is_admin_or_secretary()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_current_user_role() IN ('admin', 'secretario');
$$;

-- Função para validar cadastro de usuário
CREATE OR REPLACE FUNCTION validate_user_registration(
    p_email text,
    p_escola_id uuid,
    p_funcao text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifica se o email já existe
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email já cadastrado';
    END IF;
    
    -- Verifica se a escola existe
    IF NOT EXISTS (SELECT 1 FROM escolas WHERE id = p_escola_id AND ativo = true) THEN
        RAISE EXCEPTION 'Escola não encontrada ou inativa';
    END IF;
    
    -- Valida função
    IF p_funcao NOT IN ('admin', 'secretario', 'professor', 'aluno') THEN
        RAISE EXCEPTION 'Função inválida';
    END IF;
    
    RETURN true;
END;
$$;

-- =============================================
-- HABILITAR RLS NAS TABELAS
-- =============================================
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - ESCOLAS
-- =============================================

-- Permite leitura pública das escolas (necessário para cadastro)
CREATE POLICY "escolas_public_read" ON escolas
    FOR SELECT
    USING (true);

-- Permite inserção pública (processo de cadastro)
CREATE POLICY "escolas_public_insert" ON escolas
    FOR INSERT
    WITH CHECK (true);

-- Admins podem atualizar dados da escola
CREATE POLICY "escolas_admin_update" ON escolas
    FOR UPDATE
    USING (is_admin_or_secretary() AND id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND id = get_current_user_escola());

-- =============================================
-- POLÍTICAS RLS - USUARIOS
-- =============================================

-- Permite inserção durante cadastro ou por admins/secretários
CREATE POLICY "usuarios_insert" ON usuarios
    FOR INSERT
    WITH CHECK (
        -- Cadastro público (sem autenticação)
        auth.uid() IS NULL
        OR
        -- Admin/secretário criando usuários da mesma escola
        (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    );

-- Admins e secretários veem todos os usuários da escola
CREATE POLICY "usuarios_admin_secretario_full" ON usuarios
    FOR SELECT
    USING (
        is_admin_or_secretary()
        AND escola_id = get_current_user_escola()
    );

-- Professores veem alunos de suas turmas e outros professores
CREATE POLICY "usuarios_professor_limited" ON usuarios
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND (
            -- Outros professores da mesma escola
            (funcao = 'professor' AND escola_id = get_current_user_escola())
            OR
            -- Alunos de suas turmas
            (funcao = 'aluno' AND id IN (
                SELECT at.aluno_id 
                FROM aluno_turmas at
                JOIN professor_disciplinas pd ON pd.turma_id = at.turma_id
                WHERE pd.professor_id = get_current_user_id()
                AND pd.ativo = true
                AND at.status = 'ativo'
            ))
            OR
            -- A si mesmo
            (id = get_current_user_id())
        )
    );

-- Alunos veem apenas a si mesmos
CREATE POLICY "usuarios_aluno_self" ON usuarios
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND id = get_current_user_id()
    );

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "usuarios_update_self" ON usuarios
    FOR UPDATE
    USING (id = get_current_user_id())
    WITH CHECK (id = get_current_user_id());

-- Admins podem atualizar usuários da escola
CREATE POLICY "usuarios_admin_update" ON usuarios
    FOR UPDATE
    USING (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND escola_id = get_current_user_escola());

-- =============================================
-- POLÍTICAS RLS - CURSOS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "cursos_admin_secretario_full" ON cursos
    FOR ALL
    USING (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND escola_id = get_current_user_escola());

-- Professores e alunos: apenas leitura
CREATE POLICY "cursos_professor_aluno_read" ON cursos
    FOR SELECT
    USING (
        get_current_user_role() IN ('professor', 'aluno')
        AND escola_id = get_current_user_escola()
    );

-- =============================================
-- POLÍTICAS RLS - TURMAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "turmas_admin_secretario_full" ON turmas
    FOR ALL
    USING (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND escola_id = get_current_user_escola());

-- Professores: apenas turmas onde lecionam
CREATE POLICY "turmas_professor_assigned" ON turmas
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND id IN (
            SELECT pd.turma_id 
            FROM professor_disciplinas pd
            WHERE pd.professor_id = get_current_user_id()
            AND pd.ativo = true
        )
    );

-- Alunos: apenas turmas onde estão matriculados
CREATE POLICY "turmas_aluno_enrolled" ON turmas
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND id IN (
            SELECT at.turma_id 
            FROM aluno_turmas at
            WHERE at.aluno_id = get_current_user_id()
            AND at.status = 'ativo'
        )
    );

-- =============================================
-- POLÍTICAS RLS - DISCIPLINAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "disciplinas_admin_secretario_full" ON disciplinas
    FOR ALL
    USING (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND escola_id = get_current_user_escola());

-- Professores: apenas disciplinas que lecionam
CREATE POLICY "disciplinas_professor_assigned" ON disciplinas
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND id IN (
            SELECT pd.disciplina_id 
            FROM professor_disciplinas pd
            WHERE pd.professor_id = get_current_user_id()
            AND pd.ativo = true
        )
    );

-- Alunos: disciplinas de suas turmas
CREATE POLICY "disciplinas_aluno_turma" ON disciplinas
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND id IN (
            SELECT d.id
            FROM disciplinas d
            JOIN professor_disciplinas pd ON pd.disciplina_id = d.id
            JOIN aluno_turmas at ON at.turma_id = pd.turma_id
            WHERE at.aluno_id = get_current_user_id()
            AND at.status = 'ativo'
            AND pd.ativo = true
        )
    );

-- =============================================
-- POLÍTICAS RLS - PROFESSOR_DISCIPLINAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "prof_disc_admin_secretario_full" ON professor_disciplinas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: apenas suas próprias atribuições
CREATE POLICY "prof_disc_professor_own" ON professor_disciplinas
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND professor_id = get_current_user_id()
    );

-- =============================================
-- POLÍTICAS RLS - ALUNO_TURMAS
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "aluno_turmas_admin_secretario_full" ON aluno_turmas
    FOR ALL
    USING (is_admin_or_secretary())
    WITH CHECK (is_admin_or_secretary());

-- Professores: alunos de suas turmas
CREATE POLICY "aluno_turmas_professor_view" ON aluno_turmas
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND turma_id IN (
            SELECT pd.turma_id 
            FROM professor_disciplinas pd
            WHERE pd.professor_id = get_current_user_id()
            AND pd.ativo = true
        )
    );

-- Alunos: apenas suas próprias matrículas
CREATE POLICY "aluno_turmas_aluno_own" ON aluno_turmas
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND aluno_id = get_current_user_id()
    );

-- =============================================
-- POLÍTICAS RLS - COMUNICACOES
-- =============================================

-- Inserção por admins, secretários e professores
CREATE POLICY "comunicacoes_insert_authorized" ON comunicacoes
    FOR INSERT
    WITH CHECK (
        get_current_user_role() IN ('admin', 'secretario', 'professor')
        AND remetente_id = get_current_user_id()
        AND escola_id = get_current_user_escola()
    );

-- Leitura por todos os usuários da escola
CREATE POLICY "comunicacoes_read_escola" ON comunicacoes
    FOR SELECT
    USING (escola_id = get_current_user_escola());

-- =============================================
-- POLÍTICAS RLS - FINANCEIRO
-- =============================================

-- Admins e secretários: acesso completo
CREATE POLICY "financeiro_admin_secretario_full" ON financeiro
    FOR ALL
    USING (is_admin_or_secretary() AND escola_id = get_current_user_escola())
    WITH CHECK (is_admin_or_secretary() AND escola_id = get_current_user_escola());

-- Alunos: apenas seus próprios registros financeiros
CREATE POLICY "financeiro_aluno_own" ON financeiro
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND aluno_id = get_current_user_id()
    );

-- =============================================
-- TRIGGER PARA VALIDAÇÃO DE CADASTRO
-- =============================================

CREATE OR REPLACE FUNCTION trigger_validate_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Executa validação apenas se não for um usuário autenticado
    IF auth.uid() IS NULL THEN
        PERFORM validate_user_registration(
            NEW.email,
            NEW.escola_id,
            NEW.funcao
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_user_registration_trigger') THEN
        CREATE TRIGGER validate_user_registration_trigger
            BEFORE INSERT ON usuarios
            FOR EACH ROW
            EXECUTE FUNCTION trigger_validate_user_insert();
    END IF;
END
$$;

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE escolas IS 'Armazena informações das instituições de ensino';
COMMENT ON TABLE usuarios IS 'Armazena informações dos usuários do sistema';
COMMENT ON TABLE cursos IS 'Armazena informações dos cursos oferecidos';
COMMENT ON TABLE turmas IS 'Armazena informações das turmas';
COMMENT ON TABLE disciplinas IS 'Armazena informações das disciplinas';
COMMENT ON TABLE professor_disciplinas IS 'Relaciona professores com suas disciplinas';
COMMENT ON TABLE aluno_turmas IS 'Relaciona alunos com suas turmas (matrículas)';
COMMENT ON TABLE comunicacoes IS 'Armazena comunicações/avisos';
COMMENT ON TABLE financeiro IS 'Armazena informações financeiras';

COMMENT ON FUNCTION get_current_user_role() IS 'Obtém a função do usuário atual usando auth.jwt()';
COMMENT ON FUNCTION get_current_user_escola() IS 'Obtém a escola do usuário atual';
COMMENT ON FUNCTION get_current_user_id() IS 'Obtém o ID do usuário atual';
COMMENT ON FUNCTION is_admin_or_secretary() IS 'Verifica se o usuário é admin ou secretário';
COMMENT ON FUNCTION validate_user_registration(text, uuid, text) IS 'Valida dados de usuário durante o processo de cadastro';

COMMIT;

-- =============================================
-- MIGRAÇÃO COMPLETA FINALIZADA
-- =============================================
-- Esta migração substitui todas as anteriores:
-- - 20241219000000_initial_schema.sql
-- - 20241219000001_enhanced_rls.sql
-- - 20241219000002_insert_policies.sql
-- - 20241219000003_fix_recursion.sql
-- - 20241219000004_fix_select_escolas_policy.sql
-- =============================================