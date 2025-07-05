# 🧪 Teste das Políticas RLS para Cadastro

## 📋 Visão Geral

Este documento demonstra como testar as políticas RLS (Row Level Security) implementadas para permitir o cadastro de usuários não autenticados.

## 🔓 Cenários de Teste

### 1. 🏫 Cadastro de Escola (Usuário Não Autenticado)

**Cenário**: Primeira vez que alguém acessa o sistema e quer cadastrar uma escola.

```sql
-- Este INSERT deve funcionar (usuário não autenticado)
INSERT INTO escolas (nome, cnpj, endereco, telefone, email)
VALUES (
    'Escola Teste ABC',
    '12.345.678/0001-90',
    'Rua das Flores, 123',
    '(11) 1234-5678',
    'contato@escolateste.com.br'
);
```

**Resultado Esperado**: ✅ Sucesso - Política `escola_insert_public` permite

### 2. 👥 Cadastro de Usuário Admin (Usuário Não Autenticado)

**Cenário**: Após criar a escola, cadastrar o primeiro usuário administrador.

```sql
-- Este INSERT deve funcionar (usuário não autenticado)
INSERT INTO usuarios (
    nome, email, funcao, escola_id, ativo
) VALUES (
    'João Silva',
    'joao@escolateste.com.br',
    'admin',
    (SELECT id FROM escolas WHERE nome = 'Escola Teste ABC'),
    true
);
```

**Resultado Esperado**: ✅ Sucesso - Política `usuario_insert_registration` permite

### 3. 🚫 Tentativa de Cadastro com Email Duplicado

**Cenário**: Tentar cadastrar usuário com email já existente.

```sql
-- Este INSERT deve falhar
INSERT INTO usuarios (
    nome, email, funcao, escola_id, ativo
) VALUES (
    'Maria Santos',
    'joao@escolateste.com.br', -- Email já existe
    'secretario',
    (SELECT id FROM escolas WHERE nome = 'Escola Teste ABC'),
    true
);
```

**Resultado Esperado**: ❌ Erro - "Email já cadastrado"

### 4. 🚫 Tentativa de Cadastro com Escola Inexistente

**Cenário**: Tentar cadastrar usuário para escola que não existe.

```sql
-- Este INSERT deve falhar
INSERT INTO usuarios (
    nome, email, funcao, escola_id, ativo
) VALUES (
    'Pedro Costa',
    'pedro@teste.com',
    'professor',
    '00000000-0000-0000-0000-000000000000', -- UUID inexistente
    true
);
```

**Resultado Esperado**: ❌ Erro - "Escola não encontrada ou inativa"

### 5. 🚫 Tentativa de Cadastro com Função Inválida

**Cenário**: Tentar cadastrar usuário com função não permitida.

```sql
-- Este INSERT deve falhar
INSERT INTO usuarios (
    nome, email, funcao, escola_id, ativo
) VALUES (
    'Ana Lima',
    'ana@teste.com',
    'diretor', -- Função inválida
    (SELECT id FROM escolas WHERE nome = 'Escola Teste ABC'),
    true
);
```

**Resultado Esperado**: ❌ Erro - "Função inválida"

## 🔒 Teste de Políticas Restritivas

### 6. 🚫 Tentativa de INSERT em Outras Tabelas (Usuário Não Autenticado)

**Cenário**: Usuário não autenticado tenta criar curso.

```sql
-- Este INSERT deve falhar
INSERT INTO cursos (nome, descricao, escola_id)
VALUES (
    'Ensino Fundamental',
    'Curso de ensino fundamental',
    (SELECT id FROM escolas WHERE nome = 'Escola Teste ABC')
);
```

**Resultado Esperado**: ❌ Erro - Política RLS bloqueia

## 🧪 Como Testar no Supabase Studio

### 1. Acesse o Supabase Studio Local
```
http://localhost:54323
```

### 2. Vá para SQL Editor
- Clique em "SQL Editor" no menu lateral
- Cole os comandos SQL dos cenários acima
- Execute um por vez

### 3. Verifique os Resultados
- ✅ **Sucesso**: Comando executado sem erro
- ❌ **Erro**: Mensagem de erro específica aparece

### 4. Verificar Dados Inseridos
```sql
-- Ver escolas criadas
SELECT * FROM escolas;

-- Ver usuários criados
SELECT id, nome, email, funcao, escola_id, ativo 
FROM usuarios;
```

## 🔍 Verificação das Políticas

### Ver Políticas Ativas
```sql
-- Ver todas as políticas da tabela usuarios
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('usuarios', 'escolas')
ORDER BY tablename, policyname;
```

### Verificar Funções de Validação
```sql
-- Testar função de validação
SELECT validate_user_registration(
    'teste@email.com',
    (SELECT id FROM escolas LIMIT 1),
    'professor'
);
```

## 🎯 Resultados Esperados

| Cenário | Usuário | Operação | Resultado |
|---------|---------|----------|----------|
| Cadastro Escola | Não autenticado | INSERT escolas | ✅ Sucesso |
| Cadastro Admin | Não autenticado | INSERT usuarios | ✅ Sucesso |
| Email Duplicado | Não autenticado | INSERT usuarios | ❌ Erro |
| Escola Inexistente | Não autenticado | INSERT usuarios | ❌ Erro |
| Função Inválida | Não autenticado | INSERT usuarios | ❌ Erro |
| Criar Curso | Não autenticado | INSERT cursos | ❌ Erro |
| Criar Turma | Não autenticado | INSERT turmas | ❌ Erro |

## 🚀 Próximos Passos

Após validar que as políticas estão funcionando:

1. **Teste no Frontend**: Acesse http://localhost:3000 e teste o cadastro
2. **Verifique Logs**: Monitore logs de erro no console do navegador
3. **Teste Fluxo Completo**: Cadastre escola → admin → faça login → crie outros usuários

## 🔧 Troubleshooting

### Problema: "permission denied for table usuarios"
**Solução**: Verificar se as políticas de INSERT foram aplicadas corretamente

### Problema: "function validate_user_registration does not exist"
**Solução**: Executar novamente a migração `20241219000002_insert_policies.sql`

### Problema: Trigger não está funcionando
**Solução**: Verificar se o trigger foi criado corretamente:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'validate_user_registration_trigger';
```