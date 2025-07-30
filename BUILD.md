# 🏗️ Build & Release System - Assistente de Regulação Médica

Este documento descreve o sistema completo de build e release para a extensão de navegador Assistente de Regulação Médica.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Pré-requisitos](#-pré-requisitos)
- [Comandos Disponíveis](#-comandos-disponíveis)
- [Fluxo de Desenvolvimento](#-fluxo-de-desenvolvimento)
- [Sistema de Build](#-sistema-de-build)
- [Sistema de Release](#-sistema-de-release)
- [Integração VSCode](#-integração-vscode)
- [GitHub Actions](#-github-actions)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O sistema de build e release foi projetado para automatizar completamente o processo de desenvolvimento, validação, build e distribuição da extensão para Chrome e Firefox.

### Características Principais

- ✅ **Build automático** para Chrome e Firefox
- ✅ **Manifest switching** automático entre versões
- ✅ **Validação** completa de código e manifests
- ✅ **Security scanning** integrado
- ✅ **Versionamento semântico** automático
- ✅ **GitHub Releases** automáticos
- ✅ **Upload para stores** (Chrome Web Store e Firefox Add-ons)
- ✅ **Integração completa** com VSCode
- ✅ **CI/CD** com GitHub Actions

## 📦 Pré-requisitos

### Software Necessário

```bash
# Node.js 16+ e npm
node --version  # >= 16.0.0
npm --version   # >= 8.0.0

# Git
git --version
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ShadyBS/AssistenteDeRegulacaoMedica.git
cd AssistenteDeRegulacaoMedica

# Instale as dependências
npm install

# Verifique a instalação
npm run validate:manifests
```

## 🚀 Comandos Disponíveis

### Desenvolvimento

```bash
# Modo desenvolvimento com watch do CSS
npm run dev

# Build CSS apenas
npm run build:css
npm run build:css:watch

# Validações
npm run validate              # Validação completa
npm run validate:manifests    # Apenas manifests
npm run lint                  # ESLint
npm run lint:fix             # ESLint com correções automáticas
```

### Build

```bash
# Build completo (todos os targets)
npm run build

# Build específico por target
npm run build:chrome
npm run build:firefox

# Build tradicional (CSS + ZIPs)
npm run build:all
npm run build:zips

# Limpeza
npm run clean
```

### Versionamento

```bash
# Incremento automático
npm run version:patch    # 1.0.0 → 1.0.1
npm run version:minor    # 1.0.0 → 1.1.0
npm run version:major    # 1.0.0 → 2.0.0

# Versão específica
node scripts/version.js 2.1.0

# Modo dry-run (simula sem aplicar)
node scripts/version.js patch --dry-run
```

### Release

```bash
# Release automático
npm run release:patch
npm run release:minor
npm run release:major

# Release com versão específica
npm run release 2.1.0

# Release dry-run
npm run release:dry

# Release manual (script legado)
node release.js 2.1.0
```

### Upload para Stores

```bash
# Upload para Chrome Web Store
npm run upload:chrome

# Upload para Firefox Add-ons
npm run upload:firefox

# Com dry-run
node scripts/store-upload.js --target=chrome --dry-run
```

### Testes

```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 🔄 Fluxo de Desenvolvimento

### Desenvolvimento Diário

1. **Inicie o modo desenvolvimento**
   ```bash
   npm run dev
   ```

2. **Faça suas alterações** no código

3. **Valide periodicamente**
   ```bash
   npm run validate
   ```

4. **Teste a extensão**
   - Firefox: `about:debugging` → "Carregar extensão temporária"
   - Chrome: `chrome://extensions` → "Carregar sem compactação"

5. **Commit suas alterações**
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade X"
   ```

### Preparação para Release

1. **Validação completa**
   ```bash
   npm run validate
   npm run build:all
   ```

2. **Atualização de versão**
   ```bash
   npm run version:minor  # ou patch/major
   ```

3. **Push das alterações**
   ```bash
   git push origin main --tags
   ```

4. **Release automático** (via GitHub Actions) ou manual:
   ```bash
   npm run release:minor
   ```

## 🏗️ Sistema de Build

### Arquitetura do Build

O sistema de build é baseado em múltiplas ferramentas:

- **Webpack**: Bundling e otimização
- **Tailwind CSS**: Compilação de estilos
- **ESLint**: Validação de código
- **Scripts customizados**: Automação específica

### Targets Suportados

#### Chrome/Edge (Chromium)
- **Manifest**: `manifest-edge.json`
- **Output**: `.dist/chrome/`
- **ZIP**: `AssistenteDeRegulacao-chrome-v*.zip`

#### Firefox
- **Manifest**: `manifest.json`
- **Output**: `.dist/firefox/`
- **ZIP**: `AssistenteDeRegulacao-firefox-v*.zip`

### Processo de Build

1. **Validação de ambiente**
   - Verifica Node.js version
   - Valida manifests
   - Verifica CSS compilado

2. **Compilação CSS**
   ```bash
   tailwindcss -i ./src/input.css -o ./dist/output.css --minify
   ```

3. **Build por target**
   - Copia arquivos necessários
   - Aplica manifest correto
   - Otimiza assets

4. **Validação do build**
   - Verifica arquivos essenciais
   - Valida estrutura
   - Testa integridade

5. **Criação de ZIPs**
   - Gera pacotes de distribuição
   - Calcula hashes de integridade
   - Gera relatório de build

### Configuração Webpack

```javascript
// webpack.config.js
module.exports = (env, argv) => {
  const target = env.target || 'chrome';
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      background: './background.js',
      'content-script': './content-script.js',
      sidebar: './sidebar.js'
    },
    output: {
      path: `.dist/${target}`,
      filename: '[name].js'
    },
    // ... configurações específicas
  };
};
```

## 🚀 Sistema de Release

### Fluxo de Release Automático

1. **Preparação**
   - Valida ambiente
   - Determina nova versão
   - Verifica branch e status Git

2. **Validações**
   - ESLint
   - Validação de manifests
   - Security scan
   - Testes (se configurados)

3. **Build**
   - Compila CSS
   - Build para todos os targets
   - Gera ZIPs de distribuição

4. **Versionamento**
   - Atualiza `package.json`
   - Atualiza manifests
   - Atualiza `CHANGELOG.md`
   - Cria commit e tag Git

5. **GitHub Release**
   - Gera changelog automático
   - Cria release no GitHub
   - Faz upload dos ZIPs

6. **Upload para Stores** (opcional)
   - Chrome Web Store
   - Firefox Add-ons

### Versionamento Semântico

O sistema segue [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.0 → 1.0.1): Correções de bugs
- **MINOR** (1.0.0 → 1.1.0): Novas funcionalidades compatíveis
- **MAJOR** (1.0.0 → 2.0.0): Mudanças incompatíveis

### Conventional Commits

O sistema reconhece [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nova funcionalidade        # → MINOR
fix: correção de bug            # → PATCH
feat!: mudança incompatível     # → MAJOR
docs: atualização documentação  # → PATCH
```

## 🎯 Integração VSCode

### Tasks Disponíveis

Acesse via `Ctrl+Shift+P` → "Tasks: Run Task":

- **🏗️ Build: All Targets** - Build completo
- **🔵 Build: Chrome Only** - Build apenas Chrome
- **🦊 Build: Firefox Only** - Build apenas Firefox
- **🔄 Dev: CSS Watch** - Modo desenvolvimento
- **🔍 Validate: All** - Validação completa
- **🚀 Release: Patch/Minor/Major** - Release automático

### Configurações de Debug

Configurações disponíveis em `F5`:

- **🔵 Debug: Chrome Extension** - Debug no Chrome
- **🦊 Debug: Firefox Extension** - Debug no Firefox
- **🔧 Debug: Background Script** - Debug do service worker
- **🏗️ Debug: Build Script** - Debug dos scripts de build

### Configurações do Workspace

O workspace está configurado com:

- **ESLint** integrado
- **Formatação automática** ao salvar
- **Validação** de manifests
- **Snippets** para extensões
- **Configurações** otimizadas

## ⚙️ GitHub Actions

### Workflows Disponíveis

#### Build Workflow (`.github/workflows/build.yml`)
- **Trigger**: Push/PR para main/develop
- **Matrix**: Chrome + Firefox em Ubuntu/Windows/macOS
- **Validações**: Lint, Security, Compatibility
- **Artifacts**: ZIPs de build para download

#### Release Workflow (`.github/workflows/release.yml`)
- **Trigger**: Tags `v*.*.*` ou manual
- **Build**: Completo para ambos targets
- **GitHub Release**: Automático com changelog
- **Store Upload**: Opcional e configurável

#### Security Workflow (`.github/workflows/security.yml`)
- **Trigger**: Push, PR, schedule semanal
- **Scans**: Dependencies, Code, Secrets, Manifests
- **Relatórios**: Detalhados de segurança

### Configuração de Secrets

Para funcionalidade completa, configure no GitHub:

```bash
# GitHub Release
GITHUB_TOKEN=ghp_...

# Chrome Web Store
CHROME_EXTENSION_ID=...
CHROME_CLIENT_ID=...
CHROME_CLIENT_SECRET=...
CHROME_REFRESH_TOKEN=...

# Firefox Add-ons
FIREFOX_JWT_ISSUER=...
FIREFOX_JWT_SECRET=...
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Build Falha

```bash
# Limpe e reinstale
npm run clean
rm -rf node_modules package-lock.json
npm install

# Verifique Node.js version
node --version  # Deve ser >= 16.0.0

# Valide manifests
npm run validate:manifests
```

#### CSS Não Compila

```bash
# Verifique se o arquivo existe
ls -la src/input.css

# Compile manualmente
npx tailwindcss -i ./src/input.css -o ./dist/output.css

# Verifique configuração
cat tailwind.config.js
```

#### Extensão Não Carrega

```bash
# Verifique build
npm run build:chrome  # ou firefox

# Verifique manifest
cat .dist/chrome/manifest.json

# Verifique console do navegador
# Chrome: chrome://extensions → Detalhes → Inspecionar views
# Firefox: about:debugging → Inspecionar
```

#### Release Falha

```bash
# Verifique status Git
git status

# Verifique se está na branch main
git branch

# Verifique se há commits novos
git log --oneline -5

# Teste em dry-run
npm run release:dry
```

### Logs e Debug

#### Ativar Logs Detalhados

```bash
# Build com logs verbosos
node scripts/build.js --verbose

# Validação com logs detalhados
node scripts/validate.js --verbose

# Release com debug
DEBUG=true node scripts/release.js --dry-run --verbose
```

#### Verificar Artifacts

```bash
# Listar ZIPs gerados
ls -la dist-zips/

# Verificar conteúdo do ZIP
unzip -l dist-zips/AssistenteDeRegulacao-chrome-v*.zip

# Verificar build directory
ls -la .dist/chrome/
```

### Suporte

Para problemas não resolvidos:

1. **Verifique** a documentação em `agents.md`
2. **Consulte** issues no GitHub
3. **Execute** validações completas
4. **Documente** o problema com logs detalhados

## 📚 Recursos Adicionais

- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Firefox Extension Development](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Última atualização**: 2025-01-23 - Sistema Build/Release v2.0.0
