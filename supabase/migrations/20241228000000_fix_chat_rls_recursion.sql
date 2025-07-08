-- Migração para corrigir recursão infinita nas políticas RLS do chat
-- Data: 2024-12-28
-- Descrição: Remove recursão entre conversas e conversa_participantes

BEGIN;

-- =============================================
-- CORRIGIR RECURSÃO INFINITA NO CHAT
-- =============================================

-- Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "conversas_escola_isolation" ON conversas;
DROP POLICY IF EXISTS "participantes_escola_isolation" ON conversa_participantes;
DROP POLICY IF EXISTS "mensagens_escola_isolation" ON mensagens;

-- Remover políticas antigas do chat que podem estar conflitando
DROP POLICY IF EXISTS "conversas_read" ON conversas;
DROP POLICY IF EXISTS "participantes_read" ON conversa_participantes;
DROP POLICY IF EXISTS "mensagens_read" ON mensagens;
DROP POLICY IF EXISTS "mensagens_insert" ON mensagens;

-- =============================================
-- POLÍTICAS SIMPLIFICADAS SEM RECURSÃO
-- =============================================

-- Política para conversas: verificação direta sem subconsultas recursivas
DROP POLICY IF EXISTS "conversas_read_safe" ON conversas;
CREATE POLICY "conversas_read_safe" ON conversas FOR SELECT USING (
  escola_id = get_user_escola_id() AND (
    -- Admin/Secretário vê todas as conversas da escola
    get_user_role() IN ('admin', 'secretario') OR
    -- Criador da conversa
    criado_por = get_user_id()
  )
);

DROP POLICY IF EXISTS "conversas_insert" ON conversas;
CREATE POLICY "conversas_insert" ON conversas FOR INSERT WITH CHECK (
  escola_id = get_user_escola_id() AND criado_por = get_user_id()
);

DROP POLICY IF EXISTS "conversas_update" ON conversas;
CREATE POLICY "conversas_update" ON conversas FOR UPDATE USING (
  escola_id = get_user_escola_id() AND (
    get_user_role() IN ('admin', 'secretario') OR
    criado_por = get_user_id()
  )
);

-- Política para participantes: verificação simples sem recursão
DROP POLICY IF EXISTS "participantes_read_safe" ON conversa_participantes;
CREATE POLICY "participantes_read_safe" ON conversa_participantes FOR SELECT USING (
  -- Usuário vê apenas suas próprias participações
  usuario_id = get_user_id() OR
  -- Admin/Secretário vê todos os participantes (verificação será feita na conversa)
  get_user_role() IN ('admin', 'secretario')
);

DROP POLICY IF EXISTS "participantes_insert" ON conversa_participantes;
CREATE POLICY "participantes_insert" ON conversa_participantes FOR INSERT WITH CHECK (
  -- Apenas admin/secretário ou criador da conversa pode adicionar participantes
  get_user_role() IN ('admin', 'secretario') OR
  EXISTS (
    SELECT 1 FROM conversas c 
    WHERE c.id = conversa_id 
    AND c.criado_por = get_user_id()
    AND c.escola_id = get_user_escola_id()
  )
);

DROP POLICY IF EXISTS "participantes_update" ON conversa_participantes;
CREATE POLICY "participantes_update" ON conversa_participantes FOR UPDATE USING (
  usuario_id = get_user_id() OR
  get_user_role() IN ('admin', 'secretario') OR
  EXISTS (
    SELECT 1 FROM conversas c 
    WHERE c.id = conversa_id 
    AND c.criado_por = get_user_id()
    AND c.escola_id = get_user_escola_id()
  )
);

DROP POLICY IF EXISTS "participantes_delete" ON conversa_participantes;
CREATE POLICY "participantes_delete" ON conversa_participantes FOR DELETE USING (
  usuario_id = get_user_id() OR
  get_user_role() IN ('admin', 'secretario') OR
  EXISTS (
    SELECT 1 FROM conversas c 
    WHERE c.id = conversa_id 
    AND c.criado_por = get_user_id()
    AND c.escola_id = get_user_escola_id()
  )
);

-- Política para mensagens: verificação através de função auxiliar
CREATE OR REPLACE FUNCTION is_conversa_participant_safe(conversa_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversa_participantes cp
    WHERE cp.conversa_id = $1
    AND cp.usuario_id = $2
    AND cp.ativo = true
  );
$$;

DROP POLICY IF EXISTS "mensagens_read_safe" ON mensagens;
CREATE POLICY "mensagens_read_safe" ON mensagens FOR SELECT USING (
  -- Admin/Secretário vê todas as mensagens
  get_user_role() IN ('admin', 'secretario') OR
  -- Remetente vê suas próprias mensagens
  remetente_id = get_user_id() OR
  -- Participante ativo da conversa
  is_conversa_participant_safe(conversa_id, get_user_id())
);

DROP POLICY IF EXISTS "mensagens_insert_safe" ON mensagens;
CREATE POLICY "mensagens_insert_safe" ON mensagens FOR INSERT WITH CHECK (
  remetente_id = get_user_id() AND (
    -- Admin/Secretário pode enviar em qualquer conversa da escola
    get_user_role() IN ('admin', 'secretario') OR
    -- Participante ativo pode enviar mensagens
    is_conversa_participant_safe(conversa_id, get_user_id())
  )
);

DROP POLICY IF EXISTS "mensagens_update" ON mensagens;
CREATE POLICY "mensagens_update" ON mensagens FOR UPDATE USING (
  remetente_id = get_user_id() OR
  get_user_role() IN ('admin', 'secretario')
);

DROP POLICY IF EXISTS "mensagens_delete" ON mensagens;
CREATE POLICY "mensagens_delete" ON mensagens FOR DELETE USING (
  remetente_id = get_user_id() OR
  get_user_role() IN ('admin', 'secretario')
);

-- =============================================
-- POLÍTICAS PARA LEITURAS DE MENSAGENS
-- =============================================

-- Verificar se a tabela mensagem_leituras existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mensagem_leituras') THEN
        -- Remover políticas antigas
        DROP POLICY IF EXISTS "leituras_read" ON mensagem_leituras;
        DROP POLICY IF EXISTS "leituras_insert" ON mensagem_leituras;
        DROP POLICY IF EXISTS "leituras_update" ON mensagem_leituras;
        
        -- Criar políticas seguras
        CREATE POLICY "leituras_read_safe" ON mensagem_leituras FOR SELECT USING (
            usuario_id = get_user_id() OR
            get_user_role() IN ('admin', 'secretario')
        );
        
        CREATE POLICY "leituras_insert_safe" ON mensagem_leituras FOR INSERT WITH CHECK (
            usuario_id = get_user_id()
        );
        
        CREATE POLICY "leituras_update_safe" ON mensagem_leituras FOR UPDATE USING (
            usuario_id = get_user_id()
        );
    END IF;
END;
$$;

-- =============================================
-- COMENTÁRIOS E LOGS
-- =============================================

COMMENT ON FUNCTION is_conversa_participant_safe(UUID, UUID) IS 'Verifica se usuário é participante ativo de uma conversa sem causar recursão';

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'Migração 20241228000000_fix_chat_rls_recursion aplicada com sucesso';
    RAISE NOTICE 'Corrigida recursão infinita nas políticas RLS do chat';
    RAISE NOTICE 'Implementadas políticas seguras sem referências circulares';
END;
$$;

COMMIT;