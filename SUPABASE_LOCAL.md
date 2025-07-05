# 🐳 Supabase Local - Guia de Uso

## 📋 Configuração Atual

O Supabase está configurado para rodar localmente usando Docker. As configurações estão no arquivo `.env.local`.

## 🚀 Comandos Úteis

### Iniciar Supabase Local
```bash
npx supabase start
```

### Parar Supabase Local
```bash
npx supabase stop
```

### Resetar Banco de Dados
```bash
npx supabase db reset
```

### Ver Status dos Serviços
```bash
npx supabase status
```

## 🔗 URLs Importantes

- **API URL**: http://127.0.0.1:54321
- **Studio (Dashboard)**: http://127.0.0.1:54323
- **Inbucket (Email Local)**: http://127.0.0.1:54324
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

## 📧 Testando Emails

Todos os emails enviados pelo sistema (confirmação de cadastro, etc.) são capturados pelo **Inbucket** em:
**http://127.0.0.1:54324**

Você pode acessar essa URL para ver todos os emails enviados durante o desenvolvimento.

## 🗄️ Acessando o Banco de Dados

Para visualizar e gerenciar o banco de dados, acesse o **Supabase Studio** em:
**http://127.0.0.1:54323**

## 🔑 Credenciais

- **Database User**: postgres
- **Database Password**: postgres
- **JWT Secret**: super-secret-jwt-token-with-at-least-32-characters-long

## 📝 Migrações

As migrações estão na pasta `supabase/migrations/`. O arquivo principal é:
- `20241219000000_initial_schema.sql` - Estrutura completa do banco

## 🧪 Testando o Sistema

1. **Inicie o Supabase**: `npx supabase start`
2. **Inicie o servidor de desenvolvimento**: `npm run dev`
3. **Acesse**: http://localhost:3000
4. **Teste o cadastro**: Vá em "Começar Cadastro"
5. **Verifique emails**: http://127.0.0.1:54324
6. **Monitore o banco**: http://127.0.0.1:54323

## ⚠️ Observações

- O banco de dados é resetado toda vez que você executa `supabase stop` e `supabase start`
- Para manter dados entre reinicializações, use apenas `supabase stop` e `supabase start`
- Para resetar completamente, use `supabase db reset`

## 🐛 Troubleshooting

### Erro de Docker
Se houver problemas com Docker, certifique-se de que o Docker Desktop está rodando.

### Porta em Uso
Se alguma porta estiver em uso, pare outros serviços ou use:
```bash
npx supabase stop
npx supabase start
```

### Problemas de Migração
Se houver problemas com migrações:
```bash
npx supabase db reset
```