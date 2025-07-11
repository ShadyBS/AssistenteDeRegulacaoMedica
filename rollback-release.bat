@echo off
chcp 65001 > nul
REM rollback-release.bat
REM Remove um release do GitHub, a tag associada e reverte o commit de release.

set /p TAG_A_REMOVER="Digite a tag do release que deseja reverter (ex: v1.2.3): "
if "%TAG_A_REMOVER%"=="" (
    echo Tag inválida. Operação cancelada.
    exit /b 1
)

echo.
echo ATENÇÃO: Esta ação irá:
echo   1. Deletar o release e a tag '%TAG_A_REMOVER%' do GitHub.
echo   2. Reverter o último commit localmente (git reset --hard HEAD~1).
echo   3. Forçar o push para o repositório remoto.
echo.
echo ISSO REESCREVERÁ O HISTÓRICO DO GIT. Use com cuidado.
echo.
set /p CONFIRM="Tem certeza que deseja continuar (s/n)? "
if /i not "%CONFIRM%"=="s" (
    echo Operação cancelada.
    exit /b 0
)

echo.
echo Removendo o release e a tag '%TAG_A_REMOVER%' do GitHub...
gh release delete %TAG_A_REMOVER% --yes --cleanup-tag

if %errorlevel% neq 0 (
    echo ERRO: Falha ao remover o release. Verifique a tag e se o GitHub CLI está autenticado.
    exit /b 1
)

echo Revertendo o último commit localmente...
git reset --hard HEAD~1

echo.
echo Forçando o push para reverter o commit no remoto...
git push --force

echo.
echo Release, tag e commit para '%TAG_A_REMOVER%' revertidos com sucesso!
