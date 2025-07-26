# Guia para Agentes de IA - Assistente de Regulação Médica

## 🎯 Introdução e Objetivo Principal

### Propósito do Projeto
O **Assistente de Regulação Médica** é uma extensão para navegadores (Firefox, Chrome, Edge) que auxilia médicos reguladores na análise de solicitações médicas, centralizando informações do paciente e automatizando tarefas repetitivas no sistema SIGSS.

### Papel do Agente na Equipe
Como agente de IA trabalhando neste projeto, você deve:
- **Manter a qualidade médica**: Garantir que todas as modificações preservem a integridade dos dados médicos
- **Seguir padrões de segurança**: Implementar práticas rigorosas de sanitização e validação
- **Preservar compatibilidade**: Manter funcionamento em Firefox, Chrome e Edge
- **Documentar mudanças**: Atualizar CHANGELOG.md e documentação relevante

### Expectativas de Qualidade
- ✅ **Código seguro**: Sempre use sanitização e validação adequada
- ✅ **Compatibilidade cross-browser**: Teste em múltiplos navegadores
- ✅ **Performance otimizada**: Considere uso de memória e responsividade
- ✅ **Documentação atualizada**: Mantenha documentação sincronizada com código

---

## 📁 Estrutura do Projeto

### Arquitetura Geral
```
AssistenteDeRegulacaoMedica/
├── 📄 manifest.json              # Manifest V3 (Firefox)
├── 📄 manifest-edge.json         # Manifest V3 (Chrome/Edge)
├── 🔧 background.js              # Service Worker principal
├── 🔧 content-script.js          # Script injetado nas páginas SIGSS
├── 🎨 sidebar.js                 # Interface principal da extensão
├── 📊 api.js                     # Camada de comunicação com SIGSS
├── 🔒 api-constants.js           # Constantes centralizadas da API
├── 🛡️ validation.js              # Validações de dados médicos
├── 🎯 renderers.js               # Renderização de componentes UI
├── 💾 store.js                   # Gerenciamento de estado
├── 🔧 utils.js                   # Utilitários gerais
├── ⚙️ config.js                  # Configurações da extensão
├── 🏗️ build-zips.js              # Script de build para distribuição
├── 🚀 release.js                 # Script de release automatizado
├── 📚 src/input.css              # CSS fonte (Tailwind)
├── 📦 dist/output.css            # CSS compilado
├── 🎨 ui/                        # Componentes de interface
├── 🔧 managers/                  # Gerenciadores especializados
│   ├── KeepAliveManager.js       # Manutenção de conexão
│   ├── MemoryManager.js          # Gerenciamento de memória
│   ├── SectionManager.js         # Gerenciamento de seções
│   └── TimelineManager.js        # Processamento de timeline
└── 📋 options.html/js            # Página de configurações
```

### Arquivos Críticos - ⚠️ NÃO MODIFICAR SEM CUIDADO

#### Manifests (Sincronização Obrigatória)
- `manifest.json` (Firefox)
- `manifest-edge.json` (Chrome/Edge)
- **REGRA**: Sempre manter versões sincronizadas
- **VALIDAÇÃO**: Use `npm run validate:manifests`

#### Core da Extensão
- `background.js` - Service Worker principal
- `content-script.js` - Injeção no SIGSS
- `api-constants.js` - Constantes centralizadas (ponto único de configuração)

#### Arquivos Gerados (NÃO EDITAR)
- `dist/` - Arquivos compilados
- `dist-zips/` - Pacotes de distribuição
- `.qodo/` - Cache de ferramentas

### Padrões e Convenções Existentes

#### Nomenclatura de Arquivos
- **Kebab-case**: `content-script.js`, `build-zips.js`
- **PascalCase para Classes**: `MemoryManager.js`, `SectionManager.js`
- **Descritivo**: Nomes devem indicar claramente a função

#### Estrutura de Código
- **Módulos ES6**: Use `import/export`
- **Compatibilidade**: Sempre use `browser` API com polyfill
- **Logging**: Use console com prefixos identificadores

---

## 🔄 Fluxo de Trabalho Específico

### Passo-a-Passo para Modificações

#### 1. Preparação do Ambiente
```bash
# Instalar dependências
npm install

# Verificar ambiente
npm run validate:manifests

# Iniciar desenvolvimento CSS (se necessário)
npm run dev
```

#### 2. Análise de Impacto
- **Identifique** quais componentes serão afetados
- **Verifique** dependências em `api-constants.js`
- **Considere** impacto em múltiplos navegadores
- **Avalie** necessidade de migração de dados

#### 3. Implementação
```javascript
// ✅ SEMPRE use constantes centralizadas
import { API_ENDPOINTS, API_PARAMS } from './api-constants.js';

// ✅ SEMPRE use browser API compatível
const api = globalThis.browser || globalThis.chrome;

// ✅ SEMPRE valide dados médicos
import { validateCNS, validateCPF } from './validation.js';
```

#### 4. Validação e Build
```bash
# Build completo
npm run build:all

# Validar manifests
npm run validate:manifests

# Testar em múltiplos navegadores
# Firefox: about:debugging
# Chrome: chrome://extensions
```

#### 5. Documentação
- **Atualizar** `CHANGELOG.md` na seção `[Unreleased]`
- **Documentar** novas APIs ou mudanças significativas
- **Atualizar** este arquivo se necessário

#### 6. Versionamento (se aplicável)
```bash
# Para correções
npm run release:patch

# Para novas funcionalidades
npm run release:minor

# Para mudanças incompatíveis
npm run release:major
```

### Scripts de Validação e Build

#### Scripts de Desenvolvimento
```bash
npm run dev                    # CSS watch mode
npm run build:css             # Build CSS produção
npm run build:css:watch       # CSS desenvolvimento
```

#### Scripts de Build
```bash
npm run build:zips            # Gerar ZIPs de distribuição
npm run build:all             # CSS + ZIPs
npm run clean                 # Limpar arquivos temporários
```

#### Scripts de Validação
```bash
npm run validate:manifests    # Validar estrutura dos manifests
```

#### Scripts de Release
```bash
npm run release 1.2.3         # Release específica
npm run release:patch         # Incremento patch
npm run release:minor         # Incremento minor
npm run release:major         # Incremento major
```

### Processo de Teste

#### Teste Local
1. **Build da extensão**: `npm run build:all`
2. **Carregar no Firefox**: `about:debugging` → "Este Firefox" → "Carregar extensão temporária"
3. **Carregar no Chrome**: `chrome://extensions` �� "Modo desenvolvedor" → "Carregar sem compactação"
4. **Testar funcionalidades** no sistema SIGSS

#### Teste de Compatibilidade
- **Firefox**: Usar `AssistenteDeRegulacao-firefox-v*.zip`
- **Chrome/Edge**: Usar `AssistenteDeRegulacao-chromium-v*.zip`
- **Verificar** todas as funcionalidades principais

---

## 💻 Práticas de Código

### Convenções de Nomenclatura

#### Variáveis e Funções
```javascript
// ✅ camelCase para variáveis e funções
const patientData = {};
function fetchPatientInfo() {}

// ✅ UPPER_CASE para constantes
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT = 5000;
```

#### Classes e Construtores
```javascript
// ✅ PascalCase para classes
class MemoryManager {
  constructor() {}
}

// ✅ Prefixos descritivos para managers
class SectionManager {}
class TimelineManager {}
```

#### Arquivos e Módulos
```javascript
// ✅ Kebab-case para arquivos
// content-script.js
// api-constants.js
// build-zips.js

// ✅ PascalCase para classes principais
// MemoryManager.js
// SectionManager.js
```

### Padrões Arquiteturais Específicos

#### 1. Sistema de Constantes Centralizadas
```javascript
// ✅ SEMPRE use api-constants.js
import { 
  API_ENDPOINTS, 
  API_PARAMS, 
  API_HEADERS,
  API_ERROR_MESSAGES 
} from './api-constants.js';

// ✅ Construção de URLs
const url = API_UTILS.buildUrl(API_ENDPOINTS.PATIENT_SEARCH, {
  ...API_PARAMS.PATIENT_SEARCH,
  cpf: sanitizedCPF
});

// ❌ NUNCA hardcode URLs ou parâmetros
const url = 'http://sigss.com/buscarPaciente?cpf=' + cpf; // PROIBIDO
```

#### 2. Compatibilidade Cross-Browser
```javascript
// ✅ SEMPRE use wrapper compatível
const api = globalThis.browser || globalThis.chrome;

// ✅ Para storage
await api.storage.local.set({ key: value });
const data = await api.storage.local.get(['key']);

// ✅ Para tabs
const tabs = await api.tabs.query({ active: true, currentWindow: true });

// ❌ NUNCA use apenas Chrome API
chrome.storage.local.set({ key: value }); // PROIBIDO
```

#### 3. Gerenciamento de Memória
```javascript
// ✅ SEMPRE use MemoryManager para recursos
import { MemoryManager } from './MemoryManager.js';

const memoryManager = new MemoryManager();

// Event listeners
memoryManager.addEventListener(element, 'click', handler);

// Timeouts
memoryManager.setTimeout(() => {}, 1000);

// Cleanup automático
memoryManager.cleanup();
```

#### 4. Validação de Dados Médicos
```javascript
// ✅ SEMPRE valide dados médicos
import { validateCNS, validateCPF, sanitizePatientData } from './validation.js';

// Validação antes de processar
if (!validateCNS(cns)) {
  throw new Error('CNS inválido');
}

// Sanitiza��ão de dados
const safePatientData = sanitizePatientData(rawData);
```

### Bibliotecas e APIs Preferidas

#### APIs de Extensão
```javascript
// ✅ Browser API (compatível)
const api = globalThis.browser || globalThis.chrome;

// ✅ Storage
api.storage.local.set/get
api.storage.session.set/get (quando disponível)

// ✅ Messaging
api.runtime.sendMessage
api.runtime.onMessage.addListener

// ✅ Tabs
api.tabs.query
api.tabs.create
```

#### Manipulação DOM
```javascript
// ✅ Vanilla JavaScript
document.querySelector()
document.createElement()
element.textContent = '' // Seguro contra XSS

// ❌ EVITE innerHTML com dados não sanitizados
element.innerHTML = userInput; // PERIGOSO
```

#### HTTP Requests
```javascript
// ✅ Fetch API nativo
const response = await fetch(url, {
  method: 'POST',
  headers: API_HEADERS.FORM,
  body: formData
});

// ✅ Com tratamento de erro
try {
  const data = await response.json();
} catch (error) {
  console.error('Erro na requisição:', error);
}
```

### Exemplos de Código

#### ✅ Código Correto
```javascript
// Busca de paciente com todas as práticas corretas
import { API_ENDPOINTS, API_PARAMS, API_UTILS } from './api-constants.js';
import { validateCPF } from './validation.js';

async function searchPatient(cpf) {
  // Validação
  if (!validateCPF(cpf)) {
    throw new Error('CPF inválido');
  }

  // Construção de URL usando constantes
  const url = API_UTILS.buildUrl(API_ENDPOINTS.PATIENT_SEARCH, {
    ...API_PARAMS.PATIENT_SEARCH,
    cpf: cpf.replace(/\D/g, '') // Sanitização
  });

  // Requisição com headers corretos
  const response = await fetch(url, {
    headers: API_HEADERS.AJAX
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

#### ❌ Código Incorreto
```javascript
// MÚLTIPLOS PROBLEMAS - NÃO FAÇA ASSIM
async function searchPatient(cpf) {
  // ❌ URL hardcoded
  const url = 'http://sigss.com/buscarPaciente?cpf=' + cpf;
  
  // ❌ Sem validação
  // ❌ Sem tratamento de erro
  // ❌ Headers incorretos
  const response = await fetch(url);
  return await response.json();
}
```

### Considerações de Performance

#### Gerenciamento de Memória
```javascript
// ✅ Use MemoryManager para cleanup automático
const memoryManager = new MemoryManager();

// ✅ Remova listeners quando não precisar
memoryManager.cleanup();

// ✅ Use debouncing para eventos frequentes
let debounceTimeout;
function debouncedFunction() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(actualFunction, 300);
}
```

#### Otimização de Requisições
```javascript
// ✅ Cache de dados quando apropriado
const cache = new Map();

async function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}

// ✅ Abort controllers para cancelar requisições
const controller = new AbortController();
fetch(url, { signal: controller.signal });

// Cancelar se necessário
controller.abort();
```

### Práticas de Segurança

#### Sanitização de Dados
```javascript
// ✅ SEMPRE sanitize dados de entrada
function sanitizeInput(input) {
  return input
    .replace(/[<>]/g, '') // Remove caracteres perigosos
    .trim()
    .substring(0, 100); // Limita tamanho
}

// ✅ Use textContent em vez de innerHTML
element.textContent = sanitizeInput(userInput);

// ❌ NUNCA use innerHTML com dados não sanitizados
element.innerHTML = userInput; // VULNERÁVEL A XSS
```

#### Validação de Origem
```javascript
// ✅ Valide origem de mensagens
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    console.warn("Mensagem de origem não confiável rejeitada");
    return;
  }
  // Processar mensagem...
});
```

---

## 🔧 Scripts e Automação

### Scripts Disponíveis

#### Desenvolvimento
```bash
# CSS com watch mode
npm run dev
npm run build:css:watch

# CSS produção
npm run build:css
```

#### Build e Distribuição
```bash
# Build completo (CSS + ZIPs)
npm run build:all

# Apenas ZIPs
npm run build:zips

# Limpeza
npm run clean
```

#### Validação
```bash
# Validar manifests
npm run validate:manifests
```

#### Release
```bash
# Release automático
npm run release:patch    # 1.0.0 → 1.0.1
npm run release:minor    # 1.0.0 → 1.1.0  
npm run release:major    # 1.0.0 → 2.0.0

# Release manual
npm run release 1.2.3
```

### Quando Usar Cada Script

#### Durante Desenvolvimento
1. **`npm run dev`** - Para desenvolvimento ativo de CSS
2. **`npm run validate:manifests`** - Antes de commits importantes
3. **`npm run build:all`** - Para testar build completo

#### Antes de Release
1. **`npm run clean`** - Limpar arquivos antigos
2. **`npm run build:all`** - Build completo
3. **`npm run validate:manifests`** - Validação final
4. **`npm run release:patch/minor/major`** - Release automatizado

### Fluxo de Build e Deploy

#### Build Local
```bash
# 1. Limpar ambiente
npm run clean

# 2. Build CSS
npm run build:css

# 3. Gerar ZIPs
npm run build:zips

# 4. Validar resultado
npm run validate:manifests
```

#### Deploy Automatizado
```bash
# O script de release faz tudo automaticamente:
npm run release:minor

# Inclui:
# - Atualização de versão nos manifests
# - Build completo
# - Commit e tag Git
# - Push para GitHub
# - Criação de release com assets
```

### Validações Automatizadas

#### Validação de Manifests
- **Estrutura JSON** válida
- **Versão semver** correta
- **Sincronização** entre Firefox e Chrome
- **Campos obrigatórios** presentes

#### Validação de Build
- **Arquivos CSS** compilados corretamente
- **ZIPs** gerados com conteúdo correto
- **Exclusão** de arquivos desnecessários
- **Integridade** dos pacotes

---

## 🐛 Debugging e Troubleshooting

### Ferramentas Específicas do Stack

#### Firefox
```bash
# Abrir console da extensão
about:debugging → Este Firefox → Inspecionar

# Logs do background script
about:debugging → Este Firefox → Inspecionar → Console

# Storage da extensão
about:debugging → Este Firefox → Inspecionar → Storage
```

#### Chrome/Edge
```bash
# Console da extensão
chrome://extensions → Modo desenvolvedor → Inspecionar views

# Background script
chrome://extensions → Detalhes → Inspecionar views: background page

# Storage
chrome://extensions → Detalhes → Inspecionar views → Application → Storage
```

#### Logs da Aplicação
```javascript
// ✅ Use prefixos identificadores
console.log('[Assistente Background]', 'Mensagem');
console.log('[Assistente Content]', 'Mensagem');
console.log('[Assistente Sidebar]', 'Mensagem');

// ✅ Diferentes níveis
console.info('[Info]', 'Informação');
console.warn('[Warning]', 'Aviso');
console.error('[Error]', 'Erro');
```

### Problemas Comuns e Soluções

#### 1. Erro "Manifest inválido"
```bash
# Problema: JSON malformado ou campos obrigatórios ausentes
# Solução:
npm run validate:manifests

# Verificar:
# - Sintaxe JSON válida
# - Versão em formato semver (1.2.3)
# - Campos obrigatórios presentes
```

#### 2. CSS não compilando
```bash
# Problema: Tailwind não gera CSS
# Solução:
npm run build:css

# Verificar:
# - src/input.css existe
# - tailwind.config.js correto
# - Dependências instaladas: npm install
```

#### 3. Extension não carrega
```bash
# Problema: Erro ao carregar extensão
# Soluções:

# 1. Verificar manifest
npm run validate:manifests

# 2. Verificar sintaxe JavaScript
# Use DevTools para identificar erros

# 3. Verificar permissões
# Confirmar que host_permissions estão corretos
```

#### 4. API não responde
```javascript
// Problema: Requisições falham
// Debug:

// 1. Verificar URL
console.log('URL:', url);

// 2. Verificar headers
console.log('Headers:', headers);

// 3. Verificar resposta
console.log('Response:', response.status, response.statusText);

// 4. Verificar CORS
// Confirmar que host_permissions incluem o domínio
```

#### 5. Storage não funciona
```javascript
// Problema: Dados não são salvos/recuperados
// Debug:

// 1. Verificar permissões
// manifest.json deve incluir "storage"

// 2. Verificar API
const api = globalThis.browser || globalThis.chrome;
console.log('API disponível:', !!api.storage);

// 3. Verificar dados
const data = await api.storage.local.get();
console.log('Storage atual:', data);
```

### Logs e Monitoramento

#### Logging Estruturado
```javascript
// ✅ Use estrutura consistente
function logOperation(operation, data, status = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = '[Assistente]';
  
  console[status](`${prefix} ${timestamp} - ${operation}:`, data);
}

// Uso
logOperation('Patient Search', { cpf: '12345678901' });
logOperation('API Error', { error: 'Timeout' }, 'error');
```

#### Monitoramento de Performance
```javascript
// ✅ Medir performance de operações críticas
function measurePerformance(operation, fn) {
  const start = performance.now();
  
  return Promise.resolve(fn()).finally(() => {
    const duration = performance.now() - start;
    console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
  });
}

// Uso
await measurePerformance('Patient Search', () => searchPatient(cpf));
```

---

## 📝 Versionamento e Commits

### Padrão de Commits (Conventional Commits)

#### Formato Obrigatório
```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

#### Tipos Principais
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Formatação, espaços em branco, etc.
- **refactor**: Refatoração de código
- **test**: Adição ou correção de testes
- **chore**: Tarefas de manutenção

#### Escopos Comuns
- **api**: Camada de API e comunicação
- **ui**: Interface do usuário
- **background**: Service Worker
- **content**: Content script
- **validation**: Validações de dados
- **build**: Scripts de build
- **security**: Correções de segurança

#### Exemplos de Commits
```bash
# Nova funcionalidade
git commit -m "feat(api): adicionar busca por CNS no CADSUS"

# Correção de bug
git commit -m "fix(validation): corrigir validação de CPF com dígitos especiais"

# Documentação
git commit -m "docs(readme): atualizar instruções de instalação"

# Refatoração
git commit -m "refactor(ui): centralizar constantes de CSS em variáveis"

# Segurança
git commit -m "fix(security): sanitizar dados de entrada em formulários"

# Build
git commit -m "chore(build): atualizar dependências do Tailwind"
```

### Estratégia de Versionamento

#### Semantic Versioning (SemVer)
```
MAJOR.MINOR.PATCH

Exemplo: 3.3.15
- MAJOR (3): Mudanças incompatíveis
- MINOR (3): Novas funcionalidades compatíveis  
- PATCH (15): Correções de bugs
```

#### Quando Incrementar Cada Nível

##### PATCH (3.3.15 → 3.3.16)
- Correções de bugs
- Melhorias de performance
- Correções de segurança
- Atualizações de documentação

```bash
npm run release:patch
```

##### MINOR (3.3.15 → 3.4.0)
- Novas funcionalidades
- Melhorias na UI
- Novas APIs (compatíveis)
- Novos recursos opcionais

```bash
npm run release:minor
```

##### MAJOR (3.3.15 → 4.0.0)
- Mudanças incompatíveis
- Remoção de funcionalidades
- Mudanças na API pública
- Alterações que quebram compatibilidade

```bash
npm run release:major
```

### Processo de Release

#### Release Automatizado
```bash
# 1. Verificações automáticas
# - Diretório limpo (sem modificações não commitadas)
# - Branch main
# - Commits novos desde última tag

# 2. Atualização de versão
# - Atualiza manifest.json e manifest-edge.json
# - Mantém sincronização entre navegadores

# 3. Build completo
# - CSS compilado
# - ZIPs gerados para distribuição

# 4. Git operations
# - Commit da nova versão
# - Tag da release
# - Push para GitHub

# 5. GitHub Release
# - Criação automática da release
# - Upload dos ZIPs como assets
# - Changelog gerado automaticamente
```

#### Release Manual (se necessário)
```bash
# 1. Atualizar versão manualmente
# Editar manifest.json e manifest-edge.json

# 2. Build
npm run build:all

# 3. Commit
git add .
git commit -m "chore(release): v1.2.3"

# 4. Tag
git tag v1.2.3

# 5. Push
git push origin main --tags

# 6. GitHub Release (manual)
# Criar release no GitHub com os ZIPs
```

### Atualização de CHANGELOG

#### Estrutura do CHANGELOG.md
```markdown
# Changelog - Assistente de Regulação Médica

## [Unreleased]

### Added
- Nova funcionalidade X
- Suporte para Y

### Changed
- Melhoria na funcionalidade Z

### Fixed
- Correção do bug A
- Correção do bug B

### Security
- Correção de vulnerabilidade C

## [3.3.15] - 2025-01-17

### Added
- Sistema centralizado de constantes para API
...
```

#### Categorias Obrigatórias
- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Fixed**: Correções de bugs
- **Removed**: Funcionalidades removidas
- **Security**: Correções de segurança

#### Processo de Atualização
1. **Durante desenvolvimento**: Adicionar entradas em `[Unreleased]`
2. **Durante release**: Script move automaticamente para versão específica
3. **Após release**: Seção `[Unreleased]` fica vazia para próximas mudanças

---

## ✅ Checklist de Qualidade

### Checklist Pré-Commit

#### Código e Funcionalidade
- [ ] **Funcionalidade testada** em Firefox E Chrome/Edge
- [ ] **APIs compatíveis** usando `globalThis.browser || globalThis.chrome`
- [ ] **Constantes centralizadas** usando `api-constants.js`
- [ ] **Validação de dados** médicos implementada
- [ ] **Sanitização** de entrada de dados
- [ ] **Tratamento de erros** adequado
- [ ] **Logging** com prefixos identificadores

#### Build e Validação
- [ ] **`npm run validate:manifests`** passa sem erros
- [ ] **`npm run build:all`** executa com sucesso
- [ ] **Manifests sincronizados** (Firefox e Chrome)
- [ ] **CSS compilado** corretamente
- [ ] **ZIPs gerados** sem erros

#### Documentação
- [ ] **CHANGELOG.md atualizado** na seção `[Unreleased]`
- [ ] **Comentários de código** adequados
- [ ] **JSDoc** para funções públicas (se aplicável)
- [ ] **README.md** atualizado (se necessário)

#### Segurança
- [ ] **Dados sanitizados** antes de exibição
- [ ] **Validação de origem** em mensagens
- [ ] **Sem innerHTML** com dados não sanitizados
- [ ] **Permissões mínimas** no manifest

#### Performance
- [ ] **Memory cleanup** implementado
- [ ] **Event listeners** removidos adequadamente
- [ ] **Debouncing** em eventos frequentes
- [ ] **Cache** implementado onde apropriado

### Critérios de Aceitação

#### Funcionalidade Médica
- ✅ **Dados médicos preservados**: Nenhuma perda de informação crítica
- ✅ **Validações rigorosas**: CNS, CPF, dados CADSUS
- ✅ **Compatibilidade SIGSS**: Funciona com sistema atual
- ✅ **Precisão de dados**: Informações exibidas corretamente

#### Compatibilidade Técnica
- ✅ **Multi-browser**: Firefox, Chrome, Edge
- ✅ **Manifest V3**: Compatível com padrões atuais
- ✅ **Performance**: Responsivo em sistemas lentos
- ✅ **Estabilidade**: Sem vazamentos de memória

#### Experiência do Usuário
- ✅ **Interface intuitiva**: Fácil de usar para médicos
- ✅ **Feedback claro**: Mensagens de erro compreensíveis
- ✅ **Responsividade**: Interface reativa
- ✅ **Acessibilidade**: Suporte a leitores de tela

### Validações Obrigatórias

#### Antes de Cada Commit
```bash
# 1. Validação técnica
npm run validate:manifests

# 2. Build completo
npm run build:all

# 3. Teste manual
# - Carregar extensão no Firefox
# - Carregar extensão no Chrome
# - Testar funcionalidade principal

# 4. Verificação de segurança
# - Revisar uso de innerHTML
# - Verificar sanitização de dados
# - Confirmar validações de entrada
```

#### Antes de Release
```bash
# 1. Todas as validações de commit +

# 2. Teste extensivo
# - Testar todos os fluxos principais
# - Verificar compatibilidade com SIGSS
# - Testar em diferentes resoluções

# 3. Documentação
# - CHANGELOG.md atualizado
# - Versão correta nos manifests
# - README.md atualizado se necessário

# 4. Build final
npm run clean
npm run build:all
```

---

## 🚨 Avisos Críticos e Práticas Proibidas

### ⚠️ NUNCA FAÇA

#### Segurança
- ❌ **NUNCA** use `innerHTML` com dados não sanitizados
- ❌ **NUNCA** execute código JavaScript de origem externa
- ❌ **NUNCA** armazene dados sensíveis em storage local sem criptografia
- ❌ **NUNCA** ignore validação de origem em mensagens

#### Compatibilidade
- ❌ **NUNCA** use apenas `chrome.*` APIs (use `browser.*` com polyfill)
- ❌ **NUNCA** modifique apenas um manifest (sempre sincronizar)
- ❌ **NUNCA** use APIs específicas de um navegador sem fallback

#### Dados Médicos
- ❌ **NUNCA** modifique dados médicos sem validação rigorosa
- ❌ **NUNCA** ignore erros de validação de CNS/CPF
- ❌ **NUNCA** cache dados médicos sensíveis por longos períodos

#### Build e Deploy
- ❌ **NUNCA** edite arquivos em `dist/` ou `dist-zips/` manualmente
- ❌ **NUNCA** faça commit de arquivos gerados
- ❌ **NUNCA** pule validações antes de release

### 🔒 Práticas de Segurança Obrigatórias

#### Sanitização de Dados
```javascript
// ✅ SEMPRE sanitize antes de exibir
function sanitizeForDisplay(text) {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

element.textContent = sanitizeForDisplay(userInput);
```

#### Validação de Entrada
```javascript
// ✅ SEMPRE valide dados médicos
import { validateCNS, validateCPF } from './validation.js';

function processPatientData(data) {
  if (data.cns && !validateCNS(data.cns)) {
    throw new Error('CNS inválido');
  }
  
  if (data.cpf && !validateCPF(data.cpf)) {
    throw new Error('CPF inválido');
  }
  
  return data;
}
```

#### Comunicação Segura
```javascript
// ✅ SEMPRE valide origem
window.addEventListener("message", (event) => {
  // Validar origem
  if (event.origin !== window.location.origin) {
    console.warn("Mensagem rejeitada - origem não confiável");
    return;
  }
  
  // Validar estrutura
  if (!event.data || typeof event.data !== 'object') {
    console.warn("Mensagem rejeitada - formato inválido");
    return;
  }
  
  // Processar mensagem segura
  processMessage(event.data);
});
```

### 🎯 Boas Práticas Obrigatórias

#### Gerenciamento de Recursos
```javascript
// ✅ SEMPRE use MemoryManager
import { MemoryManager } from './MemoryManager.js';

class ComponentManager {
  constructor() {
    this.memoryManager = new MemoryManager();
  }
  
  addEventListeners() {
    // Registra automaticamente para cleanup
    this.memoryManager.addEventListener(element, 'click', this.handleClick);
  }
  
  destroy() {
    // Cleanup automático de todos os recursos
    this.memoryManager.cleanup();
  }
}
```

#### Tratamento de Erros
```javascript
// ✅ SEMPRE trate erros adequadamente
async function fetchPatientData(id) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return processPatientData(data);
    
  } catch (error) {
    console.error('[API Error]', error);
    
    // Notificar usuário de forma amigável
    showUserFriendlyError('Erro ao buscar dados do paciente');
    
    // Re-throw para permitir tratamento upstream
    throw error;
  }
}
```

#### Logging Estruturado
```javascript
// ✅ SEMPRE use logging consistente
function logOperation(component, operation, data, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[Assistente ${component}]`;
  
  console[level](`${prefix} ${timestamp} - ${operation}:`, data);
}

// Uso
logOperation('API', 'Patient Search', { cpf: '***' });
logOperation('Validation', 'CNS Error', { error: 'Invalid format' }, 'error');
```

---

## 📋 Resumo Executivo

### Para Cada Tarefa de IA

#### 1. Preparação (OBRIGATÓRIO)
- ✅ **Ler** este documento completamente
- ✅ **Entender** o contexto médico da aplicação
- ✅ **Verificar** ambiente com `npm run validate:manifests`

#### 2. Análise (OBRIGATÓRIO)
- ✅ **Identificar** componentes afetados
- ✅ **Verificar** dependências em `api-constants.js`
- ✅ **Considerar** impacto em múltiplos navegadores
- ✅ **Avaliar** necessidade de validação médica

#### 3. Implementação (OBRIGATÓRIO)
- ✅ **Usar** constantes centralizadas (`api-constants.js`)
- ✅ **Implementar** compatibilidade cross-browser
- ✅ **Aplicar** sanitização e validação
- ✅ **Seguir** padrões de nomenclatura

#### 4. Validação (OBRIGATÓRIO)
- ✅ **Executar** `npm run build:all`
- ✅ **Testar** em Firefox E Chrome
- ✅ **Verificar** funcionalidades médicas críticas
- ✅ **Confirmar** ausência de vazamentos de memória

#### 5. Documentação (OBRIGATÓRIO)
- ✅ **Atualizar** `CHANGELOG.md` na seção `[Unreleased]`
- ✅ **Documentar** mudanças significativas
- ✅ **Usar** Conventional Commits
- ✅ **Versionar** se necessário

### Comandos Essenciais

#### Desenvolvimento Diário
```bash
# Verificar ambiente
npm run validate:manifests

# Desenvolvimento CSS
npm run dev

# Build completo
npm run build:all
```

#### Antes de Commit
```bash
# Validação completa
npm run validate:manifests
npm run build:all

# Commit com padrão
git add .
git commit -m "feat(scope): descrição da mudança"
```

#### Release
```bash
# Release automático
npm run release:patch  # ou minor/major

# Ou manual
npm run release 1.2.3
```

### Arquivos Críticos para Monitorar

#### Sempre Sincronizar
- `manifest.json` ↔ `manifest-edge.json`
- Versões devem ser idênticas

#### Nunca Editar Diretamente
- `dist/` - Arquivos gerados
- `dist-zips/` - Pacotes de distribuição

#### Sempre Usar
- `api-constants.js` - Para URLs e parâmetros
- `validation.js` - Para dados médicos
- `MemoryManager.js` - Para recursos

### Checklist Rápido

#### ✅ Antes de Cada Mudança
- [ ] Li e entendi o contexto médico
- [ ] Identifiquei componentes afetados
- [ ] Verifiquei dependências

#### ✅ Durante Implementação
- [ ] Usei constantes centralizadas
- [ ] Implementei compatibilidade cross-browser
- [ ] Apliquei sanitização adequada
- [ ] Segui padrões de nomenclatura

#### ✅ Antes de Commit
- [ ] `npm run validate:manifests` passou
- [ ] `npm run build:all` executou com sucesso
- [ ] Testei em múltiplos navegadores
- [ ] Atualizei CHANGELOG.md
- [ ] Usei Conventional Commits

---

## 🎯 Considerações Finais

### Responsabilidade Médica
Este projeto lida com **dados médicos críticos**. Cada linha de código pode impactar diretamente o atendimento a pacientes. Sempre priorize:

1. **Precisão dos dados** médicos
2. **Segurança** das informações
3. **Confiabilidade** do sistema
4. **Usabilidade** para profissionais de saúde

### Evolução Contínua
A extensão está em constante evolução para atender melhor os médicos reguladores. Mantenha-se atualizado com:

- **Mudanças no SIGSS** (sistema governamental)
- **Atualizações de navegadores** (Manifest V3)
- **Feedback dos usuários** médicos
- **Regulamentações** de saúde

### Suporte e Comunidade
Para dúvidas ou problemas:

1. **Consulte** este documento primeiro
2. **Verifique** issues no GitHub
3. **Teste** em ambiente local
4. **Documente** soluções encontradas

---

**Este documento é a fonte única da verdade para desenvolvimento neste projeto. Consulte-o sempre antes de fazer modificações.**

**Última atualização:** 2025-01-23 - Versão 1.0.0