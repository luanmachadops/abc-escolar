-- =============================================
-- MIGRAÇÃO: Correção de Recursão Infinita nas RLS
-- Data: 2024-12-19
-- Descrição: Corrige recursão infinita nas políticas
--            da tabela usuarios usando auth.jwt()
-- =============================================

BEGIN;

-- =============================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- =============================================

-- Remove políticas que causam recursão
DROP POLICY IF EXISTS "admin_secretario_usuarios_full" ON usuarios;
DROP POLICY IF EXISTS "professor_usuarios_limited" ON usuarios;
DROP POLICY IF EXISTS "aluno_self_only" ON usuarios;
DROP POLICY IF EXISTS "usuario_update_self" ON usuarios;

-- Remove políticas de outras tabelas que dependem de usuarios
DROP POLICY IF EXISTS "secretario_escola_read" ON escolas;
DROP POLICY IF EXISTS "professor_aluno_cursos_read" ON cursos;
DROP POLICY IF EXISTS "professor_turmas_assigned" ON turmas;
DROP POLICY IF EXISTS "aluno_turmas_enrolled" ON turmas;
DROP POLICY IF EXISTS "professor_disciplinas_assigned" ON disciplinas;
DROP POLICY IF EXISTS "aluno_disciplinas_turma" ON disciplinas;
DROP POLICY IF EXISTS "professor_own_assignments" ON professor_disciplinas;
DROP POLICY IF EXISTS "professor_alunos_turmas" ON aluno_turmas;
DROP POLICY IF EXISTS "aluno_own_matriculas" ON aluno_turmas;

-- =============================================
-- FUNÇÕES AUXILIARES SEM RECURSÃO
-- =============================================

-- Função para obter dados do usuário atual usando auth.jwt()
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'funcao')::text,
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
    (auth.jwt() ->> 'user_metadata' ->> 'escola_id')::uuid,
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
    (auth.jwt() ->> 'user_metadata' ->> 'user_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - USUARIOS
-- =============================================

-- Admins e secretários veem todos os usuários da escola
CREATE POLICY "admin_secretario_usuarios_full_v2" ON usuarios
    FOR ALL
    USING (
        get_current_user_role() IN ('admin', 'secretario')
        AND escola_id = get_current_user_escola()
    )
    WITH CHECK (
        get_current_user_role() IN ('admin', 'secretario')
        AND escola_id = get_current_user_escola()
    );

-- Professores veem apenas alunos de suas turmas e outros professores da escola
CREATE POLICY "professor_usuarios_limited_v2" ON usuarios
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND (
            -- Vê outros professores da mesma escola
            (funcao = 'professor' AND escola_id = get_current_user_escola())
            OR
            -- Vê alunos de suas turmas (usando subquery sem recursão)
            (funcao = 'aluno' AND id IN (
                SELECT at.aluno_id 
                FROM aluno_turmas at
                JOIN professor_disciplinas pd ON pd.turma_id = at.turma_id
                WHERE pd.professor_id = get_current_user_id()
                AND pd.ativo = true
                AND at.status = 'ativo'
            ))
            OR
            -- Vê a si mesmo
            (id = get_current_user_id())
        )
    );

-- Alunos veem apenas a si mesmos
CREATE POLICY "aluno_self_only_v2" ON usuarios
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND id = get_current_user_id()
    );

-- Usuários podem atualizar seus próprios dados básicos
CREATE POLICY "usuario_update_self_v2" ON usuarios
    FOR UPDATE
    USING (id = get_current_user_id())
    WITH CHECK (id = get_current_user_id());

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - ESCOLAS
-- =============================================

-- Secretários veem apenas sua escola
CREATE POLICY "secretario_escola_read_v2" ON escolas
    FOR SELECT
    USING (
        get_current_user_role() = 'secretario'
        AND id = get_current_user_escola()
    );

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - CURSOS
-- =============================================

-- Professores e alunos: apenas leitura da própria escola
CREATE POLICY "professor_aluno_cursos_read_v2" ON cursos
    FOR SELECT
    USING (
        get_current_user_role() IN ('professor', 'aluno')
        AND escola_id = get_current_user_escola()
    );

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - TURMAS
-- =============================================

-- Professores: apenas turmas onde lecionam
CREATE POLICY "professor_turmas_assigned_v2" ON turmas
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
CREATE POLICY "aluno_turmas_enrolled_v2" ON turmas
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
-- NOVAS POLÍTICAS SEM RECURSÃO - DISCIPLINAS
-- =============================================

-- Professores: apenas disciplinas que lecionam
CREATE POLICY "professor_disciplinas_assigned_v2" ON disciplinas
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
CREATE POLICY "aluno_disciplinas_turma_v2" ON disciplinas
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND curso_id IN (
            SELECT t.curso_id 
            FROM turmas t
            JOIN aluno_turmas at ON at.turma_id = t.id
            WHERE at.aluno_id = get_current_user_id()
            AND at.status = 'ativo'
        )
    );

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - PROFESSOR_DISCIPLINAS
-- =============================================

-- Professores: apenas suas próprias atribuições
CREATE POLICY "professor_own_assignments_v2" ON professor_disciplinas
    FOR SELECT
    USING (
        get_current_user_role() = 'professor'
        AND professor_id = get_current_user_id()
    );

-- =============================================
-- NOVAS POLÍTICAS SEM RECURSÃO - ALUNO_TURMAS
-- =============================================

-- Professores: alunos de suas turmas
CREATE POLICY "professor_alunos_turmas_v2" ON aluno_turmas
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
CREATE POLICY "aluno_own_matriculas_v2" ON aluno_turmas
    FOR SELECT
    USING (
        get_current_user_role() = 'aluno'
        AND aluno_id = get_current_user_id()
    );

-- =============================================
-- TRIGGER PARA ATUALIZAR METADATA NO JWT
-- =============================================

-- Função para atualizar metadata do usuário no auth
CREATE OR REPLACE FUNCTION update_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualiza metadata no auth.users quando usuário é inserido/atualizado
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE auth.users
        SET user_metadata = jsonb_build_object(
            'user_id', NEW.id,
            'funcao', NEW.funcao,
            'escola_id', NEW.escola_id,
            'nome', NEW.nome
        )
        WHERE id = NEW.auth_user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplica trigger para sincronizar metadata
DROP TRIGGER IF EXISTS sync_user_metadata ON usuarios;
CREATE TRIGGER sync_user_metadata
    AFTER INSERT OR UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_user_metadata();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON FUNCTION get_current_user_role() IS 
'Obtém a função do usuário atual do JWT sem recursão';

COMMENT ON FUNCTION get_current_user_escola() IS 
'Obtém a escola do usuário atual do JWT sem recursão';

COMMENT ON FUNCTION get_current_user_id() IS 
'Obtém o ID do usuário atual do JWT sem recursão';

COMMENT ON FUNCTION update_user_metadata() IS 
'Sincroniza dados do usuário com metadata do JWT';

COMMIT;