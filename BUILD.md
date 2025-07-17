# Guia de Build e Release

Este documento descreve como fazer build e release da extensão Assistente de Regulação Médica.

## Pré-requisitos

- Node.js 16+ e npm 8+
- Git configurado
- Token do GitHub com permissões de repositório

## Configuração Inicial

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o token do GitHub:**
   ```bash
   cp .env.example .env
   # Edite .env e adicione seu GITHUB_TOKEN
   ```

3. **Obtenha um token do GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Crie um token com escopo `repo` (Full control of private repositories)
   - Adicione o token no arquivo `.env`

## Scripts Disponíveis

### Build

```bash
# Build do CSS (produção)
npm run build:css

# Build do CSS (desenvolvimento com watch)
npm run build:css:watch
npm run dev  # alias para o comando acima

# Build dos ZIPs da extensão
npm run build:zips

# Build completo (CSS + ZIPs)
npm run build:all

# Limpar arquivos de build
npm run clean
```

### Validação

```bash
# Validar manifests
npm run validate:manifests
```

### Release

```bash
# Release manual (especifica versão)
npm run release 1.2.3

# Release automático (incrementa versão)
npm run release:patch  # 1.0.0 -> 1.0.1
npm run release:minor  # 1.0.0 -> 1.1.0
npm run release:major  # 1.0.0 -> 2.0.0
```

## Processo de Build

### 1. Build do CSS

O CSS é gerado usando Tailwind CSS:

- **Entrada:** `src/input.css`
- **Saída:** `dist/output.css`
- **Configuração:** `tailwind.config.js`

### 2. Build dos ZIPs

O script `build-zips.js` cria ZIPs otimizados para diferentes navegadores:

- **Firefox:** `AssistenteDeRegulacao-firefox-v{version}.zip`
- **Chromium:** `AssistenteDeRegulacao-chromium-v{version}.zip`

#### Arquivos incluídos:
- Todos os arquivos da extensão
- Manifest correto para cada navegador
- CSS compilado

#### Arquivos excluídos:
- `node_modules/`
- `src/`
- Scripts de build
- Arquivos de configuração
- Documentação

### 3. Validações

O processo de build inclui várias validações:

- **Manifests:** Estrutura JSON válida, versão semver
- **Arquivos:** Existência de arquivos obrigatórios
- **Integridade:** Hash SHA256 dos ZIPs gerados

## Processo de Release

### Verificações de Segurança

Antes de criar uma release, o script verifica:

1. **Diretório limpo:** Sem modificações não commitadas
2. **Branch correta:** Deve estar na branch `main`
3. **Tag única:** A versão não pode já existir
4. **Commits novos:** Deve haver commits desde a última tag

### Etapas do Release

1. **Validação:** Ambiente, versão e segurança
2. **Changelog:** Geração automática baseada em commits
3. **Manifests:** Atualização da versão
4. **Build:** CSS e ZIPs
5. **Git:** Commit, tag e push
6. **GitHub:** Criação da release e upload dos assets

### Formato de Commits

Para um changelog melhor, use commits no formato:

```
tipo(escopo): descrição

Exemplos:
feat: adiciona busca por CPF
fix: corrige validação de CNS
docs: atualiza README
refactor: melhora estrutura do código
```

### Tipos de Commit Suportados:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

## Estrutura de Arquivos

```
├── build-zips.js          # Script de build dos ZIPs
├── release.js             # Script de release
├── package.json           # Dependências e scripts
├── .env.example           # Exemplo de configuração
├── BUILD.md               # Este documento
├── manifest.json          # Manifest do Firefox
├── manifest-edge.json     # Manifest do Chromium
├── src/
│   └── input.css          # CSS fonte (Tailwind)
├── dist/
│   └── output.css         # CSS compilado
└── dist-zips/
    ├── *.zip              # ZIPs gerados
    └── build-report.json  # Relatório de build
```

## Troubleshooting

### Erro: "GITHUB_TOKEN não configurado"
- Verifique se o arquivo `.env` existe
- Confirme que o token está correto
- Teste o token: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user`

### Erro: "Diretório não limpo"
- Faça commit das alterações: `git add . && git commit -m "suas alterações"`
- Ou use stash: `git stash`

### Erro: "Tag já existe"
- Verifique tags existentes: `git tag -l`
- Use uma versão diferente
- Ou remova a tag: `git tag -d v1.2.3 && git push origin --delete v1.2.3`

### Erro: "Falha no build do CSS"
- Verifique se `src/input.css` existe
- Confirme que Tailwind está instalado: `npm list tailwindcss`
- Execute manualmente: `npx tailwindcss -i ./src/input.css -o ./dist/output.css`

### Erro: "Manifests inválidos"
- Valide JSON: `npm run validate:manifests`
- Verifique formato da versão (deve ser semver)
- Confirme que campos obrigatórios existem

## Segurança

### Proteção do Token
- **Nunca** commite o arquivo `.env`
- Use tokens com escopo mínimo necessário
- Revogue tokens não utilizados
- Considere usar GitHub Actions para releases automáticas

### Validação de Assets
- Todos os ZIPs incluem hash SHA256
- Relatório de build documenta integridade
- Manifests são validados antes do build

## Automação

Para automação completa, considere usar GitHub Actions:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:all
      - run: npm run release ${{ github.ref_name }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Suporte

Para problemas ou dúvidas:

1. Verifique este documento
2. Consulte logs de erro detalhados
3. Abra uma issue no repositório
4. Use `DEBUG=true` para logs verbosos