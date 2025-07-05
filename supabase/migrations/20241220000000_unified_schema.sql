-- =============================================
-- ABC ESCOLAR - MIGRAÇÃO FINAL E SEGURA
-- Data: 2024-12-20
-- Versão: 5.1
-- Descrição: Versão final com políticas de RLS granulares (SELECT, INSERT, UPDATE, DELETE)
--            para máxima segurança e correção do fluxo de cadastro.
-- =============================================

BEGIN;

-- =============================================
-- TIPOS E EXTENSÕES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'secretario', 'professor', 'aluno');
    END IF;
END
$$;

-- =============================================
-- ESTRUTURA DAS TABELAS (SCHEMA)
-- =============================================
CREATE TABLE IF NOT EXISTS escolas ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, nome_instituicao VARCHAR(255) NOT NULL, cnpj_cpf VARCHAR(18) NOT NULL UNIQUE, logradouro VARCHAR(255) NOT NULL, numero VARCHAR(10) NOT NULL, bairro VARCHAR(100) NOT NULL, cep VARCHAR(10) NOT NULL, cidade VARCHAR(100) NOT NULL, pais VARCHAR(100) NOT NULL DEFAULT 'Brasil', telefone VARCHAR(20), email VARCHAR(255), ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS usuarios ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, nome_completo VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, telefone VARCHAR(20), funcao user_role NOT NULL, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS cursos ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, nome VARCHAR(255) NOT NULL, descricao TEXT, duracao_meses INTEGER, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS turmas ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE, nome VARCHAR(255) NOT NULL, ano_letivo INTEGER NOT NULL, semestre INTEGER, capacidade_maxima INTEGER DEFAULT 30, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS disciplinas ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE, nome VARCHAR(255) NOT NULL, carga_horaria INTEGER NOT NULL, descricao TEXT, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS professor_disciplinas ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, professor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, disciplina_id UUID REFERENCES disciplinas(id) ON DELETE CASCADE, turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE, ano_letivo INTEGER NOT NULL, semestre INTEGER, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(professor_id, disciplina_id, turma_id) );
CREATE TABLE IF NOT EXISTS aluno_turmas ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, aluno_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE, data_matricula DATE NOT NULL DEFAULT CURRENT_DATE, status VARCHAR(20) DEFAULT 'ativo', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(aluno_id, turma_id) );
CREATE TABLE IF NOT EXISTS comunicacoes ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, remetente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, titulo VARCHAR(255) NOT NULL, conteudo TEXT NOT NULL, tipo VARCHAR(20) DEFAULT 'aviso', destinatarios JSONB, data_envio TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS financeiro ( id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE, aluno_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, tipo VARCHAR(20) NOT NULL, descricao VARCHAR(255) NOT NULL, valor DECIMAL(10,2) NOT NULL, data_vencimento DATE NOT NULL, data_pagamento DATE, status VARCHAR(20) DEFAULT 'pendente', observacoes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW() );

-- =============================================
-- ÍNDICES ESTRATÉGICOS
-- =============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_escola_funcao ON usuarios(escola_id, funcao) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_aluno_turmas_aluno_status ON aluno_turmas(aluno_id, status);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_professor ON professor_disciplinas(professor_id, ativo);

-- =============================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =============================================
CREATE OR REPLACE FUNCTION get_user_escola_id() RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT escola_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1; $$;
CREATE OR REPLACE FUNCTION get_user_id() RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1; $$;
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT funcao FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1; $$;
CREATE OR REPLACE FUNCTION is_admin_or_secretary() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS (SELECT 1 FROM usuarios WHERE auth_user_id = auth.uid() AND funcao IN ('admin', 'secretario') AND ativo = true); $$;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
DO $$
DECLARE
  tbl_name TEXT;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY['escolas', 'usuarios', 'cursos', 'turmas', 'disciplinas', 'aluno_turmas', 'financeiro']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_' || tbl_name || '_updated_at') THEN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl_name, tbl_name);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION sync_user_metadata() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE auth.users SET raw_user_meta_data = jsonb_build_object('user_id', NEW.id, 'escola_id', NEW.escola_id, 'funcao', NEW.funcao) WHERE id = NEW.auth_user_id; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON usuarios;
CREATE TRIGGER sync_user_metadata_trigger AFTER INSERT OR UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION sync_user_metadata();

-- =============================================
-- LIMPEZA E HABILITAÇÃO DE RLS
-- =============================================
-- Limpar políticas antigas de todas as tabelas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END;
$$;

-- Habilitar RLS em todas as tabelas
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
-- POLÍTICAS RLS GRANULARES E SEGURAS (V5.0)
-- =============================================

-- Tabela: escolas (Políticas para Cadastro Público e Gestão)
CREATE POLICY "public_insert_for_signup" ON escolas FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_for_signup" ON escolas FOR SELECT USING (true);
CREATE POLICY "admin_update_escola" ON escolas FOR UPDATE USING (is_admin_or_secretary() AND id = get_user_escola_id());
CREATE POLICY "admin_delete_escola" ON escolas FOR DELETE USING (is_admin_or_secretary() AND id = get_user_escola_id());

-- Tabela: usuarios (Políticas que Corrigem o Erro de Cadastro)
CREATE POLICY "user_insert" ON usuarios FOR INSERT WITH CHECK (auth_user_id = auth.uid() OR is_admin_or_secretary());
CREATE POLICY "user_update" ON usuarios FOR UPDATE USING (auth_user_id = auth.uid() OR is_admin_or_secretary());
CREATE POLICY "user_delete" ON usuarios FOR DELETE USING (is_admin_or_secretary() AND escola_id = get_user_escola_id());
CREATE POLICY "user_read" ON usuarios FOR SELECT USING (
    is_admin_or_secretary() OR
    (get_user_role() = 'professor' AND escola_id = get_user_escola_id()) OR
    (auth_user_id = auth.uid())
);

-- Tabela: cursos
CREATE POLICY "cursos_read" ON cursos FOR SELECT USING (escola_id = get_user_escola_id());
CREATE POLICY "cursos_manage" ON cursos FOR ALL USING (is_admin_or_secretary() AND escola_id = get_user_escola_id());

-- Tabela: turmas
CREATE POLICY "turmas_read" ON turmas FOR SELECT USING (escola_id = get_user_escola_id());
CREATE POLICY "turmas_manage" ON turmas FOR ALL USING (is_admin_or_secretary() AND escola_id = get_user_escola_id());

-- Tabela: disciplinas
CREATE POLICY "disciplinas_read" ON disciplinas FOR SELECT USING (escola_id = get_user_escola_id());
CREATE POLICY "disciplinas_manage" ON disciplinas FOR ALL USING (is_admin_or_secretary() AND escola_id = get_user_escola_id());

-- Tabela: professor_disciplinas (associações)
CREATE POLICY "pd_read" ON professor_disciplinas FOR SELECT USING (is_admin_or_secretary() OR professor_id = get_user_id());
CREATE POLICY "pd_manage" ON professor_disciplinas FOR ALL USING (is_admin_or_secretary());

-- Tabela: aluno_turmas (matrículas)
CREATE POLICY "at_read" ON aluno_turmas FOR SELECT USING (
    is_admin_or_secretary() OR
    aluno_id = get_user_id() OR
    (get_user_role() = 'professor' AND EXISTS (
        SELECT 1 FROM professor_disciplinas pd WHERE pd.turma_id = aluno_turmas.turma_id AND pd.professor_id = get_user_id()
    ))
);
CREATE POLICY "at_manage" ON aluno_turmas FOR ALL USING (is_admin_or_secretary());

-- Tabela: comunicacoes
CREATE POLICY "comunicacoes_read" ON comunicacoes FOR SELECT USING (escola_id = get_user_escola_id());
CREATE POLICY "comunicacoes_insert" ON comunicacoes FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'secretario', 'professor') AND remetente_id = get_user_id());
CREATE POLICY "comunicacoes_update" ON comunicacoes FOR UPDATE USING (is_admin_or_secretary() OR remetente_id = get_user_id());
CREATE POLICY "comunicacoes_delete" ON comunicacoes FOR DELETE USING (is_admin_or_secretary() OR remetente_id = get_user_id());

-- Tabela: financeiro
CREATE POLICY "financeiro_read" ON financeiro FOR SELECT USING (is_admin_or_secretary() OR (get_user_role() = 'aluno' AND aluno_id = get_user_id()));
CREATE POLICY "financeiro_manage" ON financeiro FOR ALL USING (is_admin_or_secretary());


-- =============================================
-- MELHORIAS ADICIONAIS - VALIDAÇÕES E AUDITORIA
-- =============================================

-- Validações de dados com constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_cnpj_format') THEN
    ALTER TABLE escolas ADD CONSTRAINT check_cnpj_format 
      CHECK (cnpj_cpf ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$' OR cnpj_cpf ~ '^\d{14}$' OR cnpj_cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$' OR cnpj_cpf ~ '^\d{11}$');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
    ALTER TABLE usuarios ADD CONSTRAINT check_email_format 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_cep_format') THEN
    ALTER TABLE escolas ADD CONSTRAINT check_cep_format 
      CHECK (cep ~ '^\d{5}-?\d{3}$');
  END IF;
END;
$$;

-- Tabela de auditoria para ações críticas
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES usuarios(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_comunicacoes_data_tipo ON comunicacoes(data_envio, tipo) 
  WHERE escola_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_vencimento_status ON financeiro(data_vencimento, status) 
  WHERE status != 'cancelado';

CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action, created_at);

CREATE INDEX IF NOT EXISTS idx_escolas_cnpj ON escolas(cnpj_cpf) WHERE ativo = true;

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (get_user_id(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (get_user_id(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (get_user_id(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Aplicar triggers de auditoria em tabelas críticas
DO $$
DECLARE
  tbl_name TEXT;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY['usuarios', 'escolas', 'financeiro']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_' || tbl_name) THEN
      EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();', tbl_name, tbl_name);
    END IF;
  END LOOP;
END;
$$;

-- Políticas RLS para audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read" ON audit_log FOR SELECT
  USING (is_admin_or_secretary());

-- Função para limpeza automática de logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

COMMIT;

-- =============================================
-- MIGRAÇÃO FINAL COM MELHORIAS IMPLEMENTADAS
-- Versão: 5.1 - Produção Ready
-- =============================================