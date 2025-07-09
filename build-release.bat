@echo off
chcp 65001 > nul
REM build-release.bat
REM Gera os ZIPs, cria a tag e publica o release no GitHub com os arquivos ZIP

REM 0. Atualiza o CSS com Tailwind usando o script do npm
call npm run build:css || echo Ignorando erro do Tailwind (Browserslist)

:VERSAO_LOOP
REM 1. Lê a versão do manifest.json
for /f "tokens=2 delims=:," %%v in ('findstr /r /c:"\"version\":" manifest.json') do set VERSION=%%~v
set VERSION=%VERSION:"= %
set VERSION=%VERSION: =%

REM 1.1. Lê a versão do manifest-edge.json
for /f "tokens=2 delims=:," %%v in ('findstr /r /c:"\"version\":" manifest-edge.json') do set EDGE_VERSION=%%~v
set EDGE_VERSION=%EDGE_VERSION:"= %
set EDGE_VERSION=%EDGE_VERSION: =%

REM 1.2. Obtém a última versão dos releases do git (compatível com Windows)
set GIT_TAG=
for /f "delims=" %%v in ('git tag --sort=-v:refname ^| findstr /r "^v[0-9]"') do (
    if not defined GIT_TAG set GIT_TAG=%%v
)

REM 1.3. Mostra as versões e pede confirmação
cls
@echo =====================================
@echo Versao atual no git: %GIT_TAG%
@echo Versao em manifest.json: %VERSION%
@echo Versao em manifest-edge.json: %EDGE_VERSION%
@echo =====================================
set /p NOVA_VERSAO="Pressione ENTER para continuar com a versao atual ou digite uma nova versao: "

if not "%NOVA_VERSAO%"=="" (
    @echo Atualizando a versao para %NOVA_VERSAO%...

    REM Atualiza manifest.json
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$path = 'manifest.json'; $manifest = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json; $manifest.version = '%NOVA_VERSAO%'; $manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -Path $path"

    REM Atualiza manifest-edge.json
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$path = 'manifest-edge.json'; $manifest = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json; $manifest.version = '%NOVA_VERSAO%'; $manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -Path $path"

    @echo Versao atualizada nos dois manifests.

    REM Define a nova versão para as variáveis do script
    set "VERSION=%NOVA_VERSAO%"
    set "EDGE_VERSION=%NOVA_VERSAO%"
)

set TAG=v%VERSION%

REM 2. Gera os ZIPs com a versão correta
@echo.
@echo Gerando arquivos ZIP para a versao %VERSION%...
call npm run build:zips
@echo.

REM 3. Cria a tag git e faz o push
@echo Adicionando arquivos, criando commit e tag %TAG%...
git add .
git commit -m "Release %TAG%"
git tag %TAG%
git push
git push --tags

REM Aguarda alguns segundos para garantir que a tag foi processada no GitHub
@echo Aguardando o processamento da tag no GitHub...
timeout /t 5

REM 4. Publica o release no GitHub (requer GitHub CLI)
@echo Publicando release %TAG% no GitHub...
gh release create %TAG% "dist-zips\AssistenteDeRegulacao-firefox-v%VERSION%.zip" "dist-zips\AssistenteDeRegulacao-chromium-v%EDGE_VERSION%.zip" --title "Release %TAG%" --notes "Release automatico gerado pelo script."

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao criar o release no GitHub. Verifique se o GitHub CLI esta instalado e autenticado.
    exit /b 1
)

echo.
echo Release %TAG% publicado com sucesso com os arquivos ZIP!