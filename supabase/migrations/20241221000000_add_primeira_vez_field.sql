-- Adicionar campo primeira_vez na tabela usuarios
-- Este campo é necessário para controlar se o usuário precisa alterar a senha no primeiro login

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS primeira_vez BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_primeira_vez ON usuarios(primeira_vez) WHERE primeira_vez = true;

-- Comentário da coluna
COMMENT ON COLUMN usuarios.primeira_vez IS 'Indica se é o primeiro acesso do usuário (precisa alterar senha)';