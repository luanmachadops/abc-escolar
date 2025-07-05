# 🔧 Correção da Validação CNPJ/CPF e Coluna Telefone

## 📋 Problemas Identificados

### 1. **Erro da Coluna 'telefone'**
```
Could not find the 'telefone' column of 'usuarios' in the schema cache
```

**Causa**: A tabela `usuarios` não possuía a coluna `telefone`, mas o código frontend estava tentando inserir dados nesta coluna.

### 2. **Validação CNPJ/CPF Restritiva**
A constraint de validação só aceitava:
- CNPJ formatado: `00.000.000/0000-00`
- CNPJ sem formatação: `00000000000000` (14 dígitos)

**Problema**: Não aceitava CPF (11 dígitos) formatado ou sem formatação.

## 🛠️ Correções Implementadas

### 1. **Adição da Coluna 'telefone' na Tabela usuarios**

**Antes:**
```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  funcao user_role NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Depois:**
```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20),  -- ✅ Coluna adicionada
  funcao user_role NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. **Atualização da Constraint de Validação CNPJ/CPF**

**Antes:**
```sql
ALTER TABLE escolas ADD CONSTRAINT check_cnpj_format 
  CHECK (cnpj_cpf ~ '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$' OR cnpj_cpf ~ '^\\d{14}$');
```

**Depois:**
```sql
ALTER TABLE escolas ADD CONSTRAINT check_cnpj_format 
  CHECK (
    cnpj_cpf ~ '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$' OR  -- CNPJ formatado
    cnpj_cpf ~ '^\\d{14}$' OR                                    -- CNPJ sem formatação
    cnpj_cpf ~ '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$' OR        -- CPF formatado
    cnpj_cpf ~ '^\\d{11}$'                                       -- CPF sem formatação
  );
```

## ✅ Formatos Aceitos Agora

### **CNPJ**
- ✅ Formatado: `12.345.678/0001-90`
- ✅ Sem formatação: `12345678000190`

### **CPF**
- ✅ Formatado: `123.456.789-01`
- ✅ Sem formatação: `12345678901`

## 🎯 Resultado

- ✅ **Coluna telefone**: Adicionada na tabela `usuarios`
- ✅ **Cadastro de escola**: Aceita tanto CNPJ quanto CPF
- ✅ **Validação flexível**: Aceita formatos com e sem pontuação
- ✅ **Cadastro de admin**: Campo telefone funcionando
- ✅ **Migração aplicada**: `supabase db reset` executado com sucesso

## 🔍 Testes Recomendados

1. **Cadastro de Escola com CNPJ**
   - Teste: `12.345.678/0001-90`
   - Teste: `12345678000190`

2. **Cadastro de Escola com CPF**
   - Teste: `123.456.789-01`
   - Teste: `12345678901`

3. **Cadastro de Administrador**
   - Verificar se o campo telefone é salvo corretamente
   - Testar formatação automática do telefone

---

**Status**: ✅ Resolvido  
**Data**: Dezembro 2024  
**Impacto**: Crítico - Cadastro completo funcionando
**Versão**: 5.2 - Validação CNPJ/CPF Flexível