# PowerShell Script para Corrigir Encoding de Arquivos

# Define os diretórios a serem ignorados
$excludedDirs = @("node_modules", ".git", ".dist", "dist", "dist-zips", "coverage", ".qodo", ".vscode", "__tests__", ".encoding-backup")

# Define as extensões de arquivo a serem verificadas
$extensions = @("*.js", "*.json", "*.html", "*.css", "*.md")

# Obtém o diretório do script
$scriptDir = $PSScriptRoot

# Encontra todos os arquivos recursivamente, excluindo os diretórios especificados
Get-ChildItem -Path $scriptDir -Recurse -Include $extensions | Where-Object { 
    $_.FullName -notmatch ($excludedDirs -join '|') 
} | ForEach-Object {
    try {
        # Lê o conteúdo com a codificação padrão do sistema (ANSI/Windows-1252)
        $content = Get-Content -Path $_.FullName -Raw -Encoding Default

        # Verifica se o conteúdo contém o caractere de substituição (), indicando problema
        if ($content -match '') {
            Write-Host "Corrigindo encoding de: $($_.FullName)" -ForegroundColor Yellow
            
            # Cria um objeto de codificação UTF-8 sem BOM
            $utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
            # Salva o conteúdo de volta com a codificação UTF-8 sem BOM
            [System.IO.File]::WriteAllLines($_.FullName, $content, $utf8NoBOM)
        }
    } catch {
        Write-Host "Erro ao processar o arquivo: $($_.FullName) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Processo de correção de encoding concluído." -ForegroundColor Green
