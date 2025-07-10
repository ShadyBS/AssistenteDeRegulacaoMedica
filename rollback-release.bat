@echo off
REM ### Substitua pela tag que você quer remover ###
set TAG_A_REMOVER=v3.2.10

echo Removendo o release %TAG_A_REMOVER% do GitHub...
gh release delete %TAG_A_REMOVER% --yes

if %errorlevel% neq 0 (
    echo ERRO: Falha ao remover o release. Verifique a tag e se o GitHub CLI está autenticado.
    exit /b 1
)

echo.
echo Removendo a tag remota %TAG_A_REMOVER%...
git push --delete origin %TAG_A_REMOVER%

echo.
echo Removendo a tag local %TAG_A_REMOVER%...
git tag -d %TAG_A_REMOVER%

echo.
echo Release e tag %TAG_A_REMOVER% removidos com sucesso!
