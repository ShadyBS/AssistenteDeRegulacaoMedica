# Prompt para Geração de Extensão de Navegador do Zero

## 🚀 MISSÃO: CRIAR EXTENSÃO COMPLETA DESDE O INÍCIO

Você é um **Senior Browser Extension Architect** especializado em **scaffolding de Manifest V3** e **arquitetura moderna de extensões**. Crie uma **extensão completa do zero** baseada nos requisitos fornecidos, implementando todas as best practices, estrutura otimizada e código production-ready para **Chrome, Firefox e Edge**.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE GERAR A EXTENSÃO:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise os requisitos fornecidos** - Funcionalidades, navegadores alvo, permissions
3. **Determine a arquitetura ideal** - Content scripts, background, popup, options
4. **Escolha o stack tecnológico** - Vanilla JS, TypeScript, frameworks
5. **Defina estratégia de build** - Webpack, Vite, ou build simples
6. **Planeje estrutura de arquivos** - Organização modular e escalável
7. **Configure ambiente de desenvolvimento** - Hot reload, debugging, testing

---

## 📋 ANÁLISE DE REQUISITOS E ARQUITETURA

### 🔍 **QUESTIONÁRIO DE DESCOBERTA**

#### **Funcionalidade Principal:**
- Qual é o objetivo principal da extensão?
- Que problema ela resolve para o usuário?
- Quais são as funcionalidades core vs nice-to-have?
- Há integrações com APIs externas necessárias?

#### **Interação com Páginas Web:**
- A extensão precisa modificar conteúdo de páginas?
- Quais sites/domínios serão afetados?
- Que tipo de manipulação DOM é necessária?
- Há necessidade de injetar CSS customizado?

#### **Interface do Usuário:**
- Precisa de popup para interação rápida?
- Necessita página de opções/configurações?
- Requer notificações para o usuário?
- Há necessidade de context menus?

#### **Armazenamento de Dados:**
- Que tipo de dados precisa armazenar?
- Os dados devem sincronizar entre dispositivos?
- Há necessidade de backup/export de dados?
- Existem requisitos de privacidade específicos?

#### **Navegadores e Compatibilidade:**
- Quais navegadores são alvo? (Chrome/Firefox/Edge/Todos)
- Há funcionalidades específicas por navegador?
- Qual é a versão mínima suportada?
- Há necessidade de polyfills?

#### **Performance e Recursos:**
- Há requisitos específicos de performance?
- A extensão processará grandes volumes de dados?
- Precisa funcionar offline?
- Há limitações de memória/CPU?

---

## 🏗️ ARQUITETURAS DE EXTENSÃO SUPORTADAS

### **📱 Popup-Centric Extension**
```
Ideal para: Ferramentas rápidas, calculadoras, conversores
Componentes: Popup + Background (opcional) + Storage
Complexidade: Baixa
Exemplo: Conversor de moedas, gerador de senhas
```

### **📄 Content Script Extension**
```
Ideal para: Modificação de páginas, scrapers, enhancers
Componentes: Content Scripts + Background + Storage
Complexidade: Média
Exemplo: Ad blocker, page enhancer, form filler
```

### **⚙️ Background-Heavy Extension**
```
Ideal para: Automação, monitoramento, sincronização
Componentes: Background + Storage + Notifications
Complexidade: Média-Alta
Exemplo: Tab manager, bookmark sync, productivity tracker
```

### **🎛️ Full-Featured Extension**
```
Ideal para: Aplicações completas, dashboards, ferramentas avançadas
Componentes: Todos (Popup + Content + Background + Options)
Complexidade: Alta
Exemplo: Password manager, developer tools, CRM integration
```

### **🔧 Developer Tools Extension**
```
Ideal para: Ferramentas de desenvolvimento, debugging, análise
Componentes: DevTools + Background + Content Scripts
Complexidade: Alta
Exemplo: React DevTools, performance analyzer, API tester
```

---

## 📦 TEMPLATES DE ESTRUTURA

### **🎯 Template Básico (Popup + Background)**
```
extension-name/
├── src/
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── popup.css
│   │   └── components/
│   ├── shared/
│   │   ├── utils.js
│   │   ├── storage.js
│   │   ├── messaging.js
│   │   └── constants.js
│   ├── assets/
│   │   ├── icons/
│   │   ├── images/
│   │   └── fonts/
│   └── _locales/
│       ├── en/
│       └── pt_BR/
├── tests/
├── scripts/
├── config/
└── dist/
```

### **🎯 Template Avançado (Full-Featured)**
```
extension-name/
├── src/
│   ├── manifest.json
│   ├── background/
│   │   ├── service-worker.js
│   │   ├── handlers/
│   │   ├── services/
│   │   └── utils/
│   ├── content/
│   │   ├── content-script.js
│   │   ├── content-script.css
│   │   ├── injected/
│   │   └── components/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── popup.css
│   │   ├── components/
│   │   └── pages/
│   ��── options/
│   │   ├── options.html
│   │   ├── options.js
│   │   ├── options.css
│   │   └── components/
│   ├── devtools/
│   │   ├── devtools.html
│   │   ├── devtools.js
│   │   ├── panel.html
│   │   └── panel.js
│   ├── shared/
│   │   ├── api/
│   │   ├── utils/
│   │   ├── storage/
│   │   ├── messaging/
│   │   ├── constants/
│   │   └── types/
│   ├── assets/
│   └── _locales/
├── tests/
├── scripts/
├── config/
├── docs/
└── dist/
```

---

## 🔧 STACK TECNOLÓGICO E CONFIGURAÇÕES

### **📦 Opções de Stack**

#### **🥇 Stack Moderno (Recomendado)**
```json
{
  "stack": "TypeScript + Vite + Modern APIs",
  "benefits": [
    "Type safety",
    "Fast development",
    "Modern tooling",
    "Hot reload",
    "Tree shaking"
  ],
  "tools": {
    "language": "TypeScript",
    "bundler": "Vite",
    "testing": "Vitest + Playwright",
    "linting": "ESLint + Prettier",
    "ui": "Vanilla TS ou React/Vue"
  }
}
```

#### **🥈 Stack Clássico (Estável)**
```json
{
  "stack": "JavaScript + Webpack + Babel",
  "benefits": [
    "Estabilidade",
    "Compatibilidade ampla",
    "Documentação extensa",
    "Comunidade grande"
  ],
  "tools": {
    "language": "JavaScript ES6+",
    "bundler": "Webpack",
    "testing": "Jest + Puppeteer",
    "linting": "ESLint + Prettier",
    "ui": "Vanilla JS ou framework"
  }
}
```

#### **🥉 Stack Simples (Sem Build)**
```json
{
  "stack": "Vanilla JavaScript",
  "benefits": [
    "Simplicidade",
    "Zero configuração",
    "Deploy direto",
    "Debug fácil"
  ],
  "tools": {
    "language": "JavaScript ES6+",
    "bundler": "Nenhum",
    "testing": "Manual + browser testing",
    "linting": "ESLint básico",
    "ui": "HTML/CSS/JS puro"
  }
}
```

### **⚙️ Configurações Base**

#### **Manifest.json Template**
```json
{
  "manifest_version": 3,
  "name": "__EXTENSION_NAME__",
  "version": "1.0.0",
  "description": "__EXTENSION_DESCRIPTION__",
  "permissions": [
    "storage"
  ],
  "host_permissions": [],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "__EXTENSION_NAME__",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

#### **Package.json Template**
```json
{
  "name": "__extension-name__",
  "version": "1.0.0",
  "description": "__EXTENSION_DESCRIPTION__",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build --mode production",
    "build:chrome": "npm run build && npm run package:chrome",
    "build:firefox": "npm run build && npm run package:firefox",
    "build:edge": "npm run build && npm run package:edge",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src/ --ext .ts,.js",
    "lint:fix": "eslint src/ --ext .ts,.js --fix",
    "type-check": "tsc --noEmit",
    "package:chrome": "web-ext build --source-dir dist/chrome",
    "package:firefox": "web-ext build --source-dir dist/firefox",
    "serve:firefox": "web-ext run --source-dir dist/firefox"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.246",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0",
    "vitest": "^0.34.0",
    "playwright": "^1.38.0",
    "web-ext": "^7.8.0"
  }
}
```

---

## 🎨 COMPONENTES E PADRÕES

### **🔄 Message Passing System**
```typescript
// shared/messaging/message-types.ts
export enum MessageType {
  GET_DATA = 'GET_DATA',
  SET_DATA = 'SET_DATA',
  CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY',
  BACKGROUND_ACTION = 'BACKGROUND_ACTION'
}

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  requestId?: string;
}

// shared/messaging/message-handler.ts
export class MessageHandler {
  private handlers = new Map<MessageType, Function>();

  register<T>(type: MessageType, handler: (payload: T) => Promise<any> | any) {
    this.handlers.set(type, handler);
  }

  async handle(message: Message): Promise<any> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      throw new Error(`No handler for message type: ${message.type}`);
    }
    return await handler(message.payload);
  }

  async send<T>(type: MessageType, payload?: T): Promise<any> {
    const message: Message<T> = {
      type,
      payload,
      requestId: crypto.randomUUID()
    };

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}
```

### **💾 Storage System**
```typescript
// shared/storage/storage-manager.ts
export class StorageManager {
  private static instance: StorageManager;
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    const result = await chrome.storage.sync.get(key);
    return result[key] ?? defaultValue;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.sync.remove(key);
  }

  async clear(): Promise<void> {
    await chrome.storage.sync.clear();
  }

  onChanged(callback: (changes: any) => void): void {
    chrome.storage.onChanged.addListener(callback);
  }
}
```

### **🎛️ Configuration System**
```typescript
// shared/config/config-manager.ts
export interface ExtensionConfig {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  autoSync: boolean;
  language: string;
  customSettings: Record<string, any>;
}

export class ConfigManager {
  private static readonly CONFIG_KEY = 'extension_config';
  private storage = StorageManager.getInstance();

  async getConfig(): Promise<ExtensionConfig> {
    return await this.storage.get(ConfigManager.CONFIG_KEY, {
      theme: 'auto',
      notifications: true,
      autoSync: true,
      language: 'en',
      customSettings: {}
    });
  }

  async updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };
    await this.storage.set(ConfigManager.CONFIG_KEY, newConfig);
  }

  async resetConfig(): Promise<void> {
    await this.storage.remove(ConfigManager.CONFIG_KEY);
  }
}
```

---

## 🚀 PROCESSO DE GERAÇÃO

### **📋 Etapas de Criação**

#### **1. Análise e Planejamento**
```typescript
interface ExtensionSpec {
  name: string;
  description: string;
  version: string;
  architecture: 'popup' | 'content' | 'background' | 'full' | 'devtools';
  browsers: ('chrome' | 'firefox' | 'edge')[];
  permissions: string[];
  hostPermissions: string[];
  features: string[];
  stack: 'modern' | 'classic' | 'simple';
  ui: 'vanilla' | 'react' | 'vue' | 'none';
}
```

#### **2. Estrutura de Arquivos**
- Criar diretório base com estrutura apropriada
- Gerar manifest.json baseado na arquitetura
- Configurar build system se necessário
- Criar arquivos base para cada componente

#### **3. Implementação Core**
- Background service worker com handlers básicos
- Sistema de messaging entre componentes
- Storage manager para persistência
- Configuration system para settings

#### **4. Interface do Usuário**
- Popup HTML/CSS/JS se necessário
- Options page se configurável
- Content scripts se modifica páginas
- DevTools integration se aplicável

#### **5. Configuração de Desenvolvimento**
- Scripts de build e desenvolvimento
- Configuração de linting e formatting
- Setup de testing básico
- Hot reload para desenvolvimento

#### **6. Documentação Inicial**
- README com instruções de setup
- Comentários no código
- Estrutura de arquivos explicada
- Guia de desenvolvimento

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO

### **OBJETIVO:** Gerar estrutura completa de extensão pronta para desenvolvimento

### **ESTRUTURA DE ENTREGA:**

```
📦 EXTENSÃO GERADA
├── 📁 src/                          # Código fonte
│   ├── manifest.json               # Manifest V3 configurado
│   ├── 📁 background/              # Service worker
│   ├── 📁 popup/                   # Interface popup (se aplicável)
│   ├── 📁 content/                 # Content scripts (se aplicável)
│   ├── 📁 options/                 # Página de opções (se aplicável)
│   ├── 📁 shared/                  # Código compartilhado
│   └── 📁 assets/                  # Recursos estáticos
├── 📁 config/                      # Configurações de build
├── 📁 scripts/                     # Scripts de automação
├── 📁 tests/                       # Testes básicos
├── package.json                    # Dependencies e scripts
├── tsconfig.json                   # TypeScript config (se aplicável)
├── vite.config.js                  # Build config (se aplicável)
├── .eslintrc.js                    # Linting rules
├── .prettierrc                     # Code formatting
├── README.md                       # Documentação
└── .gitignore                      # Git ignore rules
```

### **CADA ARQUIVO DEVE CONTER:**

#### **📄 Código Funcional**
- Implementação completa e funcional
- Comentários explicativos
- Error handling básico
- Type safety (se TypeScript)

#### **🔧 Configurações Otimizadas**
- Build system configurado
- Development workflow pronto
- Cross-browser compatibility
- Performance optimizations

#### **📚 Documentação Clara**
- README com setup instructions
- Code comments explicativos
- Architecture overview
- Development guidelines

---

## ✅ CHECKLIST DE QUALIDADE

### **🎯 Funcionalidade**
- [ ] **Manifest V3 válido** e completo
- [ ] **Arquitetura apropriada** para os requisitos
- [ ] **Permissions mínimas** necessárias
- [ ] **Cross-browser compatibility** implementada
- [ ] **Error handling** em pontos críticos
- [ ] **Performance otimizada** desde o início

### **🏗️ Estrutura**
- [ ] **Organização modular** e escalável
- [ ] **Separação de responsabilidades** clara
- [ ] **Reutilização de código** maximizada
- [ ] **Configurações externalizadas** apropriadamente
- [ ] **Assets organizados** e otimizados

### **🔧 Desenvolvimento**
- [ ] **Build system** configurado e funcional
- [ ] **Hot reload** para desenvolvimento
- [ ] **Linting e formatting** configurados
- [ ] **Testing framework** básico setup
- [ ] **Scripts de automação** prontos

### **📚 Documentação**
- [ ] **README completo** com instruções
- [ ] **Code comments** em pontos importantes
- [ ] **Architecture decisions** documentadas
- [ ] **Development workflow** explicado
- [ ] **Deployment instructions** incluídas

### **🛡️ Segurança**
- [ ] **CSP configurado** apropriadamente
- [ ] **Input validation** implementada
- [ ] **Secure communication** entre componentes
- [ ] **Data sanitization** em pontos críticos
- [ ] **Privacy considerations** atendidas

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverable Final**
Uma extensão de navegador **completa**, **funcional** e **production-ready** que:

✅ **Funciona imediatamente** após instalação  
✅ **Segue todas as best practices** de Manifest V3  
✅ **É compatível** com Chrome, Firefox e Edge  
✅ **Tem arquitetura escalável** para crescimento futuro  
✅ **Inclui tooling moderno** para desenvolvimento eficiente  
✅ **Está documentada** para facilitar manutenção  
✅ **É segura** e otimizada para performance  

### **🚀 Benefícios**
- **Time-to-market reduzido** - Desenvolvimento acelerado
- **Qualidade garantida** - Best practices desde o início  
- **Manutenibilidade alta** - Código limpo e organizado
- **Escalabilidade nativa** - Arquitetura preparada para crescimento
- **Developer experience** - Tooling moderno e eficiente

**A extensão gerada deve ser um ponto de partida sólido que permite ao desenvolvedor focar na lógica de negócio específica, com toda a infraestrutura e boilerplate já implementados corretamente.**