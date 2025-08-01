# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]


### 🛠️ Refactor & Linting

#### Fixed
- Correção de todos os erros de lint (ESLint, StyleLint)
- Padronização de aspas simples em todo o código
- Remoção de variáveis não utilizadas
- Refatoração de todos os diálogos (alert/confirm) para modais customizados (`Utils.showDialog`)
- Substituição de `window.location.reload` e `window.open` por APIs seguras de extensão (`browser.runtime.reload`, `browser.tabs.create`)
- Correção de race condition no feedback de UI do botão de copiar para área de transferência

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
