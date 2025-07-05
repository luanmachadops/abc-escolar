-- =============================================
-- ABC ESCOLAR - ESTRUTURA DO BANCO DE DADOS
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: escolas
-- Armazena informações das instituições de ensino
-- =============================================
CREATE TABLE escolas (
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
CREATE TABLE usuarios (
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
CREATE TABLE cursos (
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
CREATE TABLE turmas (
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
CREATE TABLE disciplinas (
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
CREATE TABLE professor_disciplinas (
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
CREATE TABLE aluno_turmas (
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
CREATE TABLE comunicacoes (
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
CREATE TABLE financeiro (
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
CREATE INDEX idx_usuarios_escola_id ON usuarios(escola_id);
CREATE INDEX idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX idx_usuarios_funcao ON usuarios(funcao);
CREATE INDEX idx_cursos_escola_id ON cursos(escola_id);
CREATE INDEX idx_turmas_escola_id ON turmas(escola_id);
CREATE INDEX idx_disciplinas_escola_id ON disciplinas(escola_id);
CREATE INDEX idx_professor_disciplinas_professor_id ON professor_disciplinas(professor_id);
CREATE INDEX idx_aluno_turmas_aluno_id ON aluno_turmas(aluno_id);
CREATE INDEX idx_aluno_turmas_turma_id ON aluno_turmas(turma_id);
CREATE INDEX idx_comunicacoes_escola_id ON comunicacoes(escola_id);
CREATE INDEX idx_financeiro_escola_id ON financeiro(escola_id);
CREATE INDEX idx_financeiro_aluno_id ON financeiro(aluno_id);

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

CREATE TRIGGER update_escolas_updated_at BEFORE UPDATE ON escolas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aluno_turmas_updated_at BEFORE UPDATE ON aluno_turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON financeiro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

-- Política para escolas (apenas o admin da escola pode ver/editar)
CREATE POLICY "Escolas visíveis apenas para admins da própria escola" ON escolas
    FOR ALL USING (
        id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid() 
            AND funcao = 'admin'
        )
    );

-- Política para usuários (apenas usuários da mesma escola)
CREATE POLICY "Usuários visíveis apenas para mesma escola" ON usuarios
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para cursos (apenas da mesma escola)
CREATE POLICY "Cursos visíveis apenas para mesma escola" ON cursos
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para turmas (apenas da mesma escola)
CREATE POLICY "Turmas visíveis apenas para mesma escola" ON turmas
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para disciplinas (apenas da mesma escola)
CREATE POLICY "Disciplinas visíveis apenas para mesma escola" ON disciplinas
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para professor_disciplinas (professores veem apenas suas disciplinas)
CREATE POLICY "Professor vê apenas suas disciplinas" ON professor_disciplinas
    FOR ALL USING (
        professor_id IN (
            SELECT id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
        OR
        professor_id IN (
            SELECT id FROM usuarios u1
            WHERE u1.escola_id IN (
                SELECT u2.escola_id FROM usuarios u2
                WHERE u2.auth_user_id = auth.uid() 
                AND u2.funcao IN ('admin', 'secretario')
            )
        )
    );

-- Política para aluno_turmas (alunos veem apenas suas matrículas)
CREATE POLICY "Aluno vê apenas suas matrículas" ON aluno_turmas
    FOR ALL USING (
        aluno_id IN (
            SELECT id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
        OR
        aluno_id IN (
            SELECT id FROM usuarios u1
            WHERE u1.escola_id IN (
                SELECT u2.escola_id FROM usuarios u2
                WHERE u2.auth_user_id = auth.uid() 
                AND u2.funcao IN ('admin', 'secretario', 'professor')
            )
        )
    );

-- Política para comunicações (apenas da mesma escola)
CREATE POLICY "Comunicações visíveis apenas para mesma escola" ON comunicacoes
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para financeiro (apenas da mesma escola)
CREATE POLICY "Financeiro visível apenas para mesma escola" ON financeiro
    FOR ALL USING (
        escola_id IN (
            SELECT escola_id FROM usuarios 
            WHERE auth_user_id = auth.uid()
        )
        AND (
            -- Admins e secretários veem tudo
            EXISTS (
                SELECT 1 FROM usuarios 
                WHERE auth_user_id = auth.uid() 
                AND funcao IN ('admin', 'secretario')
            )
            OR
            -- Alunos veem apenas seus próprios registros
            aluno_id IN (
                SELECT id FROM usuarios 
                WHERE auth_user_id = auth.uid() 
                AND funcao = 'aluno'
            )
        )
    );

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para obter a escola do usuário logado
CREATE OR REPLACE FUNCTION get_user_escola_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT escola_id 
        FROM usuarios 
        WHERE auth_user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM usuarios 
        WHERE auth_user_id = auth.uid() 
        AND funcao = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Inserir países padrão se necessário
-- INSERT INTO paises (nome) VALUES ('Brasil'), ('Argentina'), ('Chile') ON CONFLICT DO NOTHING;

COMMIT;