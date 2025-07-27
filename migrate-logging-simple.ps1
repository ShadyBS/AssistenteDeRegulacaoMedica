# Script simples para migrar console.log para sistema de logging estruturado
# TASK-M-001 - Migração completa de logging

Write-Host "Iniciando migração de logging estruturado..." -ForegroundColor Green

# Lista de arquivos para migrar
$files = @(
    "background.js",
    "content-script.js", 
    "sidebar.js",
    "store.js",
    "MemoryManager.js",
    "KeepAliveManager.js",
    "SectionManager.js",
    "TimelineManager.js",
    "crypto-utils.js",
    "options.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processando $file..." -ForegroundColor Blue
        
        # Lê o conteúdo do arquivo
        $content = Get-Content $file -Raw
        
        # Verifica se já tem o import do logger
        if ($content -notmatch "createComponentLogger") {
            Write-Host "  Adicionando import do logger..." -ForegroundColor Yellow
            
            # Adiciona import no início do arquivo após outros imports
            $lines = Get-Content $file
            $insertIndex = 0
            
            # Encontra onde inserir o import
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match "^import\s") {
                    $insertIndex = $i + 1
                }
            }
            
            # Insere o import e logger
            $componentName = $file.Replace(".js", "").Replace("-", "")
            $componentName = $componentName.Substring(0,1).ToUpper() + $componentName.Substring(1)
            
            $newLines = @()
            $newLines += $lines[0..($insertIndex-1)]
            $newLines += "import { createComponentLogger } from `"./logger.js`";"
            $newLines += ""
            $newLines += "// Logger específico para $componentName"
            $newLines += "const logger = createComponentLogger('$componentName');"
            $newLines += ""
            $newLines += $lines[$insertIndex..($lines.Length-1)]
            
            $newLines | Set-Content $file
        }
        
        Write-Host "  Arquivo $file processado" -ForegroundColor Green
    }
}

Write-Host "Migração concluída!" -ForegroundColor Green