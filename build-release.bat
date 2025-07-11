@echo on
chcp 65001 > nul
setlocal ENABLEDELAYEDEXPANSION

REM build-release.bat
REM Gera os ZIPs, cria a tag e publica o release no GitHub com os arquivos ZIP

:VERSAO_LOOP
echo -------- Etapa 1: leitura de versões --------
for /f "delims=" %%v in ('powershell -NoProfile -Command "(Get-Content -Raw -Encoding UTF8 manifest.json | ConvertFrom-Json).version"') do set VERSION=%%v
for /f "delims=" %%v in ('powershell -NoProfile -Command "(Get-Content -Raw -Encoding UTF8 manifest-edge.json | ConvertFrom-Json).version"') do set EDGE_VERSION=%%v

set GIT_TAG=
for /f "delims=" %%v in ('git describe --tags --abbrev^=0 2^>nul') do set GIT_TAG=%%v

cls
echo =====================================
echo Última tag no git: %GIT_TAG%
echo Versão em manifest.json: %VERSION%
echo Versão em manifest-edge.json: %EDGE_VERSION%
echo =====================================
set /p NOVA_VERSAO="Pressione ENTER para continuar com a versão atual ou digite uma nova versão: "

if not "%NOVA_VERSAO%"=="" (
    echo Atualizando a versão para %NOVA_VERSAO%...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
      "$path = 'manifest.json'; ^
       $manifest = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json; ^
       $manifest.version = '%NOVA_VERSAO%'; ^
       $manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -Path $path"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
      "$path = 'manifest-edge.json'; ^
       $manifest = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json; ^
       $manifest.version = '%NOVA_VERSAO%'; ^
       $manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -Path $path"
    set "VERSION=%NOVA_VERSAO%"
    set "EDGE_VERSION=%NOVA_VERSAO%"
)
set TAG=v%VERSION%
pause

echo -------- Etapa 2: build:zips --------
echo Gerando arquivos ZIP para a versão %VERSION%...
call npm run build:zips
pause

echo -------- Etapa 3: contagem de commits --------
REM 3. Verifica se existem commits novos para incluir no release
if defined GIT_TAG ( echo Verificando se existem novos commits desde "%GIT_TAG%"... ) else ( echo Verificando todos os commits (primeiro release)... )

REM Sanitiza a tag e monta o range
if defined GIT_TAG ( set "safe_tag=!GIT_TAG!" & set "safe_tag=!safe_tag:(=!" & set "safe_tag=!safe_tag:)=!" & set "GIT_RANGE=!safe_tag!..HEAD" ) else ( set "GIT_RANGE=HEAD" )

set COMMIT_COUNT=0
for /f %%c in ('git rev-list --count !GIT_RANGE! 2^>^&1') do set COMMIT_COUNT=%%c

echo !COMMIT_COUNT! commits novos encontrados.
if "!COMMIT_COUNT!"=="0" (
    if defined GIT_TAG ( echo ERRO: Nenhum commit novo encontrado desde a última tag (%GIT_TAG%). ) else ( echo ERRO: Nenhum commit encontrado para criar o primeiro release. )
    pause
    goto :EOF
)
pause

echo -------- Etapa 4: coleta de release notes --------
set NOTES_FILE=release_notes.txt

(
  echo # Release %TAG%
  echo.
  echo ## Mudanças
) > %NOTES_FILE%

set "LOG_FORMAT=- [%%h](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/commit/%%h) (%%an): %%s%%n"

if defined GIT_TAG ( git log --no-merges !GIT_RANGE! --pretty=format:"!LOG_FORMAT!" >> %NOTES_FILE% ) else ( git log --no-merges --pretty=format:"!LOG_FORMAT!" >> %NOTES_FILE% )

type %NOTES_FILE%
pause

echo -------- Etapa 5: commit, tag e push --------
git add -A
git reset HEAD %NOTES_FILE% > nul
git commit -m "Release %TAG%"
git tag %TAG%
git push
git push --tags
pause

echo -------- Etapa 6: GitHub Release --------
gh release create %TAG% ^
  "dist-zips\AssistenteDeRegulacao-firefox-v%VERSION%.zip" ^
  "dist-zips\AssistenteDeRegulacao-chromium-v%EDGE_VERSION%.zip" ^
  --title "Release %TAG%" -F %NOTES_FILE%
if errorlevel 1 ( echo ERRO: Falha ao criar o release no GitHub. Código %errorlevel%. & pause & exit /b 1 )
pause

echo -------- Etapa 7: limpeza --------
del %NOTES_FILE%
echo Release %TAG% publicado com sucesso!
endlocal
