@echo off
REM build-release.bat
REM Gera os ZIPs, cria a tag e publica o release no GitHub com os arquivos ZIP

REM 0. Atualiza o CSS com Tailwind
npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify
if errorlevel 1 exit /b

REM 1. Gera os ZIPs
call build-zips.bat

REM 2. Lê a versão do manifest.json
for /f "tokens=2 delims=:," %%v in ('findstr "\"version\"" manifest.json') do set VERSION=%%~v
set VERSION=%VERSION:~1,-1%
set TAG=v%VERSION%

REM 2.1. Lê a versão do manifest-edge.json
for /f "tokens=2 delims=:," %%v in ('findstr "\"version\"" manifest-edge.json') do set EDGE_VERSION=%%~v
set EDGE_VERSION=%EDGE_VERSION:~1,-1%

REM 2.2. Obtém a última versão dos releases do git
for /f "delims=" %%v in ('git tag --sort=-v:refname ^| findstr /r "^v[0-9]" ^| head -n 1') do set GIT_TAG=%%v

REM 2.3. Mostra as versões e pede confirmação
cls
@echo =====================================
@echo Versão atual no git: %GIT_TAG%
@echo Versão em manifest.json: %VERSION%
@echo Versão em manifest-edge.json: %EDGE_VERSION%
@echo =====================================
set /p CONTINUE="Deseja continuar com o release usando estas versões? (S/N): "
if /i not "%CONTINUE%"=="S" exit /b

REM 3. Cria a tag git

git add .
git commit -m "Release %TAG%"
git tag %TAG%
git push
git push --tags

REM Aguarda alguns segundos para garantir que a tag foi processada no GitHub
timeout /t 5

REM 4. Publica o release no GitHub (requer GitHub CLI: https://cli.github.com/)
REM Substitua os nomes dos arquivos ZIP conforme gerados pelo build-zips.js

gh release create %TAG% dist-zips\AssistenteDeRegulacao-firefox-v%VERSION%.zip dist-zips\AssistenteDeRegulacao-v%EDGE_VERSION%.zip --title "Release %TAG%" --notes "Release automático gerado pelo script." || exit /b

echo Release %TAG% publicado com os arquivos ZIP!
