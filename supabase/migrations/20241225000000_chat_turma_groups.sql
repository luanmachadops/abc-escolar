-- =============================================
-- SISTEMA DE CHAT - GRUPOS AUTOMÁTICOS DE TURMA
-- Data: 2024-12-25
-- Descrição: Criação automática de grupos de chat para turmas
--            e implementação das regras de acesso específicas
-- =============================================

BEGIN;

-- Função para criar grupo de chat para turma automaticamente
CREATE OR REPLACE FUNCTION criar_grupo_turma(
  p_turma_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversa_id UUID;
  v_escola_id UUID;
  v_turma_nome VARCHAR(255);
  v_curso_nome VARCHAR(255);
  v_admin_id UUID;
  participant RECORD;
BEGIN
  -- Verificar se já existe grupo para esta turma
  SELECT id INTO v_conversa_id
  FROM conversas
  WHERE turma_id = p_turma_id AND tipo = 'turma' AND ativo = true
  LIMIT 1;

  IF v_conversa_id IS NOT NULL THEN
    RETURN v_conversa_id;
  END IF;

  -- Obter dados da turma e escola
  SELECT t.escola_id, t.nome, c.nome
  INTO v_escola_id, v_turma_nome, v_curso_nome
  FROM turmas t
  JOIN cursos c ON c.id = t.curso_id
  WHERE t.id = p_turma_id;

  IF v_escola_id IS NULL THEN
    RAISE EXCEPTION 'Turma não encontrada';
  END IF;

  -- Obter um admin da escola para criar o grupo
  SELECT id INTO v_admin_id
  FROM usuarios
  WHERE escola_id = v_escola_id AND funcao = 'admin' AND ativo = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum administrador encontrado para criar o grupo';
  END IF;

  -- Criar conversa de turma
  INSERT INTO conversas (escola_id, titulo, tipo, criado_por, turma_id)
  VALUES (
    v_escola_id, 
    'Turma ' || v_turma_nome || ' - ' || v_curso_nome,
    'turma', 
    v_admin_id, 
    p_turma_id
  )
  RETURNING id INTO v_conversa_id;

  -- Adicionar todos os admins da escola ao grupo
  INSERT INTO conversa_participantes (conversa_id, usuario_id)
  SELECT v_conversa_id, id
  FROM usuarios
  WHERE escola_id = v_escola_id 
    AND funcao = 'admin' 
    AND ativo = true;

  -- Adicionar professores que lecionam nesta turma
  INSERT INTO conversa_participantes (conversa_id, usuario_id)
  SELECT DISTINCT v_conversa_id, pd.professor_id
  FROM professor_disciplinas pd
  WHERE pd.turma_id = p_turma_id 
    AND pd.ativo = true
  ON CONFLICT (conversa_id, usuario_id) DO NOTHING;

  -- Adicionar alunos matriculados na turma
  INSERT INTO conversa_participantes (conversa_id, usuario_id)
  SELECT v_conversa_id, at.aluno_id
  FROM aluno_turmas at
  WHERE at.turma_id = p_turma_id 
    AND at.status = 'ativo'
  ON CONFLICT (conversa_id, usuario_id) DO NOTHING;

  RETURN v_conversa_id;
END;
$$;

-- Função para adicionar usuário ao grupo da turma quando matriculado
CREATE OR REPLACE FUNCTION adicionar_usuario_grupo_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversa_id UUID;
BEGIN
  -- Verificar se é uma inserção ou atualização para status ativo
  IF (TG_OP = 'INSERT' AND NEW.status = 'ativo') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'ativo' AND NEW.status = 'ativo') THEN
    
    -- Buscar ou criar grupo da turma
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = NEW.turma_id AND tipo = 'turma' AND ativo = true;
    
    IF v_conversa_id IS NULL THEN
      v_conversa_id := criar_grupo_turma(NEW.turma_id);
    END IF;
    
    -- Adicionar aluno ao grupo
    INSERT INTO conversa_participantes (conversa_id, usuario_id)
    VALUES (v_conversa_id, NEW.aluno_id)
    ON CONFLICT (conversa_id, usuario_id) DO UPDATE SET ativo = true;
    
  -- Se status mudou para inativo, remover do grupo
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'ativo' AND NEW.status != 'ativo' THEN
    
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = NEW.turma_id AND tipo = 'turma' AND ativo = true;
    
    IF v_conversa_id IS NOT NULL THEN
      UPDATE conversa_participantes 
      SET ativo = false 
      WHERE conversa_id = v_conversa_id AND usuario_id = NEW.aluno_id;
    END IF;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para adicionar professor ao grupo da turma quando atribuído
CREATE OR REPLACE FUNCTION adicionar_professor_grupo_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversa_id UUID;
BEGIN
  -- Verificar se é uma inserção ou atualização para ativo
  IF (TG_OP = 'INSERT' AND NEW.ativo = true) OR 
     (TG_OP = 'UPDATE' AND OLD.ativo = false AND NEW.ativo = true) THEN
    
    -- Buscar ou criar grupo da turma
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = NEW.turma_id AND tipo = 'turma' AND ativo = true;
    
    IF v_conversa_id IS NULL THEN
      v_conversa_id := criar_grupo_turma(NEW.turma_id);
    END IF;
    
    -- Adicionar professor ao grupo
    INSERT INTO conversa_participantes (conversa_id, usuario_id)
    VALUES (v_conversa_id, NEW.professor_id)
    ON CONFLICT (conversa_id, usuario_id) DO UPDATE SET ativo = true;
    
  -- Se ficou inativo, remover do grupo
  ELSIF TG_OP = 'UPDATE' AND OLD.ativo = true AND NEW.ativo = false THEN
    
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = NEW.turma_id AND tipo = 'turma' AND ativo = true;
    
    IF v_conversa_id IS NOT NULL THEN
      UPDATE conversa_participantes 
      SET ativo = false 
      WHERE conversa_id = v_conversa_id AND usuario_id = NEW.professor_id;
    END IF;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar triggers para adicionar automaticamente aos grupos
DROP TRIGGER IF EXISTS trigger_aluno_grupo_turma ON aluno_turmas;
CREATE TRIGGER trigger_aluno_grupo_turma
  AFTER INSERT OR UPDATE ON aluno_turmas
  FOR EACH ROW EXECUTE FUNCTION adicionar_usuario_grupo_turma();

DROP TRIGGER IF EXISTS trigger_professor_grupo_turma ON professor_disciplinas;
CREATE TRIGGER trigger_professor_grupo_turma
  AFTER INSERT OR UPDATE ON professor_disciplinas
  FOR EACH ROW EXECUTE FUNCTION adicionar_professor_grupo_turma();

-- Função para criar grupos para turmas existentes
CREATE OR REPLACE FUNCTION criar_grupos_turmas_existentes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  turma_record RECORD;
  grupos_criados INTEGER := 0;
BEGIN
  FOR turma_record IN 
    SELECT id FROM turmas WHERE ativo = true
  LOOP
    PERFORM criar_grupo_turma(turma_record.id);
    grupos_criados := grupos_criados + 1;
  END LOOP;
  
  RETURN grupos_criados;
END;
$$;

-- Atualizar políticas RLS para implementar as regras de acesso específicas

-- Política para conversas - Admin vê tudo, Professor só suas turmas, Aluno só onde participa
DROP POLICY IF EXISTS "conversas_read" ON conversas;
CREATE POLICY "conversas_read" ON conversas FOR SELECT USING (
  escola_id = get_user_escola_id() AND (
    -- Admin vê todas as conversas
    get_user_role() = 'admin' OR
    -- Secretário vê todas as conversas
    get_user_role() = 'secretario' OR
    -- Criador da conversa
    criado_por = get_user_id() OR
    -- Participante ativo da conversa
    EXISTS (
      SELECT 1 FROM conversa_participantes cp 
      WHERE cp.conversa_id = id 
        AND cp.usuario_id = get_user_id() 
        AND cp.ativo = true
    ) OR
    -- Professor pode ver conversas de turmas onde leciona
    (get_user_role() = 'professor' AND tipo = 'turma' AND EXISTS (
      SELECT 1 FROM professor_disciplinas pd 
      WHERE pd.turma_id = conversas.turma_id 
        AND pd.professor_id = get_user_id() 
        AND pd.ativo = true
    ))
  )
);

-- Política para mensagens - seguindo as mesmas regras
DROP POLICY IF EXISTS "mensagens_read" ON mensagens;
CREATE POLICY "mensagens_read" ON mensagens FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversas c
    JOIN conversa_participantes cp ON cp.conversa_id = c.id
    WHERE c.id = mensagens.conversa_id
      AND c.escola_id = get_user_escola_id()
      AND (
        -- Admin vê todas as mensagens
        get_user_role() = 'admin' OR
        -- Secretário vê todas as mensagens  
        get_user_role() = 'secretario' OR
        -- Participante ativo da conversa
        (cp.usuario_id = get_user_id() AND cp.ativo = true) OR
        -- Professor pode ver mensagens de turmas onde leciona
        (get_user_role() = 'professor' AND c.tipo = 'turma' AND EXISTS (
          SELECT 1 FROM professor_disciplinas pd 
          WHERE pd.turma_id = c.turma_id 
            AND pd.professor_id = get_user_id() 
            AND pd.ativo = true
        ))
      )
  )
);

-- Política para inserir mensagens - apenas participantes ativos
DROP POLICY IF EXISTS "mensagens_insert" ON mensagens;
CREATE POLICY "mensagens_insert" ON mensagens FOR INSERT WITH CHECK (
  remetente_id = get_user_id() AND
  EXISTS (
    SELECT 1 FROM conversas c
    WHERE c.id = mensagens.conversa_id
      AND c.escola_id = get_user_escola_id()
      AND (
        -- Admin pode enviar em qualquer conversa
        get_user_role() = 'admin' OR
        -- Secretário pode enviar em qualquer conversa
        get_user_role() = 'secretario' OR
        -- Participante ativo da conversa
        EXISTS (
          SELECT 1 FROM conversa_participantes cp 
          WHERE cp.conversa_id = c.id 
            AND cp.usuario_id = get_user_id() 
            AND cp.ativo = true
        )
      )
  )
);

-- Executar criação de grupos para turmas existentes
SELECT criar_grupos_turmas_existentes();

COMMIT;