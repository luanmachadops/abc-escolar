# 🎓 ABC Escolar

> Sistema completo de gestão escolar desenvolvido com tecnologias modernas

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Mantine](https://img.shields.io/badge/Mantine-UI-339AF0.svg)](https://mantine.dev/)

## 📋 Sobre o Projeto

O ABC Escolar é um sistema de gestão escolar completo que permite:

- 🏫 **Gestão de Escolas**: Cadastro e administração de instituições
- 👥 **Gestão de Usuários**: Administradores, secretários, professores e alunos
- 📚 **Gestão Acadêmica**: Cursos, turmas, disciplinas e matrículas
- 💬 **Comunicação**: Sistema de mensagens e notificações
- 💰 **Financeiro**: Controle de mensalidades e pagamentos
- 📊 **Relatórios**: Dashboards e relatórios detalhados

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **Vite** - Build tool e dev server
- **Mantine 7** - Biblioteca de componentes UI
- **TypeScript** - Tipagem estática
- **Supabase** - Backend as a Service
- **React Router** - Roteamento

## 📋 Funcionalidades

### Cadastro Multi-etapas
- ✅ Cadastro da escola (nome, CNPJ/CPF, endereço completo)
- ✅ Cadastro do administrador (nome, telefone, email, senha)
- ✅ Confirmação de email automática
- ✅ Redirecionamento para dashboard após confirmação

### Módulo Administrador
- ✅ Dashboard com estatísticas
- ✅ Gestão de Turmas
- ✅ Gestão de Cursos
- ✅ Gestão de Alunos
- ✅ Gestão de Professores
- ✅ Sistema de Comunicação
- ✅ Relatórios
- ✅ Controle Financeiro
- ✅ Configurações
- ✅ Autenticação completa
- ✅ Dark Mode
- ✅ Layout responsivo

### Controle de Acesso
- ✅ RLS (Row Level Security) por escola
- ✅ Professores: acesso apenas às suas turmas e alunos
- ✅ Alunos: acesso apenas ao módulo do aluno
- ✅ Administradores: acesso completo à sua escola

### Próximos Módulos (Em desenvolvimento)
- 🔄 Módulo Secretário
- 🔄 Módulo Professor
- 🔄 Módulo Aluno

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd abc-escolar
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. **Execute o projeto**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## ⚙️ Configuração do Supabase

### 🐳 Opção 1: Supabase Local (Recomendado para Desenvolvimento)

1. **Instalar Docker Desktop** (necessário para rodar o Supabase localmente)
2. **Inicializar Supabase**:
   ```bash
   npx supabase init
   ```
3. **Iniciar Supabase Local**:
   ```bash
   npx supabase start
   ```
4. **Usar as configurações do arquivo `.env.local`** (já configurado)

**URLs importantes:**
- **API**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323
- **Email Local**: http://127.0.0.1:54324

### ☁️ Opção 2: Supabase Hospedado

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > API
4. Copie a URL do projeto e a chave anônima
5. Crie um arquivo `.env` baseado no `.env.example`
6. Configure as variáveis de ambiente
7. Execute o script SQL da pasta `supabase/migrations/`

### 📧 Testando Emails

Quando usar o Supabase local, todos os emails são capturados pelo **Inbucket**:
**http://127.0.0.1:54324**

Veja o arquivo `SUPABASE_LOCAL.md` para mais detalhes.

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── layout/
│       └── DashboardLayout.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── RegisterSchoolPage.tsx
│   ├── RegisterAdminPage.tsx
│   ├── RegisterConfirmPage.tsx
│   ├── Dashboard.tsx
│   ├── Turmas.tsx
│   ├── Cursos.tsx
│   ├── Alunos.tsx
│   ├── Professores.tsx
│   ├── Comunicacao.tsx
│   ├── Relatorios.tsx
│   ├── Financeiro.tsx
│   └── Configuracao.tsx
├── App.tsx
├── main.tsx
└── database.sql
```

## 🎨 Recursos

- **Dark Mode**: Alternância entre tema claro e escuro
- **Responsivo**: Interface adaptável para desktop e mobile
- **Autenticação**: Sistema completo de login/cadastro
- **Navegação**: Sidebar com navegação intuitiva
- **Notificações**: Sistema de feedback para o usuário

## 🚧 Status do Desenvolvimento

- ✅ **Estrutura Base**: Configuração inicial, roteamento, autenticação
- ✅ **UI/UX**: Layout responsivo, dark mode, componentes base
- ✅ **Autenticação**: Login, registro multi-etapas, logout, proteção de rotas
- ✅ **Banco de Dados**: Estrutura completa com RLS e controle de acesso
- ✅ **Cadastro**: Fluxo completo de cadastro da escola e administrador
- 🚧 **Módulos**: Páginas base criadas, aguardando implementação das funcionalidades
- ⏳ **Funcionalidades Avançadas**: CRUD completo, relatórios, comunicação

## 📝 Próximos Passos

1. **Implementar CRUD para cada módulo**
2. **Desenvolver módulo específico para professores**
3. **Desenvolver módulo específico para alunos**
4. **Criar sistema de matrículas**
5. **Desenvolver relatórios**
6. **Implementar sistema de comunicação**
7. **Adicionar funcionalidades financeiras**
8. **Testes e otimizações**

## 🔐 Fluxo de Cadastro

### Etapa 1: Cadastro da Escola
- Nome da instituição
- CNPJ/CPF (com formatação automática)
- Endereço completo (logradouro, número, bairro, CEP, cidade, país)
- Validação de CEP automática

### Etapa 2: Cadastro do Administrador
- Nome completo
- Telefone (com opção WhatsApp)
- Email
- Senha (com critérios de segurança)
- Confirmação de senha

### Etapa 3: Confirmação de Email
- Verificação automática do status
- Reenvio de email se necessário
- Redirecionamento automático para o dashboard

## 🤝 Contribuição

Este projeto está em desenvolvimento. Contribuições são bem-vindas!

## 📄 Licença

Este projeto está sob a licença MIT.