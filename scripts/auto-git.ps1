# Script PowerShell para automacao Git
# Uso: .\scripts\auto-git.ps1 "mensagem do commit"

param(
    [string]$Message = "Auto commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [switch]$Push = $true,
    [switch]$Force = $false
)

Write-Host "Iniciando automacao Git..." -ForegroundColor Green

# Verifica se ha mudancas
$status = git status --porcelain
if (-not $status -and -not $Force) {
    Write-Host "Nenhuma mudanca detectada. Repositorio esta limpo." -ForegroundColor Yellow
    exit 0
}

try {
    # Adiciona todos os arquivos
    Write-Host "Adicionando arquivos..." -ForegroundColor Cyan
    git add .
    
    # Verifica se ha arquivos staged
    $staged = git diff --cached --name-only
    if (-not $staged) {
        Write-Host "Nenhum arquivo foi staged para commit." -ForegroundColor Yellow
        exit 0
    }
    
    # Mostra os arquivos que serao commitados
    Write-Host "Arquivos que serao commitados:" -ForegroundColor Cyan
    git diff --cached --name-only | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
    # Faz o commit
    Write-Host "Fazendo commit..." -ForegroundColor Cyan
    git commit -m $Message
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commit realizado com sucesso!" -ForegroundColor Green
        
        # Push para o repositorio remoto
        if ($Push) {
            Write-Host "Enviando para o GitHub..." -ForegroundColor Cyan
            git push
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Push realizado com sucesso!" -ForegroundColor Green
                Write-Host "Verifique as mudancas em: https://github.com/luanmachadops/abc-escolar" -ForegroundColor Blue
            } else {
                Write-Host "Erro ao fazer push. Verifique sua conexao e permissoes." -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "Erro ao fazer commit." -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "Erro durante a execucao: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Automacao concluida!" -ForegroundColor Green