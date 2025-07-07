-- =============================================
-- ABC ESCOLAR - ADIÇÃO DO CAMPO RA
-- Data: 2024-12-22
-- Descrição: Adiciona campo RA para alunos e implementa sistema de login unificado
-- =============================================

BEGIN;

-- Adicionar campo RA na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ra VARCHAR(20) UNIQUE;

-- Criar índice para o campo RA
CREATE INDEX IF NOT EXISTS idx_usuarios_ra ON usuarios(ra) WHERE ra IS NOT NULL;

-- Função para gerar RA único
CREATE OR REPLACE FUNCTION generate_ra(nome_completo TEXT, ano_ingresso INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    iniciais TEXT;
    ano_atual INTEGER;
    timestamp_suffix TEXT;
    ra_candidate TEXT;
    counter INTEGER := 0;
BEGIN
    -- Usar ano atual se não fornecido
    ano_atual := COALESCE(ano_ingresso, EXTRACT(YEAR FROM NOW()));
    
    -- Extrair iniciais do nome (primeiras letras de cada palavra)
    SELECT string_agg(LEFT(word, 1), '') INTO iniciais
    FROM unnest(string_to_array(UPPER(nome_completo), ' ')) AS word
    WHERE LENGTH(word) > 0;
    
    -- Limitar iniciais a 3 caracteres
    iniciais := LEFT(iniciais, 3);
    
    -- Gerar timestamp único
    timestamp_suffix := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
    
    -- Tentar gerar RA único
    LOOP
        ra_candidate := ano_atual::TEXT || iniciais || timestamp_suffix;
        
        -- Verificar se RA já existe
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE ra = ra_candidate) THEN
            RETURN ra_candidate;
        END IF;
        
        -- Incrementar contador e tentar novamente
        counter := counter + 1;
        timestamp_suffix := LPAD(((EXTRACT(EPOCH FROM NOW())::BIGINT + counter) % 10000)::TEXT, 4, '0');
        
        -- Evitar loop infinito
        IF counter > 100 THEN
            RAISE EXCEPTION 'Não foi possível gerar RA único após 100 tentativas';
        END IF;
    END LOOP;
END;
$$;

-- Função para detectar tipo de identificador
CREATE OR REPLACE FUNCTION detect_identifier_type(identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    clean_identifier TEXT;
BEGIN
    -- Remover formatação
    clean_identifier := regexp_replace(identifier, '[^\\w@.-]', '', 'g');
    
    -- Verificar se é email
    IF clean_identifier ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        RETURN 'email';
    END IF;
    
    -- Verificar se é CPF (11 dígitos)
    IF clean_identifier ~ '^\\d{11}$' THEN
        RETURN 'cpf';
    END IF;
    
    -- Verificar se é RA (formato: AAAAIIIXXXX - ano + iniciais + timestamp)
    IF clean_identifier ~ '^\\d{4}[A-Z]{1,3}\\d{4}$' THEN
        RETURN 'ra';
    END IF;
    
    -- Verificar se é número (possível RA simples)
    IF clean_identifier ~ '^\\d+$' THEN
        RETURN 'ra';
    END IF;
    
    RETURN 'unknown';
END;
$$;

COMMIT;