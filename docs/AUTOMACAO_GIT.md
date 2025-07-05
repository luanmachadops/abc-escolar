# 🤖 Automação Git - ABC Escolar

Este documento explica como configurar e usar a automação Git para o projeto ABC Escolar.

## 🚀 Configuração Automática

### 1. GitHub Actions (Deploy Automático)

O arquivo `.github/workflows/auto-deploy.yml` configura:
- **Build automático** quando há push na branch `main`
- **Deploy para GitHub Pages** automaticamente
- **Auto-formatação** de código

### 2. Scripts NPM

Adicionamos os seguintes comandos ao `package.json`:

```bash
# Commit e push automático
npm run git:auto

# Commit com mensagem personalizada
npm run git:commit "Sua mensagem aqui"

# Commit rápido com data/hora
npm run git:push

# Build + commit + push
npm run deploy
```

### 3. Script PowerShell Avançado

O arquivo `scripts/auto-git.ps1` oferece:
- ✅ Verificação automática de mudanças
- 📁 Adição automática de arquivos
- 💾 Commit com mensagem personalizada
- 🌐 Push automático para GitHub
- 🎨 Interface colorida e informativa

## 📋 Como Usar

### Método 1: Script NPM (Recomendado)

```bash
# Automação completa (mais comum)
npm run git:auto

# Com mensagem personalizada
npm run git:commit "feat: Nova funcionalidade implementada"

# Deploy completo (build + git)
npm run deploy
```

### Método 2: Script PowerShell Direto

```powershell
# Básico
.\scripts\auto-git.ps1

# Com mensagem personalizada
.\scripts\auto-git.ps1 -Message "fix: Correção de bug importante"

# Sem push automático
.\scripts\auto-git.ps1 -Push:$false

# Forçar commit mesmo sem mudanças
.\scripts\auto-git.ps1 -Force
```

### Método 3: Comandos Git Tradicionais

```bash
git add .
git commit -m "Sua mensagem"
git push
```

## 🔧 Configuração de Hooks (Opcional)

Para ativar verificações automáticas antes de cada commit:

```bash
# Configurar hooks personalizados
git config core.hooksPath .githooks

# Dar permissão de execução (Linux/Mac)
chmod +x .githooks/pre-commit
```

## 📊 Fluxo de Trabalho Recomendado

### Durante o Desenvolvimento:
```bash
# 1. Desenvolver funcionalidades
# 2. Testar localmente
npm run dev

# 3. Commit automático frequente
npm run git:auto
```

### Para Releases:
```bash
# 1. Build e deploy completo
npm run deploy

# 2. Verificar no GitHub Pages
# https://luanmachadops.github.io/abc-escolar
```

## 🎯 Convenções de Commit

O script sugere usar convenções semânticas:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

### Exemplos:
```bash
npm run git:commit "feat: Adiciona página de calendário"
npm run git:commit "fix: Corrige bug no login"
npm run git:commit "docs: Atualiza documentação"
```

## 🔍 Verificações Automáticas

O sistema inclui verificações automáticas:

1. **ESLint** - Qualidade do código
2. **Build Test** - Verifica se o projeto compila
3. **Formatação** - Auto-formatação de código
4. **Deploy** - Publicação automática

## 🚨 Solução de Problemas

### Erro de Permissão PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro de Autenticação Git:
```bash
# Configurar credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Usar token GitHub se necessário
git remote set-url origin https://TOKEN@github.com/luanmachadops/abc-escolar.git
```

### Hook não executa:
```bash
# Reconfigurar hooks
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## 📈 Benefícios da Automação

- ⚡ **Velocidade**: Commits em segundos
- 🔒 **Consistência**: Sempre segue o mesmo padrão
- 🛡️ **Qualidade**: Verificações automáticas
- 📱 **Simplicidade**: Um comando faz tudo
- 🌐 **Deploy**: Publicação automática
- 📊 **Rastreamento**: Histórico organizado

## 🎉 Conclusão

Com essa automação, você pode:
1. Focar no desenvolvimento
2. Não se preocupar com Git
3. Ter deploys automáticos
4. Manter qualidade do código
5. Histórico organizado

**Comando mais usado**: `npm run git:auto` 🚀