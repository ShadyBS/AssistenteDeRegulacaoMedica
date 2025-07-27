# Script simples para migrar console.log
Write-Host "Iniciando migração de console.log..." -ForegroundColor Green

$files = @("background.js", "content-script.js", "sidebar.js", "api.js", "store.js", "MemoryManager.js", "KeepAliveManager.js", "SectionManager.js", "TimelineManager.js", "crypto-utils.js", "options.js", "utils.js", "renderers.js")

$totalMigrated = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processando $file..." -ForegroundColor Blue
        
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Migrar console.error
        $content = $content -replace 'console\.error\s*\(([^)]+)\)', 'logger.error($1)'
        
        # Migrar console.warn
        $content = $content -replace 'console\.warn\s*\(([^)]+)\)', 'logger.warn($1)'
        
        # Migrar console.info
        $content = $content -replace 'console\.info\s*\(([^)]+)\)', 'logger.info($1)'
        
        # Migrar console.log
        $content = $content -replace 'console\.log\s*\(([^)]+)\)', 'logger.info($1)'
        
        # Migrar console.debug
        $content = $content -replace 'console\.debug\s*\(([^)]+)\)', 'logger.debug($1)'
        
        if ($content -ne $originalContent) {
            Set-Content $file $content -Encoding UTF8
            Write-Host "  Arquivo $file migrado" -ForegroundColor Green
            $totalMigrated++
        } else {
            Write-Host "  Nenhuma alteração em $file" -ForegroundColor Gray
        }
    }
}

Write-Host "Migração concluída! $totalMigrated arquivos alterados." -ForegroundColor Green