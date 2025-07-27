# Script para migrar console.log para sistema de logging estruturado
# TASK-M-001 - Migração completa de logging

Write-Host "🔄 Iniciando migração de logging estruturado..." -ForegroundColor Green

# Arquivos principais da extensão que precisam ser migrados
$filesToMigrate = @(
    "background.js",
    "content-script.js", 
    "sidebar.js",
    "api.js",
    "store.js",
    "validation.js",
    "config.js",
    "renderers.js",
    "MemoryManager.js",
    "KeepAliveManager.js",
    "SectionManager.js",
    "TimelineManager.js",
    "crypto-utils.js",
    "options.js"
)

# Função para adicionar import do logger se não existir
function Add-LoggerImport {
    param($filePath)
    
    $content = Get-Content $filePath -Raw
    
    # Verifica se já tem o import
    if ($content -notmatch "import.*logger\.js") {
        Write-Host "  📦 Adicionando import do logger em $filePath" -ForegroundColor Yellow
        
        # Encontra a última linha de import
        $lines = Get-Content $filePath
        $lastImportIndex = -1
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import\s") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            # Adiciona o import após o último import existente
            $componentName = (Get-Item $filePath).BaseName
            $componentName = $componentName.Substring(0,1).ToUpper() + $componentName.Substring(1)
            
            $newImport = "import { createComponentLogger } from `"./logger.js`";"
            $newLogger = "`n// Logger específico para $componentName`nconst logger = createComponentLogger('$componentName');"
            
            $lines = $lines[0..$lastImportIndex] + $newImport + $newLogger + $lines[($lastImportIndex+1)..($lines.Length-1)]
            $lines | Set-Content $filePath
        }
    }
}

# Função para migrar console.log para logger
function Migrate-ConsoleLogs {
    param($filePath)
    
    Write-Host "  🔄 Migrando logs em $filePath" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Padrões de migração
    $migrations = @(
        # console.error -> logger.error
        @{
            Pattern = 'console\.error\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\)'
            Replacement = 'logger.error($1, { operation: "migrate", context: $2 })'
        },
        # console.warn -> logger.warn  
        @{
            Pattern = 'console\.warn\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\)'
            Replacement = 'logger.warn($1, { operation: "migrate", context: $2 })'
        },
        # console.info -> logger.info
        @{
            Pattern = 'console\.info\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\)'
            Replacement = 'logger.info($1, { operation: "migrate", context: $2 })'
        },
        # console.log -> logger.info
        @{
            Pattern = 'console\.log\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\)'
            Replacement = 'logger.info($1, { operation: "migrate", context: $2 })'
        },
        # console.debug -> logger.debug
        @{
            Pattern = 'console\.debug\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\)'
            Replacement = 'logger.debug($1, { operation: "migrate", context: $2 })'
        }
    )
    
    $changeCount = 0
    
    foreach ($migration in $migrations) {
        $matches = [regex]::Matches($content, $migration.Pattern)
        if ($matches.Count -gt 0) {
            $content = [regex]::Replace($content, $migration.Pattern, $migration.Replacement)
            $changeCount += $matches.Count
        }
    }
    
    if ($changeCount -gt 0) {
        Set-Content $filePath $content
        Write-Host "    ✅ $changeCount logs migrados" -ForegroundColor Green
    } else {
        Write-Host "    ℹ️  Nenhum log para migrar" -ForegroundColor Gray
    }
}

# Executa migração para cada arquivo
foreach ($file in $filesToMigrate) {
    $filePath = Join-Path $PWD $file
    
    if (Test-Path $filePath) {
        Write-Host "📁 Processando $file..." -ForegroundColor Blue
        
        # Adiciona import do logger
        Add-LoggerImport $filePath
        
        # Migra console.logs
        Migrate-ConsoleLogs $filePath
        
        Write-Host "  ✅ $file processado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file não encontrado" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Migração de logging concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Revisar os arquivos migrados" -ForegroundColor White
Write-Host "  2. Executar npm run validate" -ForegroundColor White
Write-Host "  3. Testar a extensão" -ForegroundColor White
Write-Host "  4. Fazer commit das alterações" -ForegroundColor White