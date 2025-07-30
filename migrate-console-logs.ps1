# Script para migrar todos os console.log restantes para logging estruturado
# TASK-M-001 - Migração completa

Write-Host "🔄 Iniciando migração completa de console.log..." -ForegroundColor Green

# Arquivos da extensão para migrar
$files = @(
    "background.js",
    "content-script.js", 
    "sidebar.js",
    "api.js",
    "store.js",
    "MemoryManager.js",
    "KeepAliveManager.js",
    "SectionManager.js",
    "TimelineManager.js",
    "crypto-utils.js",
    "options.js",
    "utils.js",
    "renderers.js"
)

# Função para migrar console.log em um arquivo
function Migrate-ConsoleLogsInFile {
    param($filePath)
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  ⚠️  Arquivo não encontrado: $filePath" -ForegroundColor Yellow
        return 0
    }
    
    Write-Host "  🔄 Migrando $filePath..." -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    $changeCount = 0
    
    # Padrões de migração com contexto específico
    $patterns = @(
        # console.error com contexto
        @{
            Pattern = 'console\.error\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\);?'
            Replacement = 'logger.error($1, { operation: "migrate", context: $2 });'
        },
        # console.warn com contexto
        @{
            Pattern = 'console\.warn\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\);?'
            Replacement = 'logger.warn($1, { operation: "migrate", context: $2 });'
        },
        # console.info com contexto
        @{
            Pattern = 'console\.info\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\);?'
            Replacement = 'logger.info($1, { operation: "migrate", context: $2 });'
        },
        # console.log com contexto
        @{
            Pattern = 'console\.log\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\);?'
            Replacement = 'logger.info($1, { operation: "migrate", context: $2 });'
        },
        # console.debug com contexto
        @{
            Pattern = 'console\.debug\s*\(\s*([^,)]+)(?:,\s*(.+))?\s*\);?'
            Replacement = 'logger.debug($1, { operation: "migrate", context: $2 });'
        }
    )
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern.Pattern)
        if ($matches.Count -gt 0) {
            $content = [regex]::Replace($content, $pattern.Pattern, $pattern.Replacement)
            $changeCount += $matches.Count
        }
    }
    
    # Limpeza de contexto vazio
    $content = $content -replace ', \{ operation: "migrate", context:  \}', ''
    $content = $content -replace ', \{ operation: "migrate", context: undefined \}', ''
    $content = $content -replace ', \{ operation: "migrate", context: null \}', ''
    
    if ($changeCount -gt 0) {
        Set-Content $filePath $content -Encoding UTF8
        Write-Host "    ✅ $changeCount logs migrados" -ForegroundColor Green
    } else {
        Write-Host "    ℹ️  Nenhum log para migrar" -ForegroundColor Gray
    }
    
    return $changeCount
}

# Executa migração para cada arquivo
$totalMigrated = 0
foreach ($file in $files) {
    $filePath = Join-Path $PWD $file
    $migrated = Migrate-ConsoleLogsInFile $filePath
    $totalMigrated += $migrated
}

Write-Host "`n🎉 Migração concluída!" -ForegroundColor Green
Write-Host "📊 Total de logs migrados: $totalMigrated" -ForegroundColor Cyan

if ($totalMigrated -gt 0) {
    Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Revisar os arquivos migrados" -ForegroundColor White
    Write-Host "  2. Executar npm run validate" -ForegroundColor White
    Write-Host "  3. Testar a extensão" -ForegroundColor White
    Write-Host "  4. Fazer commit das alterações" -ForegroundColor White
}