-- Migração para corrigir recursão infinita nas políticas RLS do chat
-- Data: 2024-12-24
-- Descrição: Remove referências circulares entre conversas e conversa_participantes

BEGIN;

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "participantes_read" ON conversa_participantes;
DROP POLICY IF EXISTS "participantes_insert" ON conversa_participantes;
DROP POLICY IF EXISTS "participantes_update" ON conversa_participantes;
DROP POLICY IF EXISTS "participantes_delete" ON conversa_participantes;

DROP POLICY IF EXISTS "conversas_read" ON conversas;
DROP POLICY IF EXISTS "mensagens_read" ON mensagens;
DROP POLICY IF EXISTS "mensagens_insert" ON mensagens;

-- Recriar políticas sem recursão

-- Política simplificada para participantes (sem verificar conversas)
CREATE POLICY "participantes_read" ON conversa_participantes FOR SELECT USING (
  usuario_id = get_user_id() OR is_admin_or_secretary()
);

CREATE POLICY "participantes_insert" ON conversa_participantes FOR INSERT WITH CHECK (
  is_admin_or_secretary() OR 
  (SELECT criado_por FROM conversas WHERE id = conversa_id) = get_user_id()
);

CREATE POLICY "participantes_update" ON conversa_participantes FOR UPDATE USING (
  usuario_id = get_user_id() OR is_admin_or_secretary()
);

CREATE POLICY "participantes_delete" ON conversa_participantes FOR DELETE USING (
  usuario_id = get_user_id() OR is_admin_or_secretary()
);

-- Política simplificada para conversas (sem verificar participantes)
CREATE POLICY "conversas_read" ON conversas FOR SELECT USING (
  escola_id = get_user_escola_id() AND (
    criado_por = get_user_id() OR
    is_admin_or_secretary()
  )
);

-- Políticas simplificadas para mensagens
CREATE POLICY "mensagens_read" ON mensagens FOR SELECT USING (
  -- Verificar se o usuário é participante através de uma subconsulta simples
  EXISTS (
    SELECT 1 FROM conversa_participantes cp 
    WHERE cp.conversa_id = mensagens.conversa_id 
    AND cp.usuario_id = get_user_id() 
    AND cp.ativo = true
  ) OR is_admin_or_secretary()
);

CREATE POLICY "mensagens_insert" ON mensagens FOR INSERT WITH CHECK (
  remetente_id = get_user_id() AND
  EXISTS (
    SELECT 1 FROM conversa_participantes cp 
    WHERE cp.conversa_id = mensagens.conversa_id 
    AND cp.usuario_id = get_user_id() 
    AND cp.ativo = true
  )
);

-- Criar função auxiliar para verificar participação em conversa
CREATE OR REPLACE FUNCTION is_conversa_participant(conversa_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversa_participantes 
    WHERE conversa_id = conversa_uuid 
    AND usuario_id = user_uuid 
    AND ativo = true
  );
END;
$$;

-- Política alternativa para conversas usando a função auxiliar
DROP POLICY IF EXISTS "conversas_read" ON conversas;
CREATE POLICY "conversas_read" ON conversas FOR SELECT USING (
  escola_id = get_user_escola_id() AND (
    criado_por = get_user_id() OR
    is_admin_or_secretary() OR
    is_conversa_participant(id, get_user_id())
  )
);

COMMIT;