-- =============================================
-- MIGRAÇÃO: Políticas de INSERT para Registro
-- Data: 2024-12-19
-- Descrição: Adiciona políticas específicas para permitir
--            INSERT durante o processo de cadastro
-- =============================================

BEGIN;

-- =============================================
-- POLÍTICAS DE INSERT PARA ESCOLAS
-- =============================================

-- Permite INSERT de escolas por usuários não autenticados (processo de cadastro)
CREATE POLICY "escola_insert_public" ON escolas
    FOR INSERT
    WITH CHECK (true); -- Qualquer um pode criar uma escola durante o cadastro

-- =============================================
-- POLÍTICAS DE INSERT PARA USUÁRIOS
-- =============================================

-- Permite INSERT de usuários durante o processo de cadastro
-- Esta política permite que usuários sejam criados mesmo sem autenticação
CREATE POLICY "usuario_insert_registration" ON usuarios
    FOR INSERT
    WITH CHECK (
        -- Permite inserção durante o cadastro (sem auth.uid())
        auth.uid() IS NULL
        OR
        -- Ou se for um admin/secretário autenticado criando outros usuários
        (
            auth.uid() IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM usuarios u
                WHERE u.auth_user_id = auth.uid()
                AND u.funcao IN ('admin', 'secretario')
                AND u.ativo = true
                AND u.escola_id = usuarios.escola_id
            )
        )
    );

-- =============================================
-- POLÍTICAS DE INSERT PARA CURSOS
-- =============================================

-- Permite INSERT de cursos apenas por admins e secretários
CREATE POLICY "curso_insert_admin_secretario" ON cursos
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- POLÍTICAS DE INSERT PARA TURMAS
-- =============================================

-- Permite INSERT de turmas apenas por admins e secretários
CREATE POLICY "turma_insert_admin_secretario" ON turmas
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- POLÍTICAS DE INSERT PARA DISCIPLINAS
-- =============================================

-- Permite INSERT de disciplinas apenas por admins e secretários
CREATE POLICY "disciplina_insert_admin_secretario" ON disciplinas
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- POLÍTICAS DE INSERT PARA PROFESSOR_DISCIPLINAS
-- =============================================

-- Permite INSERT de atribuições professor-disciplina apenas por admins e secretários
CREATE POLICY "prof_disc_insert_admin_secretario" ON professor_disciplinas
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- POLÍTICAS DE INSERT PARA ALUNO_TURMAS
-- =============================================

-- Permite INSERT de matrículas apenas por admins e secretários
CREATE POLICY "matricula_insert_admin_secretario" ON aluno_turmas
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- POLÍTICAS DE INSERT PARA COMUNICACOES
-- =============================================

-- Permite INSERT de comunicações por admins, secretários e professores
CREATE POLICY "comunicacao_insert_authorized" ON comunicacoes
    FOR INSERT
    WITH CHECK (
        remetente_id IN (
            SELECT id FROM usuarios
            WHERE auth_user_id = auth.uid()
            AND funcao IN ('admin', 'secretario', 'professor')
            AND ativo = true
        )
    );

-- =============================================
-- POLÍTICAS DE INSERT PARA FINANCEIRO
-- =============================================

-- Permite INSERT de registros financeiros apenas por admins e secretários
CREATE POLICY "financeiro_insert_admin_secretario" ON financeiro
    FOR INSERT
    WITH CHECK (is_admin_or_secretary());

-- =============================================
-- FUNÇÃO AUXILIAR PARA VALIDAR CADASTRO
-- =============================================

-- Função para validar se um usuário pode ser criado
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
    
    -- Se chegou até aqui, está válido
    RETURN true;
END;
$$;

-- =============================================
-- TRIGGER PARA VALIDAÇÃO DE CADASTRO
-- =============================================

-- Trigger para validar dados antes do INSERT de usuários
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

-- Aplica o trigger na tabela usuarios
DROP TRIGGER IF EXISTS validate_user_registration_trigger ON usuarios;
CREATE TRIGGER validate_user_registration_trigger
    BEFORE INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validate_user_insert();

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON POLICY "escola_insert_public" ON escolas IS 
'Permite criação de escolas durante o processo de cadastro público';

COMMENT ON POLICY "usuario_insert_registration" ON usuarios IS 
'Permite criação de usuários durante cadastro (sem autenticação) ou por admins/secretários';

COMMENT ON FUNCTION validate_user_registration(text, uuid, text) IS 
'Valida dados de usuário durante o processo de cadastro';

COMMENT ON FUNCTION trigger_validate_user_insert() IS 
'Trigger que executa validações antes de inserir usuários';

COMMIT;