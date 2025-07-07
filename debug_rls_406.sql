-- Script de debug para erros 406 (Not Acceptable) do Supabase
-- Execute este script no Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar se o usuário atual está autenticado
SELECT auth.uid() as current_user_id;

-- 2. Verificar dados do usuário atual na tabela usuarios
SELECT 
  id,
  auth_user_id,
  escola_id,
  funcao,
  ativo
FROM usuarios 
WHERE auth_user_id = auth.uid();

-- 3. Testar as funções auxiliares de RLS
SELECT 
  get_user_escola_id() as escola_id,
  get_user_id() as user_id,
  get_user_role() as user_role,
  is_admin_or_secretary() as is_admin;

-- 4. Verificar se as políticas estão permitindo acesso
-- Teste de leitura de usuários (deve funcionar se as políticas estão corretas)
SELECT COUNT(*) as total_usuarios_visiveis
FROM usuarios;

-- 5. Teste de leitura de turmas (deve funcionar se as políticas estão corretas)
SELECT COUNT(*) as total_turmas_visiveis
FROM turmas;

-- 6. Verificar se há dados na escola do usuário
SELECT 
  e.id,
  e.nome_instituicao,
  COUNT(u.id) as total_usuarios
FROM escolas e
LEFT JOIN usuarios u ON u.escola_id = e.id
WHERE e.id = get_user_escola_id()
GROUP BY e.id, e.nome_instituicao;