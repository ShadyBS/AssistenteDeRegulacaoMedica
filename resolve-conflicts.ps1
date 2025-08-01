# Script para ajudar a resolver conflitos de merge durante rebase
$files = @(
    "SectionManager.js",
    "TimelineManager.js",
    "dist/chrome/TimelineManager.js",
    "dist/chrome/common.js",
    "dist/chrome/options.js",
    "dist/chrome/service-worker.js",
    "dist/chrome/sidebar.js",
    "dist/chrome/styles.js",
    "dist/chrome/ui/patient-card.js",
    "dist/chrome/ui/search.js",
    "dist/edge/TimelineManager.js",
    "dist/edge/background.js",
    "dist/edge/common.js",
    "dist/edge/options.js",
    "dist/edge/sidebar.js",
    "dist/firefox/TimelineManager.js",
    "dist/firefox/background.js",
    "dist/firefox/common.js",
    "dist/firefox/options.js",
    "dist/firefox/sidebar.js",
    "scripts/validation/validate-performance.cjs"
)

foreach ($file in $files) {
    Write-Host "Abrindo $file para resolver conflitos..." -ForegroundColor Yellow
    code $file
    $response = Read-Host "Conflitos resolvidos? (s/n)"
    
    if ($response -eq "s") {
        git add $file
        Write-Host "$file adicionado ao staging." -ForegroundColor Green
    } else {
        Write-Host "$file será tratado mais tarde." -ForegroundColor Red
    }
}

Write-Host "Verificando se todos os conflitos foram resolvidos..." -ForegroundColor Yellow
git status

$continue = Read-Host "Continuar com git rebase --continue? (s/n)"
if ($continue -eq "s") {
    git rebase --continue
}
