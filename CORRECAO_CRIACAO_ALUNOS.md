# Correção do Sistema de Criação de Alunos

## Problemas Identificados e Soluções

### 1. Campo `primeira_vez` Ausente na Tabela `usuarios`

**Problema:** O código estava tentando usar o campo `primeira_vez` que não existia na tabela `usuarios`.

**Solução:** 
- Criada migração `20241221000000_add_primeira_vez_field.sql`
- Adicionado campo `primeira_vez BOOLEAN DEFAULT false`
- Criado índice para melhor performance

### 2. Geração de Username Duplicado

**Problema:** A função `generateUsername` podia gerar usernames duplicados para alunos com nomes similares.

**Solução:**
- Adicionado timestamp aos usernames gerados
- Implementada verificação de unicidade de email fictício
- Sistema de retry com até 5 tentativas

### 3. Validação de Email Insuficiente

**Problema:** Emails inválidos podiam passar pela validação frontend.

**Solução:**
- Adicionada validação regex no frontend
- Melhorado tratamento de erros específicos do Supabase
- Mensagens de erro mais claras e específicas

### 4. Tratamento de Erros Genérico

**Problema:** Erros do Supabase eram exibidos de forma genérica.

**Solução:**
- Implementado tratamento específico para:
  - Emails duplicados
  - Formatos inválidos
  - Erros de referência (foreign key)
  - Constraints de validação

## Como Usar o Sistema de Criação de Alunos

### 1. Acesso à Página
- Navegue para `/alunos`
- Apenas administradores e secretários têm acesso

### 2. Criar Novo Aluno
1. Clique no botão "Novo Aluno"
2. Preencha os campos obrigatórios:
   - **Nome:** Nome completo do aluno
   - **Turma:** Selecione uma turma ativa
   - **Tipo de Acesso:** Email ou Username

### 3. Tipos de Acesso

#### Acesso por Email
- Requer email válido
- Aluno fará login com email e senha
- Ideal para alunos com email próprio

#### Acesso por Username
- Sistema gera username automaticamente
- Formato: `aluno.nome.sobrenome.2024.123456`
- Email fictício: `username@abcescolar.com`
- Ideal para alunos sem email

### 4. Campos Opcionais
- **CPF:** Documento do aluno
- **Telefone:** Contato do aluno
- **Endereço:** Endereço residencial
- **Data de Nascimento:** Data de nascimento

### 5. Após Criação
- Sistema gera senha segura automaticamente
- Modal exibe credenciais de acesso
- Opções para compartilhar:
  - Email
  - WhatsApp
  - Copiar para área de transferência

## Validações Implementadas

### Frontend
- Nome obrigatório
- Turma obrigatória
- Email obrigatório se tipo de acesso for "email"
- Formato de email válido

### Backend
- Email único no sistema
- Username único (com retry automático)
- Referências válidas (escola, turma)
- Constraints de formato (email, CPF)

## Segurança

### Senhas
- Geradas automaticamente com 12 caracteres
- Incluem: letras maiúsculas, minúsculas, números e símbolos
- Marcadas como `primeira_vez = true` para forçar alteração

### Permissões
- Apenas admin/secretário pode criar alunos
- RLS (Row Level Security) ativo
- Auditoria automática de ações

### Cleanup Automático
- Se falhar inserção na tabela `usuarios`, usuário Auth é deletado
- Evita usuários órfãos no sistema

## Troubleshooting

### Erro: "Este email já está cadastrado"
- Verifique se o email não está em uso
- Use tipo de acesso "Username" se necessário

### Erro: "Formato de email inválido"
- Verifique se o email tem formato válido
- Exemplo: `usuario@dominio.com`

### Erro: "Turma é obrigatória"
- Certifique-se de que existem turmas ativas
- Verifique se a turma selecionada existe

### Erro: "Não foi possível gerar email único"
- Problema raro com geração de username
- Tente novamente ou use email real

## Logs e Monitoramento

- Erros são logados no console do navegador
- Ações são auditadas na tabela `audit_log`
- Notificações visuais para feedback do usuário

## Próximos Passos

1. **Importação em Lote:** Sistema para importar múltiplos alunos via CSV
2. **Integração com API de CEP:** Preenchimento automático de endereço
3. **Validação de CPF:** Verificação de CPF válido
4. **Fotos de Perfil:** Upload de fotos dos alunos
5. **Histórico Escolar:** Integração com notas e frequência