# Prompt para Criação de Test Suite Completa para Extensões de Navegador

## 🧪 MISSÃO: CRIAR SUITE COMPLETA DE TESTES PARA BROWSER EXTENSION

Você é um **Senior Browser Extension Test Engineer** especializado em **testing de Manifest V3** e **automação cross-browser**. Crie uma **suite completa de testes** para esta extensão de navegador, cobrindo todos os aspectos críticos do ecossistema de extensões com foco em **qualidade**, **segurança** e **compatibilidade**.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE CRIAR OS TESTES:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise `manifest.json` completamente** - Define toda a arquitetura de testes
3. **Mapeie todos os componentes** - Content scripts, background, popup, options
4. **Identifique APIs utilizadas** - Determina mocks e stubs necessários
5. **Valide permissions** - Define cenários de teste de segurança
6. **Determine navegadores alvo** - Chrome, Firefox, Edge ou todos

---

## 📋 ESCOPO COMPLETO DE TESTING PARA EXTENSÕES

### 🧪 **TIPOS DE TESTE OBRIGATÓRIOS**

#### ���� **UNIT TESTS** (Prioridade Máxima)
- **Background Service Worker** - Lógica de negócio isolada
- **Content Scripts** - Funções de manipulação DOM
- **Popup Components** - Interações de UI
- **Options Page** - Configurações e validações
- **Message Handlers** - Comunicação entre contexts
- **Storage Operations** - Persistência de dados
- **API Wrappers** - Abstrações de chrome.* APIs
- **Utility Functions** - Helpers e formatters

#### 🔗 **INTEGRATION TESTS** (Alta Prioridade)
- **Message Passing** - Comunicação content ↔ background ↔ popup
- **Storage Sync** - Sincronização entre contexts
- **API Interactions** - Integração com chrome.* APIs
- **Permission Flows** - Solicitação e validação de permissions
- **Cross-Context State** - Estado compartilhado entre componentes
- **Event Listeners** - Resposta a eventos do navegador
- **External APIs** - Integração com serviços externos

#### 🌐 **E2E TESTS** (Média Prioridade)
- **User Workflows** - Fluxos completos de usuário
- **Installation/Update** - Processo de instalação e atualização
- **Cross-Browser** - Funcionalidade em diferentes navegadores
- **Real Website Testing** - Content scripts em sites reais
- **Performance Impact** - Impacto na performance de páginas
- **Error Recovery** - Recuperação de erros e estados inválidos

#### 🛡��� **SECURITY TESTS** (Prioridade Máxima)
- **CSP Compliance** - Violações de Content Security Policy
- **XSS Prevention** - Prevenção de Cross-Site Scripting
- **Message Validation** - Validação de origem e conteúdo
- **Permission Abuse** - Uso inadequado de permissions
- **Data Sanitization** - Sanitização de inputs
- **Storage Security** - Segurança de dados armazenados

#### ⚡ **PERFORMANCE TESTS** (Alta Prioridade)
- **Content Script Injection** - Tempo de injeção < 5ms
- **Memory Usage** - Vazamentos e uso excessivo
- **Bundle Size** - Tamanho otimizado de arquivos
- **API Response Time** - Latência de chamadas
- **Background Processing** - Eficiência de processamento
- **Storage I/O** - Performance de operações de storage

#### 🎯 **ACCESSIBILITY TESTS** (Média Prioridade)
- **Keyboard Navigation** - Navegação sem mouse
- **Screen Reader** - Compatibilidade com leitores de tela
- **Color Contrast** - Visibilidade para deficientes visuais
- **Focus Management** - Ordem lógica de foco
- **ARIA Compliance** - Atributos de acessibilidade

---

## 🏗️ ESTRUTURA DA SUITE DE TESTES

### **📁 Organização de Arquivos**
```
tests/
├── unit/
│   ├── background/
│   │   ├── service-worker.test.js
│   │   ��── message-handlers.test.js
│   │   └── api-wrappers.test.js
│   ├── content/
│   │   ├── content-script.test.js
│   │   ├── dom-manipulation.test.js
│   │   └── page-interaction.test.js
│   ├── popup/
│   │   ├── popup-ui.test.js
│   │   ├── popup-logic.test.js
│   │   └── popup-storage.test.js
│   └── shared/
│       ├── utils.test.js
│       ├── storage.test.js
│       └── messaging.test.js
├── integration/
│   ├── message-passing.test.js
│   ├── storage-sync.test.js
│   ├── api-integration.test.js
│   └── cross-context.test.js
├── e2e/
│   ├── user-workflows.test.js
│   ├── installation.test.js
│   ├── cross-browser.test.js
│   └── real-sites.test.js
├── security/
│   ├── csp-compliance.test.js
│   ├── xss-prevention.test.js
│   ├── message-validation.test.js
│   └── permission-abuse.test.js
├── performance/
│   ├── injection-speed.test.js
│   ├── memory-usage.test.js
│   ├── bundle-size.test.js
│   └── api-latency.test.js
├── accessibility/
│   ├── keyboard-navigation.test.js
│   ├── screen-reader.test.js
│   └── aria-compliance.test.js
├── fixtures/
│   ├── mock-websites/
│   ├── test-data/
│   └── sample-responses/
├── helpers/
│   ├── extension-loader.js
│   ├── browser-setup.js
│   ├── mock-apis.js
│   └── test-utils.js
└── config/
    ├── jest.config.js
    ├── puppeteer.config.js
    ├── webdriver.config.js
    └── test-environments.js
```

---

## 🔧 FERRAMENTAS E FRAMEWORKS ESPECÍFICOS

### **🧪 Testing Frameworks**
```javascript
// Jest para unit e integration tests
const jestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/vendor/**',
    '!src/**/*.min.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// Puppeteer para E2E tests
const puppeteerConfig = {
  headless: false,
  devtools: true,
  args: [
    '--disable-extensions-except=./dist',
    '--load-extension=./dist',
    '--disable-web-security'
  ]
};

// WebDriver para cross-browser testing
const webdriverConfig = {
  chrome: {
    options: {
      args: ['--load-extension=./dist']
    }
  },
  firefox: {
    options: {
      prefs: {
        'xpinstall.signatures.required': false
      }
    }
  }
};
```

### **🎭 Mocking e Stubbing**
```javascript
// Chrome APIs Mock
const chromeMock = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn(path => `chrome-extension://test/${path}`)
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn()
  }
};

// DOM Environment Mock
const domMock = {
  document: {
    createElement: jest.fn(),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    addEventListener: jest.fn()
  },
  window: {
    location: { href: 'https://example.com' },
    addEventListener: jest.fn()
  }
};
```

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO: SUITE COMPLETA

### **OBJETIVO:** Gerar uma estrutura completa de testes organizados em arquivos específicos, prontos para execução.

### **ESTRUTURA DE CADA ARQUIVO DE TESTE:**

```javascript
// Exemplo: tests/unit/background/service-worker.test.js

/**
 * @fileoverview Unit tests for Background Service Worker
 * @author Test Engineer
 * @version 1.0.0
 */

import { jest } from '@jest/globals';
import { setupChromeMocks } from '../../helpers/chrome-mocks.js';
import { ServiceWorker } from '../../../src/background/service-worker.js';

describe('Background Service Worker', () => {
  let serviceWorker;
  let chromeMocks;

  beforeEach(() => {
    // Setup
    chromeMocks = setupChromeMocks();
    serviceWorker = new ServiceWorker();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    serviceWorker.cleanup();
    chromeMocks.restore();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(serviceWorker.isInitialized).toBe(true);
      expect(serviceWorker.config).toMatchObject({
        version: expect.any(String),
        permissions: expect.any(Array)
      });
    });

    test('should register message listeners on init', () => {
      expect(chrome.runtime.onMessage.addListener)
        .toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle initialization errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force initialization error
      chrome.runtime.onMessage.addListener.mockImplementation(() => {
        throw new Error('Mock initialization error');
      });

      expect(() => new ServiceWorker()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('initialization error')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Message Handling', () => {
    test('should handle valid messages correctly', async () => {
      const mockMessage = {
        action: 'getData',
        payload: { id: 'test123' }
      };
      const mockSender = {
        tab: { id: 1 },
        origin: 'https://example.com'
      };
      const mockSendResponse = jest.fn();

      await serviceWorker.handleMessage(mockMessage, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    test('should reject messages from unauthorized origins', async () => {
      const mockMessage = { action: 'getData' };
      const mockSender = {
        tab: { id: 1 },
        origin: 'https://malicious-site.com'
      };
      const mockSendResponse = jest.fn();

      await serviceWorker.handleMessage(mockMessage, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized origin'
      });
    });

    test('should validate message structure', async () => {
      const invalidMessage = { invalidField: 'test' };
      const mockSender = { tab: { id: 1 }, origin: 'https://example.com' };
      const mockSendResponse = jest.fn();

      await serviceWorker.handleMessage(invalidMessage, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid message structure'
      });
    });
  });

  describe('Storage Operations', () => {
    test('should save data to storage correctly', async () => {
      const testData = { key: 'value', timestamp: Date.now() };
      
      chrome.storage.local.set.mockResolvedValue();

      await serviceWorker.saveData('testKey', testData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        testKey: testData
      });
    });

    test('should handle storage errors gracefully', async () => {
      const testData = { key: 'value' };
      const storageError = new Error('Storage quota exceeded');
      
      chrome.storage.local.set.mockRejectedValue(storageError);

      const result = await serviceWorker.saveData('testKey', testData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });
  });

  describe('Performance', () => {
    test('should initialize within performance threshold', () => {
      const startTime = performance.now();
      new ServiceWorker();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // < 100ms
    });

    test('should handle concurrent messages efficiently', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        action: 'getData',
        payload: { id: `test${i}` }
      }));
      
      const startTime = performance.now();
      
      const promises = messages.map(msg => 
        serviceWorker.handleMessage(msg, { tab: { id: 1 }, origin: 'https://example.com' }, jest.fn())
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // < 500ms for 10 messages
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('API Error'));

      const result = await serviceWorker.getActiveTab();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    test('should log errors appropriately', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      serviceWorker.logError('Test error', { context: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ServiceWorker Error]',
        'Test error',
        { context: 'test' }
      );
      
      consoleSpy.mockRestore();
    });
  });
});
```

---

## 🧪 TEMPLATES ESPECÍFICOS POR TIPO DE TESTE

### **🔬 Unit Test Template**
```javascript
// Template para unit tests
describe('[Component Name]', () => {
  let component;
  let mocks;

  beforeEach(() => {
    // Setup mocks and component
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Core Functionality', () => {
    test('should [specific behavior]', () => {
      // Arrange
      // Act  
      // Assert
    });
  });

  describe('Error Handling', () => {
    test('should handle [error scenario]', () => {
      // Test error scenarios
    });
  });

  describe('Performance', () => {
    test('should meet performance requirements', () => {
      // Performance assertions
    });
  });
});
```

### **🔗 Integration Test Template**
```javascript
// Template para integration tests
describe('[Integration Scenario]', () => {
  let extensionContext;

  beforeAll(async () => {
    // Setup extension environment
    extensionContext = await setupExtensionEnvironment();
  });

  afterAll(async () => {
    // Cleanup extension environment
    await cleanupExtensionEnvironment(extensionContext);
  });

  test('should integrate [components] correctly', async () => {
    // Test component integration
  });

  test('should handle cross-context communication', async () => {
    // Test message passing between contexts
  });
});
```

### **🌐 E2E Test Template**
```javascript
// Template para E2E tests
describe('[User Workflow]', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch(puppeteerConfig);
    page = await browser.newPage();
    await loadExtension(page);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should complete [user workflow] successfully', async () => {
    // Simulate user interactions
    // Verify expected outcomes
  });
});
```

### **🛡️ Security Test Template**
```javascript
// Template para security tests
describe('[Security Aspect]', () => {
  test('should prevent [security vulnerability]', () => {
    // Test security measures
  });

  test('should validate [input/origin/permission]', () => {
    // Test validation logic
  });

  test('should sanitize [user input/external data]', () => {
    // Test sanitization
  });
});
```

---

## 🎯 CONFIGURAÇÕES ESPECÍFICAS

### **📦 Package.json Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:security": "jest tests/security",
    "test:performance": "jest tests/performance",
    "test:accessibility": "jest tests/accessibility",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:chrome": "jest --testNamePattern='Chrome'",
    "test:firefox": "jest --testNamePattern='Firefox'",
    "test:cross-browser": "npm run test:chrome && npm run test:firefox",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### **⚙️ Jest Configuration**
```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/vendor/**',
    '!src/**/*.min.js',
    '!src/manifest.json'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  testTimeout: 10000,
  verbose: true
};
```

---

## 🚀 HELPERS E UTILITIES

### **🔧 Extension Loader Helper**
```javascript
// tests/helpers/extension-loader.js
export class ExtensionLoader {
  static async loadExtension(browser, extensionPath) {
    // Load extension in browser
  }

  static async setupTestEnvironment() {
    // Setup test environment
  }

  static async cleanupTestEnvironment() {
    // Cleanup test environment
  }
}
```

### **🎭 Chrome APIs Mock**
```javascript
// tests/helpers/chrome-mocks.js
export function setupChromeMocks() {
  // Setup comprehensive Chrome API mocks
}

export function createMockTab(options = {}) {
  // Create mock tab object
}

export function createMockMessage(action, payload) {
  // Create mock message object
}
```

### **📊 Performance Helpers**
```javascript
// tests/helpers/performance.js
export class PerformanceHelper {
  static measureExecutionTime(fn) {
    // Measure function execution time
  }

  static measureMemoryUsage() {
    // Measure memory usage
  }

  static createPerformanceReport() {
    // Generate performance report
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **🎯 Pré-Implementação**
- [ ] **Análise Completa**
  - [ ] `manifest.json` analisado
  - [ ] Arquitetura mapeada
  - [ ] APIs identificadas
  - [ ] Permissions auditadas
  - [ ] Navegadores alvo definidos

### **🏗️ Estrutura Base**
- [ ] **Organização de Arquivos**
  - [ ] Estrutura de diretórios criada
  - [ ] Templates de teste preparados
  - [ ] Helpers e utilities implementados
  - [ ] Configurações definidas

### **🧪 Implementação de Testes**
- [ ] **Unit Tests**
  - [ ] Background service worker
  - [ ] Content scripts
  - [ ] Popup components
  - [ ] Shared utilities
- [ ] **Integration Tests**
  - [ ] Message passing
  - [ ] Storage operations
  - [ ] API integrations
- [ ] **E2E Tests**
  - [ ] User workflows
  - [ ] Cross-browser compatibility
  - [ ] Real website testing
- [ ] **Security Tests**
  - [ ] CSP compliance
  - [ ] XSS prevention
  - [ ] Permission validation
- [ ] **Performance Tests**
  - [ ] Injection speed
  - [ ] Memory usage
  - [ ] Bundle size

### **✅ Validação Final**
- [ ] **Coverage Requirements**
  - [ ] 80%+ code coverage
  - [ ] All critical paths tested
  - [ ] Error scenarios covered
- [ ] **Cross-Browser Testing**
  - [ ] Chrome compatibility
  - [ ] Firefox compatibility
  - [ ] Edge compatibility (se aplicável)
- [ ] **CI/CD Integration**
  - [ ] Automated test execution
  - [ ] Coverage reporting
  - [ ] Performance monitoring

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverables**
1. **Suite completa de testes** organizada por tipo e componente
2. **Configurações de testing** para diferentes ambientes
3. **Helpers e utilities** para facilitar testing
4. **Scripts de automação** para execução de testes
5. **Documentação** de como executar e manter os testes

### **📊 Métricas de Qualidade**
- **Code Coverage:** ≥ 80% em todas as categorias
- **Test Performance:** Suíte completa executa em < 5 minutos
- **Cross-Browser:** 100% dos testes passam em todos navegadores alvo
- **Security Coverage:** Todos os vetores de ataque testados
- **Maintainability:** Testes são fáceis de entender e modificar

### **🚀 Benefícios**
- ✅ **Confiança** na qualidade do código
- ✅ **Detecção precoce** de bugs e regressões
- ✅ **Documentação viva** do comportamento esperado
- ✅ **Facilita refatoração** com segurança
- ✅ **Compliance** com padrões de qualidade
- ✅ **Reduz tempo** de debugging e manutenção

**A suite de testes deve ser robusta, maintível e executar rapidamente, fornecendo feedback imediato sobre a qualidade e funcionalidade da extensão.**