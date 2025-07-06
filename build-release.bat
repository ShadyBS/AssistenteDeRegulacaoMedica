@echo off
REM build-release.bat
REM Gera os ZIPs, cria a tag e publica o release no GitHub com os arquivos ZIP

REM 1. Gera os ZIPs
call build-zips.bat

REM 2. Lê a versão do manifest.json
for /f "tokens=2 delims=:," %%v in ('findstr "\"version\"" manifest.json') do set VERSION=%%~v
set VERSION=%VERSION:~1,-1%
set TAG=v%VERSION%

REM 3. Cria a tag git

git add .
git commit -m "Release %TAG%"
git tag %TAG%
git push
git push --tags

REM 4. Publica o release no GitHub (requer GitHub CLI: https://cli.github.com/)
REM Substitua os nomes dos arquivos ZIP conforme gerados pelo build-zips.js

gh release create %TAG% dist-zips\AssistenteDeRegulacao-firefox-v%VERSION%.zip dist-zips\AssistenteDeRegulacao-v%VERSION%.zip --title "Release %TAG%" --notes "Release automático gerado pelo script."

echo Release %TAG% publicado com os arquivos ZIP!
