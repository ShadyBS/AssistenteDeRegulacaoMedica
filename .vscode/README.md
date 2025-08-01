# 🛠️ Configuração VS Code - Assistente de Regulação Médica

## ✅ Configuração Completa

Todas as configurações do VS Code foram implementadas com sucesso! O ambiente está otimizado para desenvolvimento de extensões de navegador com compliance médico.

## 📁 Arquivos Criados

### Configurações Principais
- ✅ `.vscode/settings.json` - Configurações do workspace
- ✅ `.vscode/tasks.json` - Tasks automatizadas (18 tasks)
- ✅ `.vscode/launch.json` - Configurações de debug
- ✅ `.vscode/extensions.json` - Extensões recomendadas (40+)
- ✅ `.vscode/javascript.code-snippets` - Snippets personalizados
- ✅ `.vscode/keybindings.json` - Atalhos de teclado
- ✅ `AssistenteDeRegulacao.code-workspace` - Workspace file

## 🚀 Como Usar

### 1. Abrir o Workspace
```
File > Open Workspace from File > AssistenteDeRegulacao.code-workspace
```

### 2. Instalar Extensões Recomendadas
```
Ctrl+Shift+P > Extensions: Show Recommended Extensions
```
Clique em "Install All" para instalar todas as extensões recomendadas.

### 3. Atalhos Principais

#### 🏗️ Build & Development
- `Ctrl+Shift+B`: Iniciar desenvolvimento com hot reload
- `Ctrl+Alt+B`: Build para todos os browsers
- `Ctrl+Shift+P Ctrl+Shift+B`: Build apenas CSS

#### 🧪 Testing
- `Ctrl+Shift+T`: Executar todos os testes
- `Ctrl+Alt+T`: Testes unitários apenas
- `Ctrl+Shift+W`: Modo watch (re-executa ao salvar)
- `Ctrl+Shift+C`: Relatório de cobertura

#### 🔍 Validation & Linting
- `Ctrl+Shift+V`: Validação completa
- `Ctrl+Shift+L`: Corrigir problemas de lint automaticamente

#### 🔒 Security & Medical
- `Ctrl+Shift+S Ctrl+Shift+C`: Scan de segurança
- `Ctrl+Shift+M Ctrl+Shift+C`: Verificação de compliance médico

#### 📦 Package & Release
- `Ctrl+Shift+P Ctrl+Shift+A`: Package para todas as stores
- `Ctrl+Shift+R Ctrl+Shift+P`: Release patch
- `Ctrl+Shift+R Ctrl+Shift+M`: Release minor

### 4. Debug Configurations

#### 🌐 Chrome Extension Debug
- **F5**: Inicia debug no Chrome
- Automaticamente carrega a extensão e abre Chrome DevTools
- Breakpoints funcionam nos arquivos JavaScript

#### 🧪 Jest Tests Debug
- Selecione "Jest Tests" no Debug panel
- Debug individual de arquivos de teste
- Suporte completo a breakpoints

#### 🔧 Build Scripts Debug
- Debug dos scripts de build personalizados
- Útil para troubleshooting do pipeline

### 5. Tasks Disponíveis (Ctrl+Shift+P > Tasks: Run Task)

#### 🚀 Development
- **🚀 Dev: Start Development** - Desenvolvimento com hot reload
- **🏗️ Build: All Browsers** - Build completo
- **🎨 Build: CSS Only** - Apenas TailwindCSS

#### 🧪 Testing
- **🧪 Test: All Tests** - Todos os testes
- **🧪 Test: Unit Only** - Apenas unitários
- **🧪 Test: Watch Mode** - Modo watch
- **📊 Test: Coverage Report** - Relatório de cobertura

#### 🔍 Quality Assurance
- **🔍 Validate: Complete** - Validação completa
- **🔧 Lint: Fix All** - Corrigir lint
- **🔒 Security: Scan** - Scan de segurança
- **🏥 Medical: Compliance Check** - Compliance médico

#### 📦 Release
- **📦 Package: All Stores** - Package para stores
- **🚀 Release: Patch** - Release patch
- **🚀 Release: Minor** - Release minor
- **🧹 Clean: All** - Limpeza completa

### 6. Code Snippets Personalizados

#### `content-script` - Content Script Template
```javascript
// Gera template completo para content script com compliance médico
```

#### `background-script` - Background Script Template  
```javascript
// Gera template para service worker com segurança médica
```

#### `medical-api` - Medical API Call Template
```javascript
// Template para chamadas API seguras com sanitização
```

#### `jest-extension-test` - Jest Test Template
```javascript
// Template de teste Jest com mocks médicos
```

### 7. Navegação Rápida

#### Arquivos Principais
- `Ctrl+Shift+M`: manifest.json
- `Ctrl+Shift+S Ctrl+Shift+J`: sidebar.js
- `Ctrl+Shift+C Ctrl+Shift+J`: content-script.js
- `Ctrl+Shift+B Ctrl+Shift+J`: background.js

#### Busca Específica
- `Ctrl+Shift+F Ctrl+Shift+M`: Buscar comentários médicos (🏥)
- `Ctrl+Shift+F Ctrl+Shift+S`: Buscar comentários de segurança (🔒)

## 🔧 Extensões Recomendadas

### Essenciais
- **ESLint** - Linting JavaScript
- **Prettier** - Formatação de código
- **TailwindCSS IntelliSense** - Autocomplete CSS
- **Firefox Debugger** - Debug Firefox extensions
- **Chrome Debugger** - Debug Chrome extensions

### Testing
- **Jest** - Suporte a Jest testing
- **Coverage Gutters** - Visualização de cobertura
- **Test Explorer** - Interface unificada de testes

### Medical Development
- **YAML** - Configurações médicas
- **Hex Editor** - Inspeção de dados binários
- **Security Scanner** - Scan de vulnerabilidades

### Productivity
- **GitHub Copilot** - AI coding assistant
- **Todo Tree** - Rastreamento de TODOs
- **Bookmarks** - Navegação rápida
- **Portuguese Spell Checker** - Correção ortográfica

## 🏥 Compliance Médico

### Configurações de Segurança
- **Exclusão automática** de dados sensíveis dos logs
- **Sanitização** automática em snippets
- **Validação** de compliance GDPR/LGPD
- **Proteção** contra exposure de CPF/RG

### Medical Data Protection
- Nunca commitar dados reais de pacientes
- Sempre usar mocks em desenvolvimento
- Logs sanitizados automaticamente
- Validação de segurança em CI/CD

## 🔧 Troubleshooting

### Tasks não aparecem?
1. Reabrir VS Code
2. Verificar se workspace está aberto
3. Ctrl+Shift+P > "Reload Window"

### Debug não funciona?
1. Verificar se extensão Chrome/Firefox está instalada
2. Executar build primeiro (Ctrl+Alt+B)
3. Verificar se Chrome está instalado

### IntelliSense não funciona?
1. Instalar extensões recomendadas
2. Ctrl+Shift+P > "TypeScript: Reload Projects"
3. Verificar se node_modules existe

### Performance lenta?
1. Excluir node_modules da indexação (já configurado)
2. Excluir dist/ e coverage/ (já configurado)
3. Usar "files.watcherExclude" (já configurado)

## 📋 Validação

Execute o script de validação para verificar se tudo está funcionando:

```bash
# Windows
./scripts/utils/validate-vscode-setup.bat

# Linux/Mac
bash scripts/utils/validate-vscode-setup.sh
```

## ✅ Próximos Passos

1. **Abrir Workspace**: `AssistenteDeRegulacao.code-workspace`
2. **Instalar Extensões**: Seguir recomendações
3. **Executar Dev**: `Ctrl+Shift+B`
4. **Testar Debug**: `F5`
5. **Executar Testes**: `Ctrl+Shift+T`

---

🏥 **Configuração otimizada para desenvolvimento médico seguro!**
🚀 **Pronto para desenvolvimento profissional de extensões!**
