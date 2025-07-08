-- Arquivo de seed para dados de teste
-- Este arquivo será executado automaticamente após as migrações

-- Inserir escola de teste
INSERT INTO escolas (
  id,
  nome_instituicao,
  cnpj_cpf,
  logradouro,
  numero,
  bairro,
  cep,
  cidade,
  pais,
  telefone,
  email,
  ativo
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Teste ABC',
  '12.345.678/0001-90',
  'Rua das Flores',
  '123',
  'Centro',
  '12345-678',
  'São Paulo',
  'Brasil',
  '(11) 1234-5678',
  'contato@escolateste.com.br',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuários de teste no auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES 
(
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"user_id": "123e4567-e89b-12d3-a456-426614174001", "escola_id": "550e8400-e29b-41d4-a716-446655440000", "funcao": "admin"}'
),
(
  '123e4567-e89b-12d3-a456-426614174002',
  'professor@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"user_id": "123e4567-e89b-12d3-a456-426614174003", "escola_id": "550e8400-e29b-41d4-a716-446655440000", "funcao": "professor"}'
),
(
  '123e4567-e89b-12d3-a456-426614174004',
  'aluno@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"user_id": "123e4567-e89b-12d3-a456-426614174005", "escola_id": "550e8400-e29b-41d4-a716-446655440000", "funcao": "aluno"}'
)

-- Adicione estas linhas após os usuários existentes no auth.users:
,
(
  '123e4567-e89b-12d3-a456-426614174008',
  'luanmachadops@gmail.com',
  crypt('#Luan2025', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"user_id": "123e4567-e89b-12d3-a456-426614174009", "escola_id": "550e8400-e29b-41d4-a716-446655440000", "funcao": "admin"}'
)

-- E adicione na seção usuarios:
,
(
  '123e4567-e89b-12d3-a456-426614174009',
  '123e4567-e89b-12d3-a456-426614174008',
  '550e8400-e29b-41d4-a716-446655440000',
  'Luan Machado',
  'luanmachadops@gmail.com',
  '(11) 99999-9999',
  'admin',
  true,
  false
)

ON CONFLICT (id) DO NOTHING;

-- Inserir usuários na tabela usuarios
INSERT INTO usuarios (
  id,
  auth_user_id,
  escola_id,
  nome_completo,
  email,
  telefone,
  funcao,
  ativo,
  primeira_vez
) VALUES 
(
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Administrador Teste',
  'admin@escolateste.com.br',
  '(11) 9876-5432',
  'admin',
  true,
  false
),
(
  '123e4567-e89b-12d3-a456-426614174003',
  '123e4567-e89b-12d3-a456-426614174002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Professor Teste',
  'professor@escolateste.com.br',
  '(11) 9876-5433',
  'professor',
  true,
  false
),
(
  '123e4567-e89b-12d3-a456-426614174005',
  '123e4567-e89b-12d3-a456-426614174004',
  '550e8400-e29b-41d4-a716-446655440000',
  'Aluno Teste',
  'aluno@escolateste.com.br',
  '(11) 9876-5434',
  'aluno',
  true,
  false
)
ON CONFLICT (id) DO NOTHING;

-- Inserir curso de teste
INSERT INTO cursos (
  id,
  escola_id,
  nome,
  descricao,
  duracao_meses,
  ativo
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Ensino Fundamental',
  'Curso de Ensino Fundamental completo',
  108,
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir turma de teste
INSERT INTO turmas (
  id,
  escola_id,
  curso_id,
  nome,
  ano_letivo,
  semestre,
  ativo
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  '5º Ano A',
  2024,
  1,
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir disciplina de teste
INSERT INTO disciplinas (
  id,
  escola_id,
  nome,
  descricao,
  carga_horaria,
  ativo
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'Matemática',
  'Disciplina de Matemática para Ensino Fundamental',
  200,
  true
) ON CONFLICT (id) DO NOTHING;

-- Associar professor à disciplina
INSERT INTO professor_disciplinas (
  id,
  professor_id,
  disciplina_id,
  turma_id,
  ano_letivo,
  ativo
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '123e4567-e89b-12d3-a456-426614174003',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440002',
  2024,
  true
) ON CONFLICT (id) DO NOTHING;

-- Matricular aluno na turma
INSERT INTO aluno_turmas (
  id,
  aluno_id,
  turma_id,
  data_matricula,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '123e4567-e89b-12d3-a456-426614174005',
  '550e8400-e29b-41d4-a716-446655440002',
  NOW(),
  'ativo'
) ON CONFLICT (id) DO NOTHING;

-- Inserir comunicação de teste
INSERT INTO comunicacoes (
  id,
  escola_id,
  remetente_id,
  titulo,
  conteudo,
  tipo,
  data_envio
) VALUES (
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440000',
  '123e4567-e89b-12d3-a456-426614174001',
  'Bem-vindos ao Sistema',
  'Esta é uma comunicação de teste para verificar o funcionamento do sistema.',
  'geral',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir registro financeiro de teste
INSERT INTO financeiro (
  id,
  escola_id,
  aluno_id,
  descricao,
  valor,
  tipo,
  data_vencimento,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440000',
  '123e4567-e89b-12d3-a456-426614174005',
  'Mensalidade Janeiro 2024',
  500.00,
  'mensalidade',
  '2024-01-31',
  'pendente'
) ON CONFLICT (id) DO NOTHING;