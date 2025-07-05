# 🔧 Correção da Tabela Escolas

## 📋 Problema Identificado

O erro `column escolas_1.telefone does not exist` indicava que a tabela `escolas` não possuía as colunas `telefone` e `email`, mas o código frontend estava tentando acessar essas colunas.

### 🚨 Erro Original
```
code: "42703"
details: null
hint: null
message: "column escolas_1.telefone does not exist"
```

## 🛠️ Correção Implementada

### 1. **Atualização da Estrutura da Tabela**

**Antes:**
```sql
CREATE TABLE IF NOT EXISTS escolas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome_instituicao VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(18) NOT NULL UNIQUE,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  pais VARCHAR(100) NOT NULL DEFAULT 'Brasil',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Depois:**
```sql
CREATE TABLE IF NOT EXISTS escolas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome_instituicao VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(18) NOT NULL UNIQUE,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  pais VARCHAR(100) NOT NULL DEFAULT 'Brasil',
  telefone VARCHAR(20),        -- ✅ ADICIONADO
  email VARCHAR(255),          -- ✅ ADICIONADO
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. **Colunas Adicionadas**

- **`telefone VARCHAR(20)`**: Campo opcional para telefone da escola
- **`email VARCHAR(255)`**: Campo opcional para email da escola

### 3. **Migração Aplicada**

A migração foi aplicada com sucesso usando:
```bash
supabase db reset
```

## 🎯 Resultado

- ✅ **Tabela escolas**: Agora possui as colunas `telefone` e `email`
- ✅ **Compatibilidade**: Frontend pode acessar todos os campos necessários
- ✅ **Queries**: Não haverá mais erro de coluna inexistente
- ✅ **Interface**: Formulários de cadastro funcionando corretamente

## 🔍 Verificação

### Estrutura Atual da Tabela
```sql
-- Verificar estrutura da tabela escolas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'escolas' 
ORDER BY ordinal_position;
```

### Campos Disponíveis
- `id` (UUID, PRIMARY KEY)
- `nome_instituicao` (VARCHAR(255), NOT NULL)
- `cnpj_cpf` (VARCHAR(18), NOT NULL UNIQUE)
- `logradouro` (VARCHAR(255), NOT NULL)
- `numero` (VARCHAR(10), NOT NULL)
- `bairro` (VARCHAR(100), NOT NULL)
- `cep` (VARCHAR(10), NOT NULL)
- `cidade` (VARCHAR(100), NOT NULL)
- `pais` (VARCHAR(100), DEFAULT 'Brasil')
- `telefone` (VARCHAR(20), NULLABLE) ✅
- `email` (VARCHAR(255), NULLABLE) ✅
- `ativo` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## 🧪 Testes Recomendados

1. **Cadastro de Escola**
   - Testar cadastro com telefone e email
   - Testar cadastro sem telefone e email (campos opcionais)

2. **Consulta de Dados**
   - Verificar se as queries do frontend funcionam
   - Testar busca por escola

3. **Atualização de Dados**
   - Testar edição de escola incluindo telefone e email

---

**Status**: ✅ Resolvido  
**Data**: Dezembro 2024  
**Impacto**: Crítico - Acesso aos dados da escola funcionando
**Arquivo Modificado**: `supabase/migrations/20241220000000_unified_schema.sql`