# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### ✨ Added

- **🔧 automation**: implementa solução completa para fluxo obrigatório agents.md
- **🔧 automation**: implementa automação completa do fluxo agents.md
- **🔧 SelectGroup Filter Support**: Implementado suporte completo para filtros tipo `selectGroup` nas seções de agendamentos e regulação

  - **Visual Consistency**: Filtros `selectGroup` agora possuem contorno visual idêntico aos elementos `select` tradicionais
  - **Renderização Radio Buttons**: `selectGroup` renderizado como radio buttons com aparência de combobox
  - **Event Handling**: Suporte completo para eventos de mudança em radio buttons
  - **Filter Persistence**: Salvamento e carregamento de estados para filtros `selectGroup`
  - **Clear Filters**: Reset correto para valor padrão em filtros do tipo `selectGroup`
  - **Cross-browser Compatibility**: Funcionalidade testada em Chrome, Firefox e Edge

### 🛠️ Changed

- **SectionManager**: Refatorado `createFilterElement()` para suportar tipo `selectGroup`
- **Filter Values**: Melhorado `getFilterValues()` para capturar corretamente valores de radio buttons
- **Event Listeners**: Atualizado `onSectionChange()` para detectar mudanças em `input[type='radio']`

### 🐞 Fixed

- **Filter Rendering**: Corrigido problema onde filtros `selectGroup` não eram renderizados
- **Visual Border**: Adicionado contorno ausente em filtros tipo combobox nas seções agendamentos e regulação
- **Filter State**: Corrigido problema de captura de valores em filtros `selectGroup`

### ✨ Added

- **🏗️ Store Pattern Refactoring (TASK-M-001)**: Refatoração completa do sistema de store para melhor gerenciamento de memória

  - **Memory Management**: Implementação de WeakMap para listeners registry, auto-cleanup de listeners órfãos e controle de tamanho de estado
  - **Debug Tools**: Modo debug habilitável/desabilitável, tracking de uso de memória e estatísticas detalhadas de store
  - **Medical Flow Preservation**: Sistema que preserva o fluxo médico de "nova análise = filtros resetados para padrão do usuário"
  - **Smart Persistence**: Persistência médica consciente que distingue dados seguros vs sensíveis (CPF, CNS nunca persistem)
  - **Performance Optimization**: 1000+ listeners processados em <100ms, cleanup automático a cada 100 notificações
  - **Test Suite**: 39 testes passando em 4 suítes (memory, medical-flow, persistence, performance)
  - **Backward Compatibility**: 100% dos métodos existentes preservados, zero breaking changes
  - **Medical Compliance**: LGPD/HIPAA compliance com sanitização automática de dados sensíveis

- **🔄 KeepAliveManager Service Worker Migration (TASK-C-004)**: Migração completa para compatibilidade com service workers

  - **Hybrid Architecture**: Implementação dual que detecta automaticamente o ambiente (service worker vs background script)
  - **Chrome/Edge**: Utiliza Alarms API para manter sessões ativas em service workers
  - **Firefox**: Mantém setInterval em background scripts tradicionais
  - **Zero Breaking Changes**: Funcionalidade médica preservada com fallback automático
  - **Cross-browser Compatibility**: Teste em Chrome, Firefox e Edge com arquiteturas específicas
  - **Medical Compliance**: Sessões SIGSS mantidas ativas para reguladores médicos

- **🔧 Manifest V3 Service Worker Migration (TASK-A-005)**: Migração completa para service workers compatíveis

  - **Chrome/Edge**: Restaurado `"type": "module"` necessário para ES6 imports em service workers
  - **Firefox**: Migrado de `"scripts"` para `"service_worker"` para conformidade Manifest V3
  - **Cross-browser consistency**: Configuração otimizada para cada navegador
  - **Build moderno**: Uso do sistema webpack moderno via `npm run package:all`
  - **Validação completa**: Manifests, segurança e performance validados
  - **Zero breaking changes**: Funcionalidades médicas preservadas

- **🛡️ Security Validation Framework**: Implementado sistema completo de validação de mensagens (TASK-C-003)

  - **URLConfigurationManager**: Validação dinâmica de domínios SIGSS baseada em URL configurada
  - **MessageRateLimiter**: Rate limiting de 5 mensagens/segundo por aba para prevenir ataques DoS
  - **PayloadValidator**: Validação estrutural de dados de regulação médica
  - **MessageQueue**: Sistema de fila para cenários de instalação e inicialização
  - **6-Step Validation Pipeline**: Validação completa de origem, rate limiting, payload e configuração
  - **Validação 100% aprovada**: 25/25 validações passaram no script de validação automática
  - **Testes unitários**: Jest configurado com Babel para suporte ES6 modules
  - **Compliance médico**: Logging seguro com sanitização automática de dados sensíveis

- **📋 Manifest Chrome Principal**: Criado `manifest.json` como manifest principal para Chrome/desenvolvimento, resolvendo erro de build do webpack
  - **Estrutura cross-browser completa**: `manifest.json` (Chrome), `manifest-edge.json` (Edge), `manifest-firefox.json` (Firefox)
  - **Scripts sincronizados**: Todos os scripts de build, packaging, validation e version-bump agora usam os manifestos corretos
  - **Pipeline atualizada**: GitHub Actions CD/CI configurada para atualizar todos os 3 manifestos simultaneamente
  - **Build funcionando**: `npm run build:all` executando com sucesso para todos os navegadores

### 🛠️ Changed

- **🌐 Browser API Standardization (TASK-M-003)**: Padronização completa das APIs cross-browser

  - **Padrão unificado**: Implementado `const api = typeof browser !== 'undefined' ? browser : chrome;` em todos os arquivos
  - **content-script.js**: Migrado de `const api = browser;` para padrão fallback
  - **options.js**: Migrado de `const api = window.browser || window.chrome;` para padrão fallback
  - **ErrorHandler.js**: Substituído uso direto de `chrome.runtime` por wrapper padronizado (2 localizações)
  - **Compatibilidade máxima**: Chrome, Firefox e Edge usando mesmo padrão de detecção de API
  - **Zero breaking changes**: Funcionalidades médicas preservadas com melhor estabilidade cross-browser

- **Scripts de release corrigidos**: `package-chrome.js` agora usa `manifest.json` em vez de `manifest-edge.json`
- **Validação atualizada**: `validate-manifest.js` e `validate-security.js` usam `manifest.json` como arquivo principal
- **Version bump melhorado**: `version-bump.js` atualiza todos os 3 manifestos (Chrome, Edge, Firefox) simultaneamente
- **Build universal corrigido**: `build-universal.js` usa manifestos específicos para cada navegador

### 🐞 Fixed

- **ERROR webpack**: Resolvido erro "unable to locate 'manifest.json' glob" no build do Chrome
- **Inconsistência de manifestos**: Todos os scripts agora referenciam os arquivos de manifest corretos para cada navegador
- **Pipeline CD**: GitHub Actions workflow atualizado para incluir `manifest-firefox.json` no processo de release

### 📋 TASK-A-001 Analysis

- **📋 TASK-A-001 Analysis**: Criado documento completo de análise e planejamento para TASK-A-001, confirmando que a task é OBSOLETA devido às implementações das TASK-M-005 e TASK-C-001
  - **Status confirmado**: Content script já migrado para ErrorHandler com sanitização completa
  - **Compliance verificado**: Zero exposição de dados médicos em logs do content script
  - **Validação completa**: Testes de segurança e compliance passando 100%
  - **Documentação detalhada**: Guia completo para agentes AI futuros sobre o status da implementação
- **🏥 TASK-C-001 - Migração Completa para Logging Centralizado**: Implementada migração 100% dos console logs para sistema ErrorHandler centralizado
  - **Eliminação CRÍTICA de violação LGPD**: Removida exposição completa de dados médicos em `sidebar.js` linha 665
  - **Sanitização de dados sensíveis**: IDs de regulação e dados de sessão em `api.js` linhas 131 e 1151 sanitizados
  - **30 console logs migrados** para ErrorHandler com categorização médica específica
  - **6 arquivos core migrados**: sidebar.js, api.js, utils.js, store.js, TimelineManager.js, SectionManager.js
  - **Compliance garantido**: 100% LGPD/HIPAA/CFM em conformidade com zero exposição de dados médicos
  - **Debugging estruturado**: Sistema de categorização médica preserva informações técnicas úteis
  - **Cross-browser compatibility**: ES6 modules funcionando em Chrome, Firefox, Edge (Extension Pages, Background, Content Scripts)
  - **Backups organizados**: Criada estrutura `.backup/task-c-001/` com documentação completa
- **🏥 ErrorHandler - Sistema de Logging Médico Centralizado**: Implementado sistema completo de logging com sanitização automática de dados médicos para compliance LGPD/HIPAA
  - Sanitização automática de campos sensíveis (CPF, CNS, nomes, endereços)
  - Preservação de IDs técnicos necessários para debugging (reguId, isenPK, etc.)
  - Categorização específica para ambiente médico (SIGSS_API, MEDICAL_DATA, SECURITY, etc.)
  - Performance tracking para operações críticas
  - Storage rotativo de errors críticos para auditoria
  - Observer pattern para monitoring adicional
  - Global error handling com detecção de CSP violations
  - Cross-browser compatibility com fallbacks seguros
- Integração completa do ErrorHandler em `api.js`, `background.js` e `content-script.js`
- Testes unitários completos para validação de compliance médico
- Adicionada liberação automática de locks de regulação após buscar detalhes, prevenindo bloqueios de registro no SIGSS
- **📦 Build System Otimizado**: Migração para build direto sem webpack para packages menores
  - Redução de tamanho de ~1.5MB para ~94KB por package
  - Scripts de package específicos por navegador (`package-chrome.js`, `package-firefox.js`, `package-edge.js`)
  - Integração automática de compilação TailwindCSS no processo de build
  - Sistema de archiver com compressão máxima (level 9)

### 🛠️ Refactor & Architecture

- **🔄 Manifest V3 Cross-Browser Compliance**: Padronização completa para Manifest V3 em todos navegadores
  - **Chrome/Edge**: `manifest-edge.json` com `service_worker` padrão V3
  - **Firefox**: `manifest-firefox.json` com especificidades V3 Firefox (scripts array, CSP objeto, gecko settings)
  - Correção de inconsistências entre navegadores com manifests específicos
- **🗂️ Manifest Management**: Remoção completa do `manifest.json` legado
  - Atualização de todos scripts para usar manifests específicos
  - Correção de `scripts/validation/validate-security.js` → `manifest-edge.json`
  - Correção de `scripts/validation/validate-manifest.js` → `manifest-edge.json`
  - Correção de `scripts/utils/version-bump.js` → atualiza ambos manifests
  - Correção de `scripts/release/package-firefox.js` → `manifest-firefox.json`
  - Correção de `build-release.bat` → manifestos corretos
  - Correção de `release.js` → lista atualizada de arquivos
- **📋 Cross-browser Manifest V3 Specifications**:
  - Chrome/Edge: `service_worker`, CSP string, permissions padrão
  - Firefox: `scripts` array, CSP objeto, `browser_specific_settings` obrigatório
  - Manutenção de funcionalidade idêntica com sintaxes específicas

### 🐞 Fixed

- Corrigido vazamento de memória (memory leak) em `sidebar.js` ao garantir que todos os event listeners globais sejam removidos quando a sidebar é fechada ou recarregada
- Corrigido erro `ReferenceError: browser is not defined` em `sidebar.js` e `options.js` usando alias cross-browser (`const api = window.browser || window.chrome`)
- **🔧 Build Pipeline Issues**: Resolução completa de problemas de build e packaging
  - Correção de `browser-polyfill.js` ausente nos packages
  - Remoção de chave inválida `minimum_edge_version` do manifest Edge
  - Correção de builds webpack oversized vs direct file copying
  - Resolução de incompatibilidades de manifest entre navegadores
- **🦊 Firefox Extension Loading**: Correção de erros de carregamento no Firefox
  - Manifest V3 Firefox com especificidades corretas
  - CSP em formato objeto para extension_pages
  - Background scripts array mantido (não service_worker)
  - Browser-specific settings com gecko ID obrigatório

### 🎯 Performance & Security

- **⚡ Package Size Optimization**: Redução drástica de tamanho dos packages
  - Chrome: 94,26 KB (era ~1.5MB)
  - Edge: 94,26 KB (era ~1.5MB)
  - Firefox: 94,25 KB (era ~1.5MB)
- **🛡️ Security Compliance**: Validações médicas implementadas
  - Scripts de validação usando manifests corretos
  - Checksums de arquivos críticos atualizados
  - Manifest V3 compliance em todos navegadores

### 🔧 Developer Experience

- **📝 Documentation Updates**: Criação de documentação detalhada
  - `MANIFEST_CORRECTION_SUMMARY.md` - Especificidades de cada navegador
  - `FIREFOX_V3_CLARIFICATION.md` - Esclarecimentos sobre Firefox V3
  - `MANIFEST_REMOVAL_SUMMARY.md` - Processo de limpeza completo
- **🚀 Build Commands**: Scripts npm otimizados
  - `npm run package:all` - Build completo otimizado
  - `npm run package:chrome` - Package Chrome específico
  - `npm run package:firefox` - Package Firefox específico
  - `npm run package:edge` - Package Edge específico

### 🛠️ Refactor & Linting

### 🐞 Fixed

- Corrigido vazamento de memória (memory leak) em `sidebar.js` ao garantir que todos os event listeners globais sejam removidos quando a sidebar é fechada ou recarregada.
- Corrigido erro `ReferenceError: browser is not defined` em `sidebar.js` e `options.js` usando alias cross-browser (`const api = window.browser || window.chrome`).
- Garantido uso do `browser-polyfill.js` para compatibilidade Edge/Chrome/Firefox.
- Ajustado todos os botões de recarregar assistente na sidebar para usar `window.location.reload()` ao invés de `api.runtime.reload()`, evitando fechamento da sidebar e melhorando UX.
- Modal de confirmação de recarregamento agora recarrega apenas a sidebar, não fecha a UI.
- Garantido que todas as ações de reload e configuração funcionam de forma idêntica em todos os browsers suportados.

#### Fixed

- Correção de todos os erros de lint (ESLint, StyleLint)
- Padronização de aspas simples em todo o código
- Remoção de variáveis não utilizadas
- Refatoração de todos os diálogos (alert/confirm) para modais customizados (`Utils.showDialog`)
- Substituição de `window.location.reload` e `window.open` por APIs seguras de extensão (`browser.runtime.reload`, `browser.tabs.create`)
- Correção de race condition no feedback de UI do botão de copiar para área de transferência

### 🔧 DevOps

#### Added

- Configuração de Prettier para formatação de código consistente
- Scripts de automação para formatação e linting (`npm run format`, `npm run format:check`)
- Integração de Husky para verificações pré-commit e pré-push
- Script de health-check para validação completa do projeto (`npm run health-check`)
- Tarefas VS Code para facilitar formatação e verificação de código

#### Changed

- Garantia de uso de ES6 modules e padrões de projeto
- Adequação total ao Manifest V3 e CSP
- Melhoria da compatibilidade cross-browser (Chrome/Firefox/Edge)
- Garantia de não exposição de dados médicos sensíveis em logs ou UI

---

### 🎉 Major: Pipeline CI/CD Completo

#### Added

- **Pipeline CI/CD Completo**: Sistema de integração e deploy contínuo

  - GitHub Actions workflows para CI, CD e security scan
  - Validação automatizada de manifests e segurança
  - Build multi-browser (Chrome, Firefox, Edge)
  - Packaging automatizado para web stores
  - Upload automatizado para Chrome Web Store e Firefox AMO

- **Sistema de Build Avançado**:

  - Webpack configurations específicas por browser
  - Build otimizado para produção com minificação
  - Hot reload para desenvolvimento
  - Source maps para debugging
  - Bundle analysis e performance monitoring

- **Automação de Release**:

  - Scripts de packaging para Chrome (.zip), Firefox (.xpi) e Edge (.zip)
  - Validação de compliance para cada web store
  - Upload automatizado com retry logic
  - Geração automática de changelog e versioning

- **Quality Assurance**:

  - ESLint, StyleLint e HTMLHint configurados
  - Jest para testes unitários e integração
  - Playwright para testes E2E
  - Coverage reporting com threshold de 80%
  - Security scanning com Snyk e CodeQL

- **Compliance Médico Avançado**:

  - Validação GDPR/LGPD automática
  - Sanitização de logs médicos
  - Verificação de não persistência de dados sensíveis
  - Auditoria de permissões e CSP
  - Validação de políticas de privacidade

- **Developer Experience**:
  - 50+ npm scripts para automação completa
  - VS Code tasks configuradas
  - GitHub issue e PR templates
  - Dependabot para updates automáticos
  - Documentation auto-generation

#### Scripts Adicionados

```bash
# Build & Development
npm run build:all           # Build completo multi-browser
npm run build:chrome        # Build específico Chrome
npm run build:firefox       # Build específico Firefox
npm run build:edge          # Build específico Edge
npm run dev                 # Desenvolvimento com hot reload

# Validation & Quality
npm run validate            # Validação completa
npm run validate:manifest   # Validar manifests
npm run validate:security   # Validar segurança
npm run validate:performance # Validar performance

npm run lint                # Linting completo
npm run lint:js             # ESLint JavaScript
npm run lint:css            # StyleLint CSS
npm run lint:html           # HTMLHint HTML
npm run lint:fix            # Auto-fix issues

# Testing
npm run test                # Todos os testes
npm run test:unit           # Testes unitários
npm run test:integration    # Testes integração
npm run test:e2e            # Testes end-to-end
npm run test:cross-browser  # Testes cross-browser
npm run test:coverage       # Coverage report

# Packaging & Release
npm run package             # Gerar packages
npm run package:chrome      # Package Chrome
npm run package:firefox     # Package Firefox
npm run package:edge        # Package Edge

npm run release             # Release completo
npm run release:patch       # Release patch
npm run release:minor       # Release minor
npm run release:major       # Release major

# Security & Compliance
npm run security:scan       # Scan vulnerabilidades
npm run security:audit      # Audit dependências
npm run compliance:medical  # Validar compliance médico

# Utilities
npm run clean               # Limpeza arquivos
npm run version:bump        # Bump versão
npm run changelog           # Gerar changelog
npm run docs:generate       # Gerar documentação
```

#### GitHub Actions Workflows

- **CI Pipeline**: Validação, testes, build e packaging automático
- **CD Pipeline**: Deploy automático para web stores em releases
- **Security Scan**: Análise diária de vulnerabilidades
- **Dependabot**: Updates automáticos de dependências

#### Configurações Criadas

- `config/webpack/` - Configurações Webpack por browser
- `config/eslint/` - Configurações ESLint modulares
- `config/jest/` - Setup de testes com mocks médicos
- `config/stores/` - Configurações para web stores
- `scripts/` - Scripts de automação organizados por categoria
- `.github/` - Templates e workflows GitHub

#### Medical Compliance Features

- **Data Sanitization**: Logs automaticamente sanitizados
- **GDPR/LGPD Validation**: Verificação automática de compliance
- **Medical Data Protection**: Não persistência de dados sensíveis
- **Audit Trail**: Rastreamento de acessos e modificações
- **Privacy by Design**: Configurações seguras por padrão

#### Developer Tools

- **Hot Reload**: Recarregamento automático durante desenvolvimento
- **Source Maps**: Debugging facilitado
- **Lint on Save**: Correção automática de código
- **Test Coverage**: Relatórios de cobertura detalhados
- **Bundle Analysis**: Análise de tamanho e performance

### Changed

- **README.md**: Completamente reescrito com instruções detalhadas do pipeline
- **package.json**: Reestruturado com 50+ scripts organizados
- **Estrutura do projeto**: Organização melhorada com separação por categoria

### Security

- **Manifest V3**: Atualização para máxima segurança
- **CSP rigoroso**: Content Security Policy sem unsafe-eval
- **Permission audit**: Validação automática de permissões
- **Dependency scanning**: Verificação contínua de vulnerabilidades
- **Code analysis**: Análise estática de segurança

### Medical Compliance

- **HIPAA Awareness**: Configurações compatíveis com HIPAA
- **GDPR/LGPD Compliance**: Totalmente conforme com regulamentações
- **Data Minimization**: Coleta mínima de dados necessários
- **Encryption**: Comunicação HTTPS obrigatória
- **Audit Logs**: Rastreamento seguro de atividades

## [3.3.7] - 2024-01-XX

### Added

- Estrutura base da extensão
- Integração com sistema SIGSS
- Busca de pacientes no CADSUS
- Timeline médica
- Sidebar integrada
- Filtros personalizáveis

### Features

- Busca automática e manual de pacientes
- Comparação de dados com CADSUS
- Gerenciador de automações
- Exportação/importação de configurações
- Compatibilidade Chrome, Firefox e Edge

### Security

- Manifest V3 implementation
- Secure CSP configuration
- Medical data protection
- Session-only storage

---

## Versioning Guidelines

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (1.X.0): Funcionalidades novas compatíveis
- **PATCH** (1.1.X): Correções de bugs compatíveis

### Tipos de Mudanças

- **Added** para novas funcionalidades
- **Changed** para mudanças em funcionalidades existentes
- **Deprecated** para funcionalidades que serão removidas
- **Removed** para funcionalidades removidas
- **Fixed** para correções de bugs
- **Security** para vulnerabilidades de segurança
- **Medical Compliance** para mudanças relacionadas a compliance médico

### Medical Extension Specific

- **Medical Data Protection**: Mudanças na proteção de dados médicos
- **GDPR/LGPD Compliance**: Atualizações de conformidade regulatória
- **Healthcare Integration**: Melhorias na integração com sistemas de saúde
- **Privacy Enhancement**: Melhorias na privacidade do paciente

---

## Contributing

Ao contribuir para este changelog:

1. Mantenha o formato [Keep a Changelog](https://keepachangelog.com/)
2. Adicione mudanças em **[Unreleased]**
3. Use emojis para categorizar: 🎉 Major, ⚡ Minor, 🐛 Patch
4. Priorize compliance médico e segurança
5. Documente impactos na privacidade de dados
6. Inclua instruções de migração se necessário

Para mais informações, veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Legal & Compliance

**⚠️ Aviso Médico**: Esta extensão é uma ferramenta auxiliar para profissionais de saúde. Não substitui o julgamento clínico.

**🔒 Privacidade**: Conformidade total com GDPR/LGPD. Nenhum dado pessoal é armazenado permanentemente.

**📋 Licença**: MIT License - veja [LICENSE](LICENSE) para detalhes.
