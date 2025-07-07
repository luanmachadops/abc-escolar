-- Script de teste para verificar RLS e funcionalidade do sistema
-- Inserir dados de teste para verificar se as políticas RLS estão funcionando

BEGIN;

-- 1. Inserir uma escola de teste
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

-- 2. Criar usuário de teste no auth.users (simulando cadastro)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- 3. Inserir usuário admin na tabela usuarios
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
) VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Administrador Teste',
  'admin@escolateste.com.br',
  '(11) 9876-5432',
  'admin',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- 4. Inserir um professor de teste
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '123e4567-e89b-12d3-a456-426614174002',
  'professor@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{}'
) ON CONFLICT (id) DO NOTHING;

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
) VALUES (
  '123e4567-e89b-12d3-a456-426614174003',
  '123e4567-e89b-12d3-a456-426614174002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Professor Teste',
  'professor@escolateste.com.br',
  '(11) 9876-5433',
  'professor',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- 5. Inserir um aluno de teste
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '123e4567-e89b-12d3-a456-426614174004',
  'aluno@escolateste.com.br',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (
  id,
  auth_user_id,
  escola_id,
  nome_completo,
  email,
  telefone,
  funcao,
  ativo,
  primeira_vez,
  ra
) VALUES (
  '123e4567-e89b-12d3-a456-426614174005',
  '123e4567-e89b-12d3-a456-426614174004',
  '550e8400-e29b-41d4-a716-446655440000',
  'Aluno Teste',
  'aluno@escolateste.com.br',
  '(11) 9876-5434',
  'aluno',
  true,
  false,
  '2024001'
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verificar se os dados foram inseridos corretamente
SELECT 'Escolas inseridas:' as info, count(*) as total FROM escolas;
SELECT 'Usuários inseridos:' as info, count(*) as total FROM usuarios;
SELECT 'Usuários auth inseridos:' as info, count(*) as total FROM auth.users WHERE email LIKE '%escolateste.com.br';

-- Testar as funções auxiliares
SELECT 'Testando funções auxiliares:' as info;
-- Estas funções só funcionam quando há um usuário autenticado
-- SELECT get_user_id() as user_id;
-- SELECT get_user_escola_id() as escola_id;
-- SELECT is_admin_or_secretary() as is_admin;

-- Verificar se as tabelas de chat foram criadas
SELECT 'Tabelas de chat:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversas', 'conversa_participantes', 'mensagens', 'mensagem_leituras');

-- Verificar políticas RLS
SELECT 'Políticas RLS ativas:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;