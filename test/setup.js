/**
 * Configuração do Jest para Browser Extensions
 * 
 * Setup específico para testes de extensões médicas
 * com mocks dos APIs do browser e validações de compliance
 */

// Setup environment
global.console = {
  ...console,
  // Sempre manter logs de erro, mesmo em testes
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silenciar logs normais em testes, exceto se explicitamente habilitado
  log: process.env.JEST_VERBOSE ? jest.fn(console.log) : jest.fn(),
  info: process.env.JEST_VERBOSE ? jest.fn(console.info) : jest.fn(),
  debug: process.env.JEST_VERBOSE ? jest.fn(console.debug) : jest.fn()
};

// Mock de APIs do Browser
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    getManifest: jest.fn(() => ({
      manifest_version: 3,
      name: 'Assistente de Regulação Médica',
      version: '1.0.0'
    })),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    reload: jest.fn()
  },
    
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (typeof keys === 'function') {
          callback = keys;
          keys = null;
        }
        callback({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
      })
    },
    session: {
      get: jest.fn((keys, callback) => {
        if (typeof keys === 'function') {
          callback = keys;
          keys = null;
        }
        callback({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
      })
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
    
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([{
        id: 1,
        url: 'https://example.com',
        title: 'Test Tab'
      }]);
    }),
    sendMessage: jest.fn(),
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  },
    
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  },
    
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn()
  },
    
  permissions: {
    contains: jest.fn((permissions, callback) => {
      callback(true);
    }),
    request: jest.fn((permissions, callback) => {
      callback(true);
    })
  }
};

// Mock para Firefox (browser API)
global.browser = { ...global.chrome };

// Mock DOM APIs específicos para extensões
global.document = {
  ...global.document,
  createElement: jest.fn((tagName) => ({
    tagName: tagName.toUpperCase(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    style: {}
  })),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  },
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock window object
global.window = {
  ...global.window,
  location: {
    href: 'https://test.example.com',
    hostname: 'test.example.com',
    pathname: '/',
    search: '',
    hash: ''
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  postMessage: jest.fn()
};

// Mock fetch para testes de API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Configurações específicas para extensão médica
global.medicalTestUtils = {
  // Função para sanitizar dados de teste
  sanitizeTestData: (data) => {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
            
      // Remover dados sensíveis dos testes
      const sensitiveFields = ['cpf', 'rg', 'cns', 'nome_completo', 'endereco'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[SANITIZED]';
        }
      });
            
      return sanitized;
    }
    return data;
  },
    
  // Mock de dados de paciente para testes
  createMockPatient: () => ({
    id: 'TEST_PATIENT_001',
    nome: 'Paciente Teste',
    cpf: '***.***.***-**',
    data_nascimento: '1990-01-01',
    // Sempre usar dados fictícios nos testes
    is_test_data: true
  }),
    
  // Validar se dados não vazaram em logs
  validateNoDataLeaks: () => {
    const logCalls = console.log.mock?.calls || [];
    const errorCalls = console.error.mock?.calls || [];
    const allCalls = [...logCalls, ...errorCalls];
        
    const sensitivePatterns = [
      /\d{3}\.\d{3}\.\d{3}-\d{2}/, // CPF
      /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, // CNPJ
      /\d{15}/, // CNS
      /[A-Z]{2}\d{7}/ // RG patterns
    ];
        
    allCalls.forEach((call, index) => {
      const message = call.join(' ');
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(message)) {
          throw new Error(`Possível vazamento de dados sensíveis no log ${index}: ${message}`);
        }
      });
    });
  }
};

// Setup para compliance médico
global.medicalCompliance = {
  // Verificar se dados são tratados adequadamente
  validateDataHandling: (operation, data) => {
    if (data && typeof data === 'object') {
      // Verificar se dados sensíveis estão sendo persistidos
      const sensitiveFields = ['cpf', 'rg', 'cns'];
      sensitiveFields.forEach(field => {
        if (data[field] && operation.includes('persist')) {
          throw new Error(`Tentativa de persistir dados sensíveis: ${field}`);
        }
      });
    }
  },
    
  // Mock de validação GDPR/LGPD
  validateGDPRCompliance: (dataUsage) => {
    const requiredFields = ['purpose', 'retention', 'consent'];
    requiredFields.forEach(field => {
      if (!dataUsage[field]) {
        throw new Error(`Campo GDPR obrigatório ausente: ${field}`);
      }
    });
  }
};

// Cleanup após cada teste
afterEach(() => {
  // Validar que não houve vazamento de dados
  if (typeof global.medicalTestUtils?.validateNoDataLeaks === 'function') {
    global.medicalTestUtils.validateNoDataLeaks();
  }
    
  // Limpar mocks
  jest.clearAllMocks();
    
  // Reset storage mocks
  if (global.chrome?.storage?.local) {
    global.chrome.storage.local.get.mockClear();
    global.chrome.storage.local.set.mockClear();
    global.chrome.storage.local.remove.mockClear();
  }
});

// Setup antes de todos os testes
beforeAll(() => {
  console.log('🧪 Iniciando testes da extensão médica');
  console.log('🔒 Compliance médico ativo');
  console.log('📋 Mocks do browser configurados');
});

// Cleanup após todos os testes
afterAll(() => {
  console.log('✅ Testes concluídos');
  console.log('🔍 Verificando compliance final...');
    
  // Validação final de compliance
  if (global.medicalTestUtils?.validateNoDataLeaks) {
    global.medicalTestUtils.validateNoDataLeaks();
  }
});

module.exports = {
  // Configurações exportadas para uso em testes específicos
  mockChrome: global.chrome,
  mockBrowser: global.browser,
  medicalTestUtils: global.medicalTestUtils,
  medicalCompliance: global.medicalCompliance
};
