---
applyTo: "**"
---

# Assistente de Regulação Médica - Guia IA

## 🎯 IDENTIDADE

**Especialista Extensões de Navegador** com domínio em:

- **Manifest V3**: Content scripts, background scripts, permissions
- **JavaScript ES6**: Modules, async/await, browser APIs
- **TailwindCSS**: Utility-first CSS framework
- **Medical Domain**: Regulação médica, SIGSS, CADSUS integration

## 📋 PRIORIDADES ABSOLUTAS

1. **SEMPRE ler agents.md antes de iniciar - OBRIGATÓRIO**
2. **Manifest V3 compliance - verificar permissions e CSP**
3. **Cross-browser compatibility (Chrome/Firefox/Edge)**
4. **Medical data privacy - nunca expor dados sensíveis**
5. **Build e validação completa antes de commits**

## 📁 ESTRUTURA

### Arquitetura

```
AssistenteDeRegulacaoMedica/
├── manifest.json          # Chrome/Edge config
├── manifest-edge.json     # Edge specific
├── sidebar.js             # Main UI entry point
├── background.js          # Service worker
├── content-script.js      # Page injection
├── api.js                 # External API calls
├── store.js               # State management
├── utils.js               # Shared utilities
├── field-config.js        # Form field mappings
├── filter-config.js       # Filter definitions
├── options.html/js        # Extension settings
├── help.html/js           # Help documentation
├── ui/                    # UI components
│   ├── search.js          # Patient search
│   └── patient-card.js    # Patient display
├── icons/                 # Extension icons
├── src/input.css          # TailwindCSS source
└── dist-zips/             # Built packages
```

### Críticos ⚠️

- `manifest.json` - Permissions, host_permissions, CSP
- `background.js` - Service worker lifecycle
- `content-script.js` - SIGSS page detection
- `store.js` - State consistency

### Convenções

- **Modules**: ES6 imports/exports (ex: `import * as API from "./api.js"`)
- **Functions**: camelCase (ex: `checkMaintenanceTab()`)
- **Constants**: UPPER_SNAKE_CASE (ex: `SRC_DIR`)
- **CSS**: TailwindCSS utility classes

## 🚨 FLUXO OBRIGATÓRIO

### Após QUALQUER modificação:

```
📝 IMPLEMENTAR
    ↓
🎨 BUILD CSS (se mudou UI)
    ↓
📦 BUILD ZIPS (se mudou core)
    ↓
✅ VALIDAR
   ├── Manifest validation
   ├── Browser compatibility
   └── Medical data security
    ↓
🔄 TESTAR EM AMBOS BROWSERS
    ↓
💾 COMMIT
    ↓
✅ COMPLETO
```

### Comandos Essenciais

```bash
npm run build:css        # Build TailwindCSS
npm run build:zips       # Generate browser packages
npm run release          # Full release process
```

### ⚠️ Nunca Pule

- CSS build após mudanças UI
- ZIP generation após mudanças core
- Manifest validation
- Cross-browser testing

## 🔧 SCRIPTS

### Principais

```bash
npm run build:css        # Compila TailwindCSS
npm run build:zips       # Gera ZIPs Chrome/Firefox
npm run release          # Release automático
```

### Build Manual

```bash
# CSS only
tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# Full build
node build-zips.js
```

### Quando Usar

- **Desenvolvimento UI**: `npm run build:css` após mudanças CSS
- **Testing**: `npm run build:zips` para testar em browsers
- **Release**: `npm run release` para versão final

## 💻 PADRÕES

### Nomenclatura

```javascript
// ✅ Correto - ES6 modules
import * as API from "./api.js";
import { store } from "./store.js";
export function checkMaintenanceTab() {}

// ❌ Evitar - CommonJS em browser extension
const API = require("./api.js");
module.exports = { checkMaintenanceTab };
```

### Arquitetura

```javascript
// ✅ State management pattern
const state = { currentPatient: { ficha: null } };
const listeners = [];
export const store = { subscribe, getState, setState };

// ✅ Browser API usage
const api = browser || chrome;
await api.storage.session.set({ reguId: currentReguId });
```

### Manifest V3

```json
// ✅ Correct permissions
"permissions": ["storage", "scripting", "contextMenus"],
"host_permissions": ["*://*/sigss/*"],
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self';"
}
```

### Qualidade

- **Função**: < 50 linhas cada
- **Arquivo**: < 1500 linhas
- **Medical data**: Nunca log/expose

### Bibliotecas Preferidas

- **CSS**: TailwindCSS (não Bootstrap)
- **Icons**: Lucide SVG inline (não FontAwesome)
- **Browser API**: browser-polyfill.js (não chrome.\*)

## 🐛 DEBUG

### Ferramentas

```bash
# Browser extension debugging
chrome://extensions/     # Chrome DevTools
about:debugging         # Firefox debugging
```

### Problemas Comuns

- **Manifest errors**: Verificar permissions e CSP
- **Content script não injeta**: Verificar host_permissions
- **CSS não aplica**: Rebuild com `npm run build:css`
- **Storage issues**: Verificar browser compatibility

### Logs

```javascript
// ✅ Proper logging for extension
console.log("[Assistente de Regulação] Script ativo");
console.warn("⚠️ SIGSS data not found");
console.error("❌ API call failed:", error);
```

## 📝 COMMITS

### Formato

```
<tipo>(<escopo>): <desc>

feat(sidebar): adiciona busca automática de pacientes
fix(manifest): corrige permissions para SIGSS
docs(readme): atualiza instruções de instalação
style(ui): melhora layout da timeline
refactor(api): simplifica chamadas CADSUS
```

**Tipos**: feat, fix, docs, style, refactor, test, chore, release

### Exemplos Projeto

```bash
git commit -m "feat(sidebar): adiciona filtro por data de consulta"
git commit -m "fix(content-script): corrige detecção de IDs SIGSS"
git commit -m "release: v3.3.8 - melhorias na timeline"
```

### Changelog

```markdown
## [Unreleased]

### Added

- **Timeline**: Visualização cronológica de consultas

### Changed

- **UI**: Layout responsivo da sidebar

### Fixed

- **API**: Timeout em chamadas CADSUS
```

## 🔧 VALIDAÇÕES

### Obrigatórias

```bash
# Manifest validation
web-ext lint              # Firefox
chrome-extension-validator # Chrome

# CSS build check
npm run build:css

# ZIP generation
npm run build:zips
```

### Cross-browser

```bash
# Test both browsers
web-ext run               # Firefox testing
# Chrome: Load unpacked in chrome://extensions
```

### Medical Data Security

- [ ] Nunca log dados pessoais
- [ ] Sanitize API responses
- [ ] Validate SIGSS permissions
- [ ] Check CSP compliance

## ✅ CHECKLIST

### Pré-Commit

- [ ] `npm run build:css` executado
- [ ] Manifest validado
- [ ] Cross-browser testado
- [ ] Medical data secured
- [ ] ZIP build functional

### Qualidade

- [ ] ES6 modules usados
- [ ] TailwindCSS classes aplicadas
- [ ] Browser APIs properly called
- [ ] No console errors
- [ ] Medical workflows respected

### Finalização

- [ ] Funcionalidade testada em SIGSS
- [ ] Documentação atualizada
- [ ] Changelog updated
- [ ] Version bumped if needed

## 🚨 AVISOS

### NUNCA

- ❌ Usar CommonJS (require/module.exports) em browser context
- ❌ Hardcode credentials ou dados sensíveis
- ❌ Ignorar CSP violations
- ❌ Deploy sem testar em ambos browsers
- ❌ Log dados médicos no console

### Segurança

```javascript
// ✅ Secure API calls
const sanitizedData = sanitizePatientData(rawData);
await api.storage.session.set({ data: sanitizedData });

// ❌ Nunca fazer
console.log("Patient CPF:", patient.cpf); // GDPR violation
```

### Performance

```javascript
// ✅ Debounced API calls
const debouncedSearch = debounce(searchPatients, 500);

// ✅ Efficient DOM updates
const fragment = document.createDocumentFragment();
// ... append elements to fragment
container.appendChild(fragment);
```

### Manifest V3 Compliance

```javascript
// ✅ Use service worker patterns
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ❌ Avoid background page patterns
// No persistent background scripts
```

## 📋 RESUMO

### Fluxo Básico

1. Ler agents.md → 2. Implementar → 3. Build CSS/ZIPs → 4. Validar → 5. Commit

### Comandos Críticos

```bash
npm run build:css        # Após mudanças UI
npm run build:zips       # Antes de testar
npm run release          # Para releases
```

### Arquivos Críticos

- `manifest.json` - Permissions e CSP
- `sidebar.js` - Entry point principal
- `content-script.js` - SIGSS integration
- `store.js` - State management

### Checklist Mínimo

- [ ] Manifest V3 compliant
- [ ] Cross-browser tested
- [ ] Medical data secured
- [ ] CSS/ZIPs built
- [ ] Commit realizado
