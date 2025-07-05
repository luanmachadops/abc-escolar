# Documentação das Row Level Security (RLS) - ABC Escolar

## Visão Geral

Este documento descreve as políticas de Row Level Security (RLS) implementadas no sistema ABC Escolar. As RLS garantem que cada usuário tenha acesso apenas aos dados apropriados baseados em sua função e escola.

## Níveis de Acesso

### 1. Administrador (`admin`)
- **Escopo**: Acesso completo aos dados de sua escola
- **Permissões**: Criar, ler, atualizar e deletar todos os registros da escola
- **Restrições**: Não pode acessar dados de outras escolas

### 2. Secretário (`secretario`)
- **Escopo**: Acesso aos dados operacionais de sua escola
- **Permissões**: Criar, ler, atualizar registros (exceto configurações da escola)
- **Restrições**: Não pode modificar dados da escola, apenas visualizar

### 3. Professor (`professor`)
- **Escopo**: Acesso limitado aos dados relacionados às suas turmas
- **Permissões**: 
  - Ver dados de alunos de suas turmas
  - Ver outros professores da escola
  - Criar e ver comunicações
  - Ver disciplinas que leciona
- **Restrições**: Não pode acessar dados financeiros ou administrativos

### 4. Aluno (`aluno`)
- **Escopo**: Acesso apenas aos próprios dados
- **Permissões**:
  - Ver próprios dados pessoais
  - Ver próprias matrículas e notas
  - Ver comunicações direcionadas
  - Ver próprios dados financeiros
- **Restrições**: Não pode ver dados de outros alunos ou informações administrativas

## 🔧 Funções Auxiliares

As seguintes funções foram criadas para simplificar e otimizar as políticas RLS:

### Funções de Validação

### `get_current_user_data()`
Retorna os dados do usuário atual logado.

```sql
RETURNS TABLE(
    user_id UUID,
    escola_id UUID,
    funcao TEXT,
    ativo BOOLEAN
)
```

### `is_admin_or_secretary()`
Verifica se o usuário atual é administrador ou secretário.

### `is_professor()`
Verifica se o usuário atual é professor.

### `is_aluno()`
Verifica se o usuário atual é aluno.

### `get_professor_turmas()`
Retorna as turmas onde o professor atual leciona.

### `get_professor_alunos()`
Retorna os alunos das turmas do professor atual.

### Funções de Cadastro

- `validate_user_registration(email, escola_id, funcao)`: Valida dados durante cadastro de usuários
- `trigger_validate_user_insert()`: Trigger que executa validações antes de inserir usuários

## 🔓 Políticas de INSERT para Cadastro

Para permitir o cadastro de novos usuários e escolas sem autenticação prévia, foram criadas políticas específicas:

### 🏫 Cadastro de Escolas
- **Política**: `escola_insert_public`
- **Permite**: Qualquer pessoa pode criar uma escola durante o processo de cadastro
- **Validação**: Dados básicos são validados pelo banco

### 👥 Cadastro de Usuários
- **Política**: `usuario_insert_registration`
- **Permite**: 
  - Usuários não autenticados podem se cadastrar
  - Admins/secretários podem criar outros usuários
- **Validação**: 
  - Email único
  - Escola deve existir e estar ativa
  - Função deve ser válida (admin, secretario, professor, aluno)

### 🔒 Outras Tabelas
- **Cursos, Turmas, Disciplinas**: Apenas admins e secretários
- **Matrículas e Atribuições**: Apenas admins e secretários
- **Comunicações**: Admins, secretários e professores
- **Financeiro**: Apenas admins e secretários

## 📋 Políticas por Tabela

### Tabela `escolas`

#### `admin_escola_full_access`
- **Tipo**: FOR ALL
- **Usuários**: Administradores
- **Descrição**: Acesso completo à escola do administrador

#### `secretario_escola_read`
- **Tipo**: FOR SELECT
- **Usuários**: Secretários
- **Descrição**: Visualização da escola do secretário

#### `escola_insert_public`
- **Tipo**: FOR INSERT
- **Usuários**: Todos (incluindo não autenticados)
- **Descrição**: Permite criação de escolas durante cadastro público

### Tabela `usuarios`

#### `admin_secretario_usuarios_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo aos usuários da escola

#### `professor_usuarios_limited`
- **Tipo**: FOR SELECT
- **Usuários**: Professores
- **Descrição**: Visualização de outros professores e alunos de suas turmas

#### `aluno_self_only`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização apenas dos próprios dados

#### `usuario_update_self`
- **Tipo**: FOR UPDATE
- **Usuários**: Todos
- **Descrição**: Permite atualizar os próprios dados básicos

#### `usuario_insert_public`
- **Tipo**: FOR INSERT
- **Usuários**: Todos (incluindo não autenticados)
- **Descrição**: Permite criação de usuários durante cadastro público

### Tabela `cursos`

#### `admin_secretario_cursos_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo aos cursos da escola

#### `professor_aluno_cursos_read`
- **Tipo**: FOR SELECT
- **Usuários**: Professores e Alunos
- **Descrição**: Visualização dos cursos da escola

### Tabela `turmas`

#### `admin_secretario_turmas_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo às turmas da escola

#### `professor_turmas_assigned`
- **Tipo**: FOR SELECT
- **Usuários**: Professores
- **Descrição**: Visualização apenas das turmas onde leciona

#### `aluno_turmas_enrolled`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização apenas das turmas onde está matriculado

### Tabela `disciplinas`

#### `admin_secretario_disciplinas_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo às disciplinas

#### `professor_disciplinas_assigned`
- **Tipo**: FOR SELECT
- **Usuários**: Professores
- **Descrição**: Visualização apenas das disciplinas que leciona

#### `aluno_disciplinas_turma`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização das disciplinas de suas turmas

### Tabela `professor_disciplinas`

#### `admin_secretario_prof_disc_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo às atribuições de professores

#### `professor_own_assignments`
- **Tipo**: FOR SELECT
- **Usuários**: Professores
- **Descrição**: Visualização apenas das próprias atribuições

### Tabela `aluno_turmas`

#### `admin_secretario_matriculas_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo às matrículas

#### `professor_alunos_turmas`
- **Tipo**: FOR SELECT
- **Usuários**: Professores
- **Descrição**: Visualização dos alunos de suas turmas

#### `aluno_own_matriculas`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização apenas das próprias matrículas

### Tabela `comunicacoes`

#### `admin_secretario_comunicacoes_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo às comunicações

#### `professor_comunicacoes`
- **Tipo**: FOR ALL
- **Usuários**: Professores
- **Descrição**: Criação e visualização de comunicações próprias e direcionadas

#### `aluno_comunicacoes_destinadas`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização apenas de comunicações direcionadas

### Tabela `financeiro`

#### `admin_secretario_financeiro_full`
- **Tipo**: FOR ALL
- **Usuários**: Administradores e Secretários
- **Descrição**: Acesso completo aos dados financeiros

#### `aluno_financeiro_own`
- **Tipo**: FOR SELECT
- **Usuários**: Alunos
- **Descrição**: Visualização apenas dos próprios dados financeiros

## Índices de Performance

Para otimizar o desempenho das consultas com RLS, foram criados os seguintes índices:

```sql
-- Índice para consultas de usuários por auth_user_id e função
CREATE INDEX idx_usuarios_auth_user_funcao ON usuarios(auth_user_id, funcao) WHERE ativo = true;

-- Índice para atribuições de professores ativos
CREATE INDEX idx_professor_disciplinas_professor_ativo ON professor_disciplinas(professor_id) WHERE ativo = true;

-- Índice para matrículas ativas de alunos
CREATE INDEX idx_aluno_turmas_status_ativo ON aluno_turmas(aluno_id, turma_id) WHERE status = 'ativo';

-- Índice GIN para consultas em destinatários de comunicações
CREATE INDEX idx_comunicacoes_destinatarios ON comunicacoes USING GIN(destinatarios);
```

## Segurança e Boas Práticas

### 1. Princípio do Menor Privilégio
Cada usuário tem acesso apenas aos dados estritamente necessários para sua função.

### 2. Isolamento por Escola
Todos os dados são isolados por escola, garantindo que uma escola não acesse dados de outra.

### 3. Validação de Estado
Apenas usuários ativos podem acessar o sistema.

### 4. Funções SECURITY DEFINER
Todas as funções auxiliares são marcadas como `SECURITY DEFINER` para execução com privilégios elevados quando necessário.

### 5. Auditoria
As políticas permitem rastreamento de quem acessa quais dados através dos logs do Supabase.

## Testando as RLS

### Teste de Isolamento por Escola
```sql
-- Como admin da escola A, não deve ver dados da escola B
SELECT * FROM usuarios WHERE escola_id = 'escola-b-uuid';
-- Resultado esperado: 0 registros
```

### Teste de Acesso de Professor
```sql
-- Como professor, deve ver apenas alunos de suas turmas
SELECT * FROM usuarios WHERE funcao = 'aluno';
-- Resultado esperado: apenas alunos das turmas do professor
```

### Teste de Acesso de Aluno
```sql
-- Como aluno, deve ver apenas próprios dados
SELECT * FROM usuarios;
-- Resultado esperado: apenas o próprio registro
```

## Troubleshooting

### Erro: "new row violates row-level security policy"
- **Causa**: Tentativa de inserir/atualizar dados sem permissão
- **Solução**: Verificar se o usuário tem a função correta e está ativo

### Erro: "permission denied for table"
- **Causa**: RLS não habilitada na tabela
- **Solução**: Executar `ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;`

### Performance lenta
- **Causa**: Consultas complexas sem índices adequados
- **Solução**: Verificar se os índices estão criados e otimizar consultas

## Manutenção

### Adicionando Nova Função
1. Criar função auxiliar de verificação
2. Adicionar políticas específicas para a nova função
3. Testar isolamento e acesso
4. Documentar as novas políticas

### Modificando Políticas Existentes
1. Fazer backup das políticas atuais
2. Testar mudanças em ambiente de desenvolvimento
3. Aplicar via migração
4. Validar funcionamento em produção

### Monitoramento
- Verificar logs de acesso regularmente
- Monitorar performance das consultas
- Auditar políticas periodicamente