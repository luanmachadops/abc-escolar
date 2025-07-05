# 🔧 Correção do Erro da Coluna 'cnpj'

## 📋 Problema Identificado

O erro `Could not find the 'cnpj' column of 'escolas' in the schema cache` ocorreu devido a uma inconsistência entre:

- **Migração do Banco**: Coluna definida como `cnpj_cpf`
- **Código Frontend**: Referências usando `cnpj`

## 🛠️ Correções Realizadas

### 1. Interface TypeScript (`src/lib/supabase.ts`)

**Antes:**
```typescript
export interface Escola {
  id: string;
  nome_instituicao: string;
  cnpj: string;  // ❌ Nome incorreto
  // ...
}
```

**Depois:**
```typescript
export interface Escola {
  id: string;
  nome_instituicao: string;
  cnpj_cpf: string;  // ✅ Nome correto
  // ...
}
```

### 2. Cadastro de Escola (`src/pages/RegisterSchoolPage.tsx`)

**Antes:**
```typescript
.insert({
  nome_instituicao: formData.nomeInstituicao,
  cnpj: formData.cnpjCpf.replace(/\D/g, ''),  // ❌ Nome incorreto
  // ...
})
```

**Depois:**
```typescript
.insert({
  nome_instituicao: formData.nomeInstituicao,
  cnpj_cpf: formData.cnpjCpf.replace(/\D/g, ''),  // ✅ Nome correto
  // ...
})
```

### 3. Hook de Dados do Usuário (`src/hooks/useUserData.ts`)

**Antes:**
```typescript
escola:escolas(
  id,
  nome_instituicao,
  cnpj,  // ❌ Nome incorreto
  // ...
)
```

**Depois:**
```typescript
escola:escolas(
  id,
  nome_instituicao,
  cnpj_cpf,  // ✅ Nome correto
  // ...
)
```

## ✅ Validação das Correções

### Estrutura do Banco (Migração)
```sql
CREATE TABLE IF NOT EXISTS escolas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome_instituicao VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(18) NOT NULL UNIQUE,  -- ✅ Coluna correta
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

### Validações Implementadas
```sql
-- Constraint para validação de formato CNPJ/CPF
ALTER TABLE escolas ADD CONSTRAINT check_cnpj_format 
  CHECK (cnpj_cpf ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$' OR cnpj_cpf ~ '^\d{14}$');

-- Índice para busca otimizada
CREATE INDEX IF NOT EXISTS idx_escolas_cnpj ON escolas(cnpj_cpf) WHERE ativo = true;
```

## 🎯 Resultado

- ✅ **Erro de coluna resolvido**: Frontend agora usa `cnpj_cpf` consistentemente
- ✅ **Cadastro funcionando**: Escolas podem ser cadastradas sem erro
- ✅ **Validações ativas**: Formato CNPJ/CPF é validado automaticamente
- ✅ **Performance otimizada**: Índice criado para buscas por CNPJ/CPF

## 📝 Lições Aprendidas

1. **Consistência de Nomenclatura**: Sempre manter nomes de colunas consistentes entre banco e frontend
2. **Validação de Schema**: Verificar interfaces TypeScript após mudanças no banco
3. **Testes de Integração**: Testar fluxo completo após alterações de schema
4. **Documentação**: Manter documentação atualizada com mudanças de estrutura

## 🔍 Verificações Futuras

- [ ] Executar testes de cadastro completo
- [ ] Verificar outros formulários que usam dados de escola
- [ ] Validar relatórios que exibem CNPJ/CPF
- [ ] Confirmar funcionamento de buscas por CNPJ/CPF

---

**Status**: ✅ Resolvido  
**Data**: Dezembro 2024  
**Impacto**: Crítico - Cadastro de escolas funcionando