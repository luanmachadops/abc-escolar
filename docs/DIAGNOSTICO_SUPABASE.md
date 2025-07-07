# 🔧 Guia de Diagnóstico e Solução - Supabase

## 🚨 Problema Relatado
**"O Supabase parou de funcionar"**

## 🔍 Diagnóstico Realizado

### ✅ **Status dos Serviços**

#### **1. Verificação do Supabase Local**
```bash
supabase status
```
**Resultado:** ✅ Todos os serviços rodando normalmente
- API URL: http://127.0.0.1:54321
- Studio URL: http://127.0.0.1:54323
- Anon Key: Válida
- Service Role Key: Válida

#### **2. Teste de Conectividade da API**
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:54321/rest/v1/" -Headers @{"apikey"="..."}
```
**Resultado:** ✅ Status Code 200 - API respondendo corretamente

#### **3. Verificação do Frontend**
```bash
npm run dev
```
**Resultado:** ❌ Servidor de desenvolvimento havia parado

## 🎯 **Causa Identificada**

### **Problema Real:**
O **servidor de desenvolvimento (Vite)** havia parado, não o Supabase. O Supabase estava funcionando perfeitamente.

### **Sintomas Confusos:**
- Usuário relatou "Supabase parou"
- Na verdade, era o frontend que não estava acessível
- Supabase backend continuava operacional

## ✅ **Solução Aplicada**

### **1. Reinicialização do Servidor de Desenvolvimento**
```bash
npm run dev
```

### **2. Verificação de Funcionamento**
- ✅ Vite rodando em http://localhost:3000/
- ✅ Supabase API acessível
- ✅ Aplicação funcionando normalmente

## 📋 **Checklist de Diagnóstico para Problemas Similares**

### **Passo 1: Verificar Supabase**
```bash
# Verificar status dos serviços
supabase status

# Se não estiver rodando, iniciar
supabase start

# Se houver problemas, resetar
supabase db reset
```

### **Passo 2: Testar API Diretamente**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:54321/rest/v1/" -Headers @{"apikey"="sua_anon_key"}

# Bash/CMD (se disponível)
curl -H "apikey: sua_anon_key" http://127.0.0.1:54321/rest/v1/
```

### **Passo 3: Verificar Frontend**
```bash
# Verificar se o servidor está rodando
npm run dev

# Se houver erro, limpar cache
npm run build
npm run dev

# Verificar dependências
npm install
```

### **Passo 4: Verificar Conectividade**
```bash
# Testar acesso local
ping 127.0.0.1

# Verificar portas em uso
netstat -an | findstr :3000
netstat -an | findstr :54321
```

## 🛠️ **Comandos de Solução Rápida**

### **Reiniciar Tudo**
```bash
# Parar tudo
supabase stop
# Ctrl+C no terminal do npm run dev

# Iniciar novamente
supabase start
npm run dev
```

### **Reset Completo (Caso Extremo)**
```bash
# Parar serviços
supabase stop

# Limpar containers Docker
docker system prune -f

# Reiniciar Supabase
supabase start

# Aplicar migrações
supabase db reset

# Reiniciar frontend
npm install
npm run dev
```

## 🔍 **Identificação de Problemas Comuns**

### **1. "Supabase não funciona" mas é o Frontend**
**Sintomas:**
- Página não carrega
- Erro de conexão no navegador
- "Cannot connect to server"

**Verificação:**
```bash
supabase status  # Se retorna dados, Supabase está OK
```

**Solução:**
```bash
npm run dev  # Reiniciar frontend
```

### **2. Supabase Realmente Parado**
**Sintomas:**
- `supabase status` retorna erro
- API não responde (status diferente de 200)
- Docker containers não estão rodando

**Solução:**
```bash
supabase start
# ou
supabase db reset
```

### **3. Problemas de Porta**
**Sintomas:**
- "Port already in use"
- Conflito de portas

**Solução:**
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :54321

# Matar processo se necessário
taskkill /PID <process_id> /F
```

### **4. Problemas de Permissão/Docker**
**Sintomas:**
- Erro de permissão
- Docker não inicia
- "Cannot connect to Docker daemon"

**Solução:**
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar Docker Desktop
# Executar como administrador se necessário
```

## 📊 **Logs Importantes para Diagnóstico**

### **Supabase Logs**
```bash
supabase logs
supabase logs --db
supabase logs --api
```

### **Frontend Logs**
- Console do navegador (F12)
- Terminal onde `npm run dev` está rodando
- Network tab no DevTools

### **Docker Logs**
```bash
docker logs <container_name>
docker ps -a  # Ver containers parados
```

## ⚡ **Prevenção de Problemas**

### **1. Monitoramento Automático**
```bash
# Script para verificar status
#!/bin/bash
echo "Verificando Supabase..."
supabase status > /dev/null && echo "✅ Supabase OK" || echo "❌ Supabase com problema"

echo "Verificando Frontend..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend com problema"
```

### **2. Backup de Configurações**
- Manter `.env` atualizado
- Backup regular do banco: `supabase db dump`
- Versionamento das migrações

### **3. Documentação de Ambiente**
- Versões do Node.js, npm, Docker
- Configurações específicas do projeto
- Dependências críticas

## 🚀 **Otimizações de Performance**

### **1. Supabase**
```bash
# Configurar limites de conexão
# Otimizar queries com índices
# Monitorar uso de recursos
```

### **2. Frontend**
```bash
# Build otimizado
npm run build

# Análise de bundle
npm run build -- --analyze

# Cache de dependências
npm ci  # Em produção
```

## 📞 **Quando Pedir Ajuda**

### **Informações para Incluir:**
1. **Logs completos** dos comandos executados
2. **Versões** do software (Node, npm, Supabase CLI, Docker)
3. **Sistema operacional** e versão
4. **Passos exatos** que levaram ao problema
5. **Mensagens de erro** completas
6. **Status dos serviços** (`supabase status`, `docker ps`)

### **Comandos de Diagnóstico Completo:**
```bash
# Informações do sistema
node --version
npm --version
supabase --version
docker --version

# Status dos serviços
supabase status
docker ps
netstat -an | findstr :3000
netstat -an | findstr :54321

# Logs recentes
supabase logs --tail 50
```

---

**Data:** 27/12/2024  
**Versão:** 1.0  
**Status:** ✅ Problema Resolvido  
**Tempo de Resolução:** ~5 minutos