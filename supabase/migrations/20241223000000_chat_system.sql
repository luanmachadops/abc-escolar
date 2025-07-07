-- =============================================
-- SISTEMA DE CHAT/MENSAGENS
-- Data: 2024-12-23
-- Descrição: Tabelas para sistema de chat em tempo real
-- =============================================

BEGIN;

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  tipo VARCHAR(20) DEFAULT 'individual', -- 'individual', 'grupo', 'turma'
  criado_por UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE, -- Para conversas de turma
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de participantes das conversas
CREATE TABLE IF NOT EXISTS conversa_participantes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversa_id UUID REFERENCES conversas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  UNIQUE(conversa_id, usuario_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversa_id UUID REFERENCES conversas(id) ON DELETE CASCADE,
  remetente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto', -- 'texto', 'arquivo', 'imagem'
  arquivo_url TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para controle de mensagens lidas
CREATE TABLE IF NOT EXISTS mensagem_leituras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mensagem_id UUID REFERENCES mensagens(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  lida_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mensagem_id, usuario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_escola_tipo ON conversas(escola_id, tipo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_conversa_participantes_usuario ON conversa_participantes(usuario_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_data ON mensagens(conversa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON mensagens(remetente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagem_leituras_usuario ON mensagem_leituras(usuario_id, lida_em DESC);

-- Triggers para updated_at
CREATE TRIGGER update_conversas_updated_at 
  BEFORE UPDATE ON conversas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar última atividade da conversa
CREATE OR REPLACE FUNCTION update_conversa_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversa_on_message
  AFTER INSERT ON mensagens
  FOR EACH ROW EXECUTE FUNCTION update_conversa_activity();

-- Habilitar RLS
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversa_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagem_leituras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversas
CREATE POLICY "conversas_read" ON conversas FOR SELECT USING (
  escola_id = get_user_escola_id() AND (
    criado_por = get_user_id() OR
    EXISTS (SELECT 1 FROM conversa_participantes cp WHERE cp.conversa_id = id AND cp.usuario_id = get_user_id() AND cp.ativo = true)
  )
);

CREATE POLICY "conversas_insert" ON conversas FOR INSERT WITH CHECK (
  escola_id = get_user_escola_id() AND criado_por = get_user_id()
);

CREATE POLICY "conversas_update" ON conversas FOR UPDATE USING (
  escola_id = get_user_escola_id() AND (
    criado_por = get_user_id() OR
    is_admin_or_secretary()
  )
);

CREATE POLICY "conversas_delete" ON conversas FOR DELETE USING (
  escola_id = get_user_escola_id() AND (
    criado_por = get_user_id() OR
    is_admin_or_secretary()
  )
);

-- Políticas RLS para participantes
CREATE POLICY "participantes_read" ON conversa_participantes FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversas c WHERE c.id = conversa_id AND c.escola_id = get_user_escola_id()) AND
  (usuario_id = get_user_id() OR is_admin_or_secretary())
);

CREATE POLICY "participantes_insert" ON conversa_participantes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversas c WHERE c.id = conversa_id AND c.escola_id = get_user_escola_id() AND c.criado_por = get_user_id()) OR
  is_admin_or_secretary()
);

CREATE POLICY "participantes_update" ON conversa_participantes FOR UPDATE USING (
  usuario_id = get_user_id() OR
  EXISTS (SELECT 1 FROM conversas c WHERE c.id = conversa_id AND c.criado_por = get_user_id()) OR
  is_admin_or_secretary()
);

CREATE POLICY "participantes_delete" ON conversa_participantes FOR DELETE USING (
  usuario_id = get_user_id() OR
  EXISTS (SELECT 1 FROM conversas c WHERE c.id = conversa_id AND c.criado_por = get_user_id()) OR
  is_admin_or_secretary()
);

-- Políticas RLS para mensagens
CREATE POLICY "mensagens_read" ON mensagens FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversa_participantes cp 
    JOIN conversas c ON c.id = cp.conversa_id 
    WHERE cp.conversa_id = mensagens.conversa_id 
    AND cp.usuario_id = get_user_id() 
    AND cp.ativo = true
    AND c.escola_id = get_user_escola_id()
  )
);

CREATE POLICY "mensagens_insert" ON mensagens FOR INSERT WITH CHECK (
  remetente_id = get_user_id() AND
  EXISTS (
    SELECT 1 FROM conversa_participantes cp 
    JOIN conversas c ON c.id = cp.conversa_id 
    WHERE cp.conversa_id = mensagens.conversa_id 
    AND cp.usuario_id = get_user_id() 
    AND cp.ativo = true
    AND c.escola_id = get_user_escola_id()
  )
);

CREATE POLICY "mensagens_update" ON mensagens FOR UPDATE USING (
  remetente_id = get_user_id() OR is_admin_or_secretary()
);

CREATE POLICY "mensagens_delete" ON mensagens FOR DELETE USING (
  remetente_id = get_user_id() OR is_admin_or_secretary()
);

-- Políticas RLS para leituras
CREATE POLICY "leituras_read" ON mensagem_leituras FOR SELECT USING (
  usuario_id = get_user_id() OR
  EXISTS (
    SELECT 1 FROM mensagens m 
    JOIN conversa_participantes cp ON cp.conversa_id = m.conversa_id
    WHERE m.id = mensagem_id AND cp.usuario_id = get_user_id() AND cp.ativo = true
  )
);

CREATE POLICY "leituras_insert" ON mensagem_leituras FOR INSERT WITH CHECK (
  usuario_id = get_user_id()
);

CREATE POLICY "leituras_update" ON mensagem_leituras FOR UPDATE USING (
  usuario_id = get_user_id()
);

CREATE POLICY "leituras_delete" ON mensagem_leituras FOR DELETE USING (
  usuario_id = get_user_id()
);

-- Função para criar conversa individual automaticamente
CREATE OR REPLACE FUNCTION criar_conversa_individual(
  p_usuario1_id UUID,
  p_usuario2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversa_id UUID;
  v_escola_id UUID;
BEGIN
  -- Verificar se já existe conversa entre os dois usuários
  SELECT c.id INTO v_conversa_id
  FROM conversas c
  JOIN conversa_participantes cp1 ON cp1.conversa_id = c.id
  JOIN conversa_participantes cp2 ON cp2.conversa_id = c.id
  WHERE c.tipo = 'individual'
    AND cp1.usuario_id = p_usuario1_id
    AND cp2.usuario_id = p_usuario2_id
    AND cp1.ativo = true
    AND cp2.ativo = true
  LIMIT 1;

  IF v_conversa_id IS NOT NULL THEN
    RETURN v_conversa_id;
  END IF;

  -- Obter escola_id do usuário atual
  SELECT escola_id INTO v_escola_id FROM usuarios WHERE id = p_usuario1_id;

  -- Criar nova conversa
  INSERT INTO conversas (escola_id, tipo, criado_por)
  VALUES (v_escola_id, 'individual', p_usuario1_id)
  RETURNING id INTO v_conversa_id;

  -- Adicionar participantes
  INSERT INTO conversa_participantes (conversa_id, usuario_id)
  VALUES 
    (v_conversa_id, p_usuario1_id),
    (v_conversa_id, p_usuario2_id);

  RETURN v_conversa_id;
END;
$$;

-- Função para marcar mensagem como lida
CREATE OR REPLACE FUNCTION marcar_mensagem_lida(
  p_mensagem_id UUID,
  p_usuario_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO mensagem_leituras (mensagem_id, usuario_id)
  VALUES (p_mensagem_id, p_usuario_id)
  ON CONFLICT (mensagem_id, usuario_id) DO NOTHING;
  
  RETURN true;
END;
$$;

COMMIT;