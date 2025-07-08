-- Script para adicionar novo usuário administrador
-- Email: luanmachadops@gmail.com
-- Senha: #Luan2025

-- 1. Inserir no auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '123e4567-e89b-12d3-a456-426614174008',
  'luanmachadops@gmail.com',
  crypt('#Luan2025', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"user_id": "123e4567-e89b-12d3-a456-426614174009", "escola_id": "550e8400-e29b-41d4-a716-446655440000", "funcao": "admin"}'
) ON CONFLICT (email) DO NOTHING;

-- 2. Inserir na tabela usuarios
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
  '123e4567-e89b-12d3-a456-426614174009',
  '123e4567-e89b-12d3-a456-426614174008',
  '550e8400-e29b-41d4-a716-446655440000',
  'Luan Machado',
  'luanmachadops@gmail.com',
  '(11) 99999-9999',
  'admin',
  true,
  false
) ON CONFLICT (email) DO NOTHING;