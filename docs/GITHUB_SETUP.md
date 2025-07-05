# 🚀 Guia para Subir o Projeto ABC Escolar no GitHub

## 📋 Pré-requisitos

- Git instalado no seu computador
- Conta no GitHub
- Projeto ABC Escolar funcionando localmente

## 🔧 Passo a Passo

### 1. 📁 Preparar o Repositório Local

Abra o terminal na pasta do projeto e execute:

```bash
# Inicializar repositório Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "🎉 Initial commit: ABC Escolar - Sistema de Gestão Escolar"
```

### 2. 🌐 Criar Repositório no GitHub

1. Acesse [GitHub.com](https://github.com)
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Configure o repositório:
   - **Repository name**: `abc-escolar`
   - **Description**: `Sistema completo de gestão escolar com React, TypeScript e Supabase`
   - **Visibility**: Public ou Private (sua escolha)
   - ❌ **NÃO** marque "Add a README file" (já temos um)
   - ❌ **NÃO** marque "Add .gitignore" (já temos um)
   - ❌ **NÃO** marque "Choose a license"
5. Clique em **"Create repository"**

### 3. 🔗 Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub mostrará comandos. Execute no terminal:

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/SEU_USUARIO/abc-escolar.git

# Renomear branch principal para 'main' (se necessário)
git branch -M main

# Fazer push inicial
git push -u origin main
```

**⚠️ Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub!**

### 4. 🔐 Configurar Variáveis de Ambiente (Importante!)

O arquivo `.env.local` **NÃO** deve ser enviado para o GitHub por segurança. Para configurar em produção:

#### Para Vercel:
1. Vá para o dashboard do Vercel
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase_producao
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_producao
   ```

#### Para Netlify:
1. Vá para o dashboard do Netlify
2. Selecione seu projeto
3. Vá em **Site settings** → **Environment variables**
4. Adicione as mesmas variáveis acima

### 5. 📝 Comandos Git Úteis para o Dia a Dia

```bash
# Verificar status dos arquivos
git status

# Adicionar arquivos específicos
git add src/pages/NovaPage.tsx

# Adicionar todos os arquivos modificados
git add .

# Fazer commit com mensagem descritiva
git commit -m "✨ feat: adicionar página de relatórios"

# Enviar para o GitHub
git push

# Verificar histórico de commits
git log --oneline

# Criar nova branch para feature
git checkout -b feature/nova-funcionalidade

# Voltar para branch main
git checkout main

# Fazer merge de uma branch
git merge feature/nova-funcionalidade
```

### 6. 🏷️ Convenções de Commit (Recomendado)

Use prefixos para organizar seus commits:

```bash
# Novas funcionalidades
git commit -m "✨ feat: adicionar sistema de notificações"

# Correções de bugs
git commit -m "🐛 fix: corrigir erro no cadastro de alunos"

# Melhorias de performance
git commit -m "⚡ perf: otimizar carregamento da dashboard"

# Refatoração de código
git commit -m "♻️ refactor: reorganizar componentes de layout"

# Documentação
git commit -m "📝 docs: atualizar README com instruções de deploy"

# Testes
git commit -m "✅ test: adicionar testes para componente de login"

# Configuração
git commit -m "🔧 config: configurar ESLint e Prettier"

# Dependências
git commit -m "📦 deps: atualizar dependências do projeto"
```

### 7. 🚀 Deploy Automático

#### Vercel (Recomendado)
1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta GitHub
3. Importe o repositório `abc-escolar`
4. Configure as variáveis de ambiente
5. Deploy automático a cada push!

#### Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Conecte sua conta GitHub
3. Selecione o repositório `abc-escolar`
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Configure as variáveis de ambiente
6. Deploy automático a cada push!

### 8. 📊 Configurar GitHub Pages (Opcional)

Para hospedar gratuitamente no GitHub:

1. Vá para **Settings** do repositório
2. Role até **Pages**
3. Em **Source**, selecione **GitHub Actions**
4. Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 9. 🔒 Configurar Secrets no GitHub

Para GitHub Pages ou Actions:

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 10. 📋 Checklist Final

- [ ] ✅ Repositório criado no GitHub
- [ ] ✅ Código enviado com `git push`
- [ ] ✅ README.md atualizado
- [ ] ✅ .gitignore configurado
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Deploy configurado (Vercel/Netlify)
- [ ] ✅ Documentação completa
- [ ] ✅ Licença adicionada (opcional)

## 🎉 Pronto!

Seu projeto ABC Escolar agora está no GitHub e pode ser acessado por qualquer pessoa!

### 📱 Próximos Passos

1. **Compartilhe**: Envie o link do repositório para colegas
2. **Contribua**: Aceite pull requests de outros desenvolvedores
3. **Documente**: Mantenha a documentação sempre atualizada
4. **Monitore**: Use GitHub Insights para acompanhar o crescimento
5. **Melhore**: Implemente as sugestões do arquivo `MELHORIAS_CODIGO.md`

---

💡 **Dica**: Adicione uma estrela ⭐ ao seu próprio repositório para mostrar que você acredita no projeto!