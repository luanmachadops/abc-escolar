-- Migração para criação automática de grupos de chat para turmas
-- Data: 2024-12-26
-- Descrição: Adiciona triggers para criar grupos de chat automaticamente quando turmas são criadas
--            e adicionar alunos aos grupos quando são inseridos nas turmas

-- Função para criar grupo de chat para turma
CREATE OR REPLACE FUNCTION criar_grupo_chat_turma()
RETURNS TRIGGER AS $$
DECLARE
    v_conversa_id UUID;
    v_professor_id UUID;
BEGIN
    -- Criar conversa do tipo 'turma'
    INSERT INTO conversas (
        escola_id,
        titulo,
        tipo,
        criado_por,
        turma_id,
        ativo
    ) VALUES (
        NEW.escola_id,
        'Turma: ' || NEW.nome,
        'turma',
        NEW.professor_id,
        NEW.id,
        true
    ) RETURNING id INTO v_conversa_id;
    
    -- Adicionar o professor como participante
    IF NEW.professor_id IS NOT NULL THEN
        INSERT INTO conversa_participantes (
            conversa_id,
            usuario_id,
            ativo
        ) VALUES (
            v_conversa_id,
            NEW.professor_id,
            true
        );
    END IF;
    
    -- Adicionar todos os alunos já existentes na turma
    INSERT INTO conversa_participantes (
        conversa_id,
        usuario_id,
        ativo
    )
    SELECT 
        v_conversa_id,
        at.aluno_id,
        true
    FROM aluno_turmas at
    WHERE at.turma_id = NEW.id
    AND at.status = 'ativo';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar aluno ao grupo de chat da turma
CREATE OR REPLACE FUNCTION adicionar_aluno_grupo_turma()
RETURNS TRIGGER AS $$
DECLARE
    v_conversa_id UUID;
BEGIN
    -- Buscar a conversa da turma
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = NEW.turma_id
    AND tipo = 'turma'
    AND ativo = true
    LIMIT 1;
    
    -- Se encontrou a conversa, adicionar o aluno
    IF v_conversa_id IS NOT NULL THEN
        INSERT INTO conversa_participantes (
            conversa_id,
            usuario_id,
            ativo
        ) VALUES (
            v_conversa_id,
            NEW.aluno_id,
            true
        )
        ON CONFLICT (conversa_id, usuario_id) 
        DO UPDATE SET ativo = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para remover aluno do grupo de chat da turma
CREATE OR REPLACE FUNCTION remover_aluno_grupo_turma()
RETURNS TRIGGER AS $$
DECLARE
    v_conversa_id UUID;
BEGIN
    -- Buscar a conversa da turma
    SELECT id INTO v_conversa_id
    FROM conversas
    WHERE turma_id = OLD.turma_id
    AND tipo = 'turma'
    AND ativo = true
    LIMIT 1;
    
    -- Se encontrou a conversa, remover o aluno
    IF v_conversa_id IS NOT NULL THEN
        UPDATE conversa_participantes
        SET ativo = false
        WHERE conversa_id = v_conversa_id
        AND usuario_id = OLD.aluno_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar grupo de chat quando turma é criada
DROP TRIGGER IF EXISTS trigger_criar_grupo_chat_turma ON turmas;
CREATE TRIGGER trigger_criar_grupo_chat_turma
    AFTER INSERT ON turmas
    FOR EACH ROW
    EXECUTE FUNCTION criar_grupo_chat_turma();

-- Trigger para adicionar aluno ao grupo quando é inserido na turma
DROP TRIGGER IF EXISTS trigger_adicionar_aluno_grupo ON aluno_turmas;
CREATE TRIGGER trigger_adicionar_aluno_grupo
    AFTER INSERT ON aluno_turmas
    FOR EACH ROW
    WHEN (NEW.status = 'ativo')
    EXECUTE FUNCTION adicionar_aluno_grupo_turma();

-- Trigger para remover aluno do grupo quando é removido da turma
DROP TRIGGER IF EXISTS trigger_remover_aluno_grupo ON aluno_turmas;
CREATE TRIGGER trigger_remover_aluno_grupo
    AFTER UPDATE ON aluno_turmas
    FOR EACH ROW
    WHEN (OLD.status = 'ativo' AND NEW.status != 'ativo')
    EXECUTE FUNCTION remover_aluno_grupo_turma();

-- Trigger para remover aluno do grupo quando registro é deletado
DROP TRIGGER IF EXISTS trigger_deletar_aluno_grupo ON aluno_turmas;
CREATE TRIGGER trigger_deletar_aluno_grupo
    AFTER DELETE ON aluno_turmas
    FOR EACH ROW
    EXECUTE FUNCTION remover_aluno_grupo_turma();

-- Criar grupos de chat para turmas existentes que ainda não têm
DO $$
DECLARE
    turma_record RECORD;
    v_conversa_id UUID;
BEGIN
    FOR turma_record IN 
        SELECT t.id, t.escola_id, t.nome, t.professor_id
        FROM turmas t
        WHERE t.ativo = true
        AND NOT EXISTS (
            SELECT 1 FROM conversas c 
            WHERE c.turma_id = t.id 
            AND c.tipo = 'turma' 
            AND c.ativo = true
        )
    LOOP
        -- Criar conversa do tipo 'turma'
        INSERT INTO conversas (
            escola_id,
            titulo,
            tipo,
            criado_por,
            turma_id,
            ativo
        ) VALUES (
            turma_record.escola_id,
            'Turma: ' || turma_record.nome,
            'turma',
            turma_record.professor_id,
            turma_record.id,
            true
        ) RETURNING id INTO v_conversa_id;
        
        -- Adicionar o professor como participante
        IF turma_record.professor_id IS NOT NULL THEN
            INSERT INTO conversa_participantes (
                conversa_id,
                usuario_id,
                ativo
            ) VALUES (
                v_conversa_id,
                turma_record.professor_id,
                true
            );
        END IF;
        
        -- Adicionar todos os alunos da turma
        INSERT INTO conversa_participantes (
            conversa_id,
            usuario_id,
            ativo
        )
        SELECT 
            v_conversa_id,
            at.aluno_id,
            true
        FROM aluno_turmas at
        WHERE at.turma_id = turma_record.id
        AND at.status = 'ativo';
        
        RAISE NOTICE 'Grupo de chat criado para turma: %', turma_record.nome;
    END LOOP;
END
$$;

-- Comentários para documentação
COMMENT ON FUNCTION criar_grupo_chat_turma() IS 'Cria automaticamente um grupo de chat quando uma nova turma é criada';
COMMENT ON FUNCTION adicionar_aluno_grupo_turma() IS 'Adiciona automaticamente um aluno ao grupo de chat da turma quando ele é inserido na turma';
COMMENT ON FUNCTION remover_aluno_grupo_turma() IS 'Remove automaticamente um aluno do grupo de chat da turma quando ele é removido da turma';