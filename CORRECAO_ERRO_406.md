# 🔧 Correção dos Erros 406 (Not Acceptable) - PGRST116

## 📋 Problema Identificado

O sistema estava apresentando erros 406 com código `PGRST116` que indicavam:
- **Mensagem**: "JSON object requested, multiple (or no) rows returned"
- **Causa**: Uso inadequado do método `.single()` em consultas que podem retornar zero ou múltiplos resultados

## 🛠️ Correções Implementadas

### 1. Hook useUserData.ts
**Arquivo**: `src/hooks/useUserData.ts`

**Problema**: 
```typescript
.eq('auth_user_id', user.id)
.eq('ativo', true)
.single(); // ❌ Causava erro 406 se usuário não existisse
```

**Solução**:
```typescript
.eq('auth_user_id', user.id)
.eq('ativo', true)
.maybeSingle(); // ✅ Retorna null se não encontrar
```

**Melhorias no tratamento de erro**:
```typescript
if (userError) {
  if (userError.code === 'PGRST116') {
    setError('Usuário não encontrado ou inativo');
  } else {
    setError(`Erro ao carregar dados do usuário: ${userError.message}`);
  }
  return;
}

if (!userDataResult) {
  setError('Usuário não encontrado na base de dados. Verifique se o cadastro foi concluído.');
  return;
}
```

### 2. Hook useUserAccess.ts
**Arquivo**: `src/hooks/useUserAccess.ts`

**Correções realizadas**:
- **Linha 233**: Verificação de primeira vez do usuário
- **Linha 267**: Verificação de RA existente
- **Linha 298**: Verificação de email existente

**Antes**:
```typescript
.eq('auth_user_id', user.id)
.single(); // ❌ Erro se usuário não existir
```

**Depois**:
```typescript
.eq('auth_user_id', user.id)
.maybeSingle(); // ✅ Seguro para verificações de existência
```

### 3. Hook useChat.ts
**Arquivo**: `src/hooks/useChat.ts`

**Correção na linha 174**:
```typescript
// Antes
.eq('id', ultimaMensagem.remetente_id)
.single(); // ❌ Erro se remetente não existir

// Depois
.eq('id', ultimaMensagem.remetente_id)
.maybeSingle(); // ✅ Retorna null se não encontrar
```

### 4. Página Debug.tsx
**Arquivo**: `src/pages/Debug.tsx`

**Correção na linha 38**:
```typescript
// Antes
.eq('auth_user_id', user.id)
.single(); // ❌ Erro se usuário não existir

// Depois
.eq('auth_user_id', user.id)
.maybeSingle(); // ✅ Seguro para debug
```

## 📚 Diferenças entre .single() e .maybeSingle()

### .single()
- **Uso**: Quando você tem CERTEZA que a consulta retornará exatamente 1 resultado
- **Comportamento**: 
  - ✅ 1 resultado → Retorna o objeto
  - ❌ 0 resultados → Erro PGRST116
  - ❌ 2+ resultados → Erro PGRST116
- **Ideal para**: INSERTs com RETURNING, UPDATEs específicos

### .maybeSingle()
- **Uso**: Quando a consulta pode retornar 0 ou 1 resultado
- **Comportamento**:
  - ✅ 1 resultado → Retorna o objeto
  - ✅ 0 resultados → Retorna null
  - ❌ 2+ resultados → Erro (múltiplos resultados)
- **Ideal para**: Verificações de existência, buscas por ID único

## 🎯 Casos de Uso Corretos

### ✅ Use .single() quando:
```typescript
// INSERT com retorno (sempre retorna 1 resultado)
const { data } = await supabase
  .from('usuarios')
  .insert({ nome: 'João' })
  .select()
  .single();

// UPDATE específico (sempre retorna 1 resultado se existir)
const { data } = await supabase
  .from('usuarios')
  .update({ nome: 'João Silva' })
  .eq('id', userId)
  .select()
  .single();
```

### ✅ Use .maybeSingle() quando:
```typescript
// Verificar se usuário existe
const { data } = await supabase
  .from('usuarios')
  .select('*')
  .eq('email', email)
  .maybeSingle();

// Buscar perfil do usuário logado
const { data } = await supabase
  .from('usuarios')
  .select('*')
  .eq('auth_user_id', user.id)
  .maybeSingle();
```

## 🔄 Reset do Banco de Dados

Após as correções, foi executado:
```bash
supabase db reset
```

Este comando:
1. Recria o banco de dados local
2. Aplica todas as migrações
3. Executa o arquivo `seed.sql` com dados de teste
4. Garante que as políticas RLS estejam corretas

## ✅ Resultado

- ❌ **Antes**: Erros 406 constantes ao carregar dados do usuário
- ✅ **Depois**: Sistema funciona corretamente, mesmo quando:
  - Usuário não tem dados na tabela `usuarios`
  - Primeiro acesso ao sistema
  - Dados inconsistentes temporários

## 🚀 Melhorias Adicionais

1. **Mensagens de erro mais específicas**: Usuário recebe feedback claro sobre o problema
2. **Tratamento robusto**: Sistema não quebra com dados inconsistentes
3. **Debug melhorado**: Página de debug funciona mesmo sem dados completos
4. **Experiência do usuário**: Carregamento suave sem erros inesperados

## 📝 Recomendações para o Futuro

1. **Sempre usar .maybeSingle()** para verificações de existência
2. **Reservar .single()** apenas para operações que garantem 1 resultado
3. **Implementar tratamento de erro específico** para códigos PGRST
4. **Testar cenários de dados vazios** durante desenvolvimento
5. **Usar TypeScript** para detectar possíveis problemas em tempo de compilação

---

**Data da correção**: 28/12/2024  
**Status**: ✅ Resolvido  
**Impacto**: Sistema estável e funcional