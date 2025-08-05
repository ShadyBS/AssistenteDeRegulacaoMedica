# 🧪 Plano Faseado para Melhoria da Cobertura de Testes

**Status Atual:** ⚠️ **CRÍTICO** - Cobertura muito baixa facilita regressões
**Objetivo:** 🎯 Elevar cobertura para **80%+ em módulos críticos**
**Contexto:** 🏥 Extensão médica com dados sensíveis - **zero tolerância a bugs**

---

## 📊 ANÁLISE DO ESTADO ATUAL

### 🔍 Problemas Identificados

1. **Cobertura Insuficiente:**
   - Apenas 8 arquivos de teste para 23+ módulos JavaScript
   - Módulos críticos (`api.js`, `sidebar.js`, `background.js`) sem cobertura adequada
   - Dados médicos sensíveis sem validação robusta

2. **Testes Instáveis:**
   - 6 test suites falhando, 31 testes com falha
   - Problemas de performance no `store.js` (listeners infinitos)
   - Falta de mocks adequados para APIs médicas

3. **Arquivos Sem Cobertura:**
   - `api.js` (1200+ linhas) - **CRÍTICO** - APIs SIGSS/CADSUS
   - `sidebar.js` (800+ linhas) - **CRÍTICO** - Interface principal
   - `background.js` (900+ linhas) - **CRÍTICO** - Service worker
   - `TimelineManager.js` - **ALTO** - Gestão timeline médica
   - `SectionManager.js` - **ALTO** - Gestão seções
   - `ui/search.js` e `ui/patient-card.js` - **MÉDIO** - Componentes UI

### 📈 Métricas Atuais Estimadas

```
Cobertura Global: ~15-20%
├── Statements: ~20%
├── Branches: ~10%
├── Functions: ~25%
└── Lines: ~18%

CRÍTICOS SEM COBERTURA:
├── api.js: 0%
├── sidebar.js: 0%
├── background.js: 0%
├── TimelineManager.js: 0%
└── SectionManager.js: 0%
```

---

## 🎯 OBJETIVOS SMART

### 📊 Metas de Cobertura

**Fase 1 (3 semanas):** 50% cobertura global
**Fase 2 (4 semanas):** 70% cobertura global
**Fase 3 (3 semanas):** 85% cobertura módulos críticos

### 🏥 Objetivos Específicos Médicos

1. **Zero bugs** em fluxos de dados sensíveis (CPF, CNS, dados pacientes)
2. **100% cobertura** em sanitização de logs médicos
3. **Validação robusta** de APIs SIGSS/CADSUS
4. **Testes de compliance** LGPD/GDPR

---

## 📅 FASE 1: ESTABILIZAÇÃO E FUNDAÇÃO (3 semanas)

### 🔧 Semana 1: Correção da Infraestrutura de Testes

#### 🎯 Objetivos
- Corrigir testes instáveis existentes
- Implementar mocks médicos robustos
- Configurar pipeline CI/CD confiável

#### 📋 Tarefas

##### 1.1 Correção do Store Performance Issue
```javascript
// PROBLEMA: store.js gerando listeners infinitos
// SOLUÇÃO: Implementar cleanup adequado

// test/unit/core/store-performance.test.js
describe('Store Performance', () => {
  afterEach(() => {
    // Limpar todos os listeners
    store._clearAllListeners();
  });
});
```

##### 1.2 Melhoria dos Mocks Médicos
```javascript
// test/mocks/medical-apis.js - APRIMORAR
export const mockSigssApi = {
  fetchPatientTimeline: jest.fn().mockResolvedValue({
    consultas: [/* dados sanitizados */],
    exames: [/* dados sanitizados */],
    regulacoes: [/* dados sanitizados */]
  }),

  fetchCadsusData: jest.fn().mockResolvedValue({
    // Dados SEMPRE sanitizados - nunca CPF/CNS reais
    nome: 'PACIENTE_TESTE_***',
    dataNascimento: '****-**-**',
    isenPK: 'TEST_ISEN_PK_12345'
  })
};
```

##### 1.3 Setup de Browser Extension Testing
```javascript
// test/setup.js - APRIMORAR
global.chrome = {
  runtime: {
    getManifest: jest.fn(() => ({ version: '3.3.7-test' })),
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    session: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};
```

#### 📊 Métricas Semana 1
- ✅ 0 testes falhando
- ✅ Mocks médicos funcionais
- ✅ Pipeline CI verde

### 🏗️ Semana 2: Testes de Módulos Core

#### 🎯 Objetivos
- Implementar testes para `ErrorHandler.js` (já existe, melhorar)
- Criar testes para `store.js` (melhorar existentes)
- Implementar testes para `utils.js`

#### 📋 Tarefas

##### 2.1 ErrorHandler.js - Testes Médicos Específicos
```javascript
// test/unit/ErrorHandler.test.js - EXPANDIR
describe('Medical Data Sanitization', () => {
  test('should sanitize CPF in logs', () => {
    const data = { cpf: '123.456.789-00', nome: 'João Silva' };
    const sanitized = sanitizeForLog(data);

    expect(sanitized.cpf).toBe('***');
    expect(sanitized.nome).toBe('***');
  });

  test('should preserve technical IDs', () => {
    const data = {
      reguId: 'REG_12345',
      isenPK: 'ISEN_67890',
      cpf: '123.456.789-00'
    };
    const sanitized = sanitizeForLog(data);

    expect(sanitized.reguId).toBe('REG_12345');
    expect(sanitized.isenPK).toBe('ISEN_67890');
    expect(sanitized.cpf).toBe('***');
  });
});
```

##### 2.2 Utils.js - Testes Completos
```javascript
// test/unit/utils.test.js - CRIAR
describe('Medical Utils', () => {
  describe('debounce', () => {
    test('should debounce patient search calls', async () => {
      const searchFn = jest.fn();
      const debouncedSearch = debounce(searchFn, 300);

      debouncedSearch('João');
      debouncedSearch('João Silva');

      await new Promise(resolve => setTimeout(resolve, 350));
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('João Silva');
    });
  });

  describe('showDialog', () => {
    test('should display medical confirmation dialogs', () => {
      const result = showDialog('Confirmar regulação?', 'confirm');
      expect(document.querySelector('.dialog')).toBeTruthy();
    });
  });
});
```

#### 📊 Métricas Semana 2
- ✅ ErrorHandler: 95% cobertura
- ✅ Store: 80% cobertura
- ✅ Utils: 85% cobertura

### 🔌 Semana 3: APIs e Integrações Médicas

#### 🎯 Objetivos
- Implementar testes para APIs SIGSS/CADSUS críticas
- Validar fluxos de dados médicos
- Testes de segurança e sanitização

#### 📋 Tarefas

##### 3.1 API.js - Testes de APIs Médicas
```javascript
// test/unit/api.test.js - CRIAR
describe('Medical APIs', () => {
  beforeEach(() => {
    // Setup mocks for each test
    global.fetch = jest.fn();
  });

  describe('fetchCadsusData', () => {
    test('should handle CPF search successfully', async () => {
      const mockResponse = {
        rows: [{ cell: ['TESTE', 'PACIENTE', '***'] }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCadsusData({ cpf: '123.456.789-00' });

      expect(result).toEqual(['TESTE', 'PACIENTE', '***']);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/consultarPaciente'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Requested-With': 'XMLHttpRequest'
          })
        })
      );
    });

    test('should sanitize CPF in request params', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rows: [] })
      });

      await fetchCadsusData({ cpf: '12345678900' });

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('123.456.789-00');
    });
  });

  describe('fetchRegulationDetails', () => {
    test('should handle regulation lock/unlock flow', async () => {
      const mockRegulation = {
        reguId: 'REG_12345',
        status: 'PENDENTE',
        paciente: 'PACIENTE_SANITIZADO'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockRegulation))
      });

      const result = await fetchRegulationDetails('REG_12345');

      expect(result.reguId).toBe('REG_12345');
      expect(result.paciente).toBe('PACIENTE_SANITIZADO');
    });
  });
});
```

##### 3.2 Testes de Segurança Médica
```javascript
// test/security/medical-data-protection.test.js - CRIAR
describe('Medical Data Protection', () => {
  test('should never log sensitive medical data', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    // Simular cenário com dados sensíveis
    const sensitiveData = {
      cpf: '123.456.789-00',
      cns: '123456789012345',
      nome: 'João Silva Santos'
    };

    // Executar função que pode logar
    logInfo('Paciente carregado', sensitiveData, ERROR_CATEGORIES.MEDICAL_DATA);

    // Verificar que dados sensíveis não aparecem nos logs
    const logCalls = consoleSpy.mock.calls.flat().join(' ');
    expect(logCalls).not.toContain('123.456.789-00');
    expect(logCalls).not.toContain('João Silva Santos');
    expect(logCalls).toContain('***');

    consoleSpy.mockRestore();
  });
});
```

#### 📊 Métricas Semana 3
- ✅ API.js: 70% cobertura
- ✅ Security tests: 100% cobertura
- ✅ Medical data protection: ✅ Validado

---

## 🚀 FASE 2: EXPANSÃO PARA MÓDULOS CRÍTICOS (4 semanas)

### 🖥️ Semana 4: UI Principal (sidebar.js)

#### 🎯 Objetivos
- Testes de interface principal
- Validação de fluxos de usuário
- Testes de acessibilidade médica

#### 📋 Tarefas

##### 4.1 Sidebar.js - Testes de Interface
```javascript
// test/unit/sidebar.test.js - CRIAR
describe('Medical Sidebar Interface', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="sidebar-container">
        <div id="patient-search"></div>
        <div id="patient-info"></div>
        <div id="sections-container"></div>
      </div>
    `;
  });

  describe('Patient Selection', () => {
    test('should handle patient selection flow', async () => {
      const mockPatient = {
        isenPK: 'TEST_ISEN_12345',
        nome: 'PACIENTE_***',
        ficha: { /* dados sanitizados */ }
      };

      await selectPatient(mockPatient);

      expect(document.querySelector('#patient-info')).toHaveTextContent('PACIENTE_***');
      expect(store.getState().currentPatient).toEqual(mockPatient);
    });
  });

  describe('Section Management', () => {
    test('should initialize medical sections correctly', () => {
      const globalSettings = {
        sectionsOrder: ['consultas', 'exames', 'regulacoes'],
        autoMode: false
      };

      initializeSections(globalSettings);

      expect(document.querySelectorAll('.section')).toHaveLength(3);
      expect(document.querySelector('[data-section="consultas"]')).toBeTruthy();
    });
  });
});
```

##### 4.2 Testes de Componentes UI
```javascript
// test/unit/ui/search.test.js - CRIAR
describe('Patient Search Component', () => {
  test('should perform CADSUS search with debouncing', async () => {
    const searchSpy = jest.spyOn(API, 'searchPatients');
    searchSpy.mockResolvedValue([
      { nome: 'PACIENTE_***', isenPK: 'TEST_123' }
    ]);

    const searchInput = document.createElement('input');
    setupPatientSearch(searchInput);

    // Simular digitação rápida
    searchInput.value = 'João';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.value = 'João Silva';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith('João Silva');
  });
});
```

#### 📊 Métricas Semana 4
- ✅ Sidebar.js: 65% cobertura
- ✅ UI Components: 70% cobertura

### 🔧 Semana 5: Background Script e Service Worker

#### 🎯 Objetivos
- Testes de service worker
- Validação de mensagens entre scripts
- Testes de permissões e segurança

#### 📋 Tarefas

##### 5.1 Background.js - Service Worker Tests
```javascript
// test/unit/background.test.js - CRIAR
describe('Medical Background Script', () => {
  describe('Message Handling', () => {
    test('should validate SIGSS origin messages', async () => {
      const mockSender = {
        tab: { url: 'https://sigss.example.com/regulacao' }
      };
      const mockMessage = {
        action: 'UPDATE_REGULATION',
        data: { reguId: 'REG_12345' }
      };

      const handler = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const response = await handler(mockMessage, mockSender);

      expect(response.success).toBe(true);
    });

    test('should reject non-SIGSS origin messages', async () => {
      const mockSender = {
        tab: { url: 'https://malicious-site.com' }
      };
      const mockMessage = {
        action: 'UPDATE_REGULATION',
        data: { reguId: 'REG_12345' }
      };

      const handler = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const response = await handler(mockMessage, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid origin');
    });
  });

  describe('URL Configuration Manager', () => {
    test('should validate SIGSS domains correctly', () => {
      const manager = new URLConfigurationManager();

      expect(manager.isValidSIGSSDomain('https://sigss.hospital.com.br')).toBe(true);
      expect(manager.isValidSIGSSDomain('https://malicious.com')).toBe(false);
    });
  });
});
```

#### 📊 Métricas Semana 5
- ✅ Background.js: 75% cobertura
- ✅ Security validation: 100% cobertura

### 📊 Semana 6: Timeline e Section Managers

#### 🎯 Objetivos
- Testes de gestão de timeline médica
- Validação de normalização de dados
- Testes de performance

#### 📋 Tarefas

##### 6.1 TimelineManager.js - Testes Médicos
```javascript
// test/unit/TimelineManager.test.js - CRIAR
describe('Medical Timeline Manager', () => {
  describe('Data Normalization', () => {
    test('should normalize SIGSS timeline data correctly', () => {
      const rawTimelineData = {
        consultas: [/* dados brutos SIGSS */],
        exames: [/* dados brutos SIGSS */],
        regulacoes: [/* dados brutos SIGSS */]
      };

      const normalized = TimelineManager.normalizeTimelineData(rawTimelineData);

      expect(normalized).toHaveProperty('consultas');
      expect(normalized.consultas[0]).toHaveProperty('data');
      expect(normalized.consultas[0]).toHaveProperty('especialidade');
      expect(normalized.consultas[0]).not.toHaveProperty('cpf'); // Dados sensíveis removidos
    });
  });

  describe('Timeline Filtering', () => {
    test('should filter timeline by date range', () => {
      const timeline = [
        { data: '2024-01-15', tipo: 'consulta' },
        { data: '2024-06-20', tipo: 'exame' },
        { data: '2024-12-10', tipo: 'regulacao' }
      ];

      const filtered = TimelineManager.filterByDateRange(
        timeline,
        '2024-01-01',
        '2024-06-30'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(item => item.data)).toEqual(['2024-01-15', '2024-06-20']);
    });
  });
});
```

##### 6.2 SectionManager.js - Testes de Seções
```javascript
// test/unit/SectionManager.test.js - CRIAR
describe('Medical Section Manager', () => {
  describe('Section Rendering', () => {
    test('should render medical sections with proper data', () => {
      const sectionData = {
        consultas: [
          { data: '2024-01-15', especialidade: 'Cardiologia' },
          { data: '2024-02-20', especialidade: 'Neurologia' }
        ]
      };

      const section = new SectionManager('consultas', config);
      section.render(sectionData.consultas);

      expect(document.querySelectorAll('.section-item')).toHaveLength(2);
      expect(document.querySelector('.section-item')).toHaveTextContent('Cardiologia');
    });
  });

  describe('Sorting and Filtering', () => {
    test('should sort medical data by date descending', () => {
      const data = [
        { data: '2024-01-15' },
        { data: '2024-03-20' },
        { data: '2024-02-10' }
      ];

      const sorted = SectionManager.sortByDate(data, 'desc');

      expect(sorted.map(item => item.data)).toEqual([
        '2024-03-20', '2024-02-10', '2024-01-15'
      ]);
    });
  });
});
```

#### 📊 Métricas Semana 6
- ✅ TimelineManager.js: 80% cobertura
- ✅ SectionManager.js: 75% cobertura

### 🔍 Semana 7: Content Script e Field Configuration

#### 🎯 Objetivos
- Testes de content script
- Validação de field configuration
- Testes de injeção SIGSS

#### 📋 Tarefas

##### 7.1 Content-Script.js - Testes de Injeção
```javascript
// test/unit/content-script.test.js - CRIAR
describe('SIGSS Content Script', () => {
  beforeEach(() => {
    // Simular página SIGSS
    document.body.innerHTML = `
      <div id="tabs-manutencao" aria-expanded="true">
        <input id="regu.reguPK.idp" value="IDP_123">
        <input id="regu.reguPK.ids" value="IDS_456">
      </div>
    `;
  });

  describe('Regulation Detection', () => {
    test('should detect maintenance tab opening', () => {
      const sendMessageSpy = jest.spyOn(chrome.runtime, 'sendMessage');

      // Simular detecção
      checkMaintenanceTab();

      expect(sendMessageSpy).toHaveBeenCalledWith({
        action: 'REGULATION_DETECTED',
        data: {
          reguIdp: 'IDP_123',
          reguIds: 'IDS_456'
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing regulation elements gracefully', () => {
      document.body.innerHTML = '<div></div>'; // Sem elementos de regulação

      expect(() => checkMaintenanceTab()).not.toThrow();
    });
  });
});
```

##### 7.2 Field-Config.js - Testes de Configuração
```javascript
// test/unit/field-config.test.js - CRIAR
describe('Medical Field Configuration', () => {
  describe('Field Mapping', () => {
    test('should map SIGSS fields to display fields correctly', () => {
      const sigssData = {
        entidadeFisica: {
          entidade: { entiNome: 'João Silva' }
        }
      };

      const field = defaultFieldConfig.find(f => f.id === 'nome');
      const value = field.key(sigssData);

      expect(value).toBe('João Silva');
    });

    test('should handle missing nested properties', () => {
      const incompleteData = {}; // Dados incompletos

      const field = defaultFieldConfig.find(f => f.id === 'nome');
      const value = field.key(incompleteData);

      expect(value).toBe('');
    });
  });

  describe('CADSUS Integration', () => {
    test('should map CADSUS array indices correctly', () => {
      const cadsusData = [
        'VALOR_0', 'JOÃO SILVA', 'VALOR_2', /* ... mais valores ... */
      ];

      const nomeField = defaultFieldConfig.find(f => f.id === 'nome');
      expect(nomeField.cadsusKey).toBe(1);

      const value = cadsusData[nomeField.cadsusKey];
      expect(value).toBe('JOÃO SILVA');
    });
  });
});
```

#### 📊 Métricas Semana 7
- ✅ Content-Script.js: 70% cobertura
- ✅ Field-Config.js: 85% cobertura

---

## 🏁 FASE 3: REFINAMENTO E EXCELÊNCIA (3 semanas)

### 🔍 Semana 8: Testes de Integração E2E

#### 🎯 Objetivos
- Testes end-to-end médicos
- Validação de fluxos completos
- Performance testing

#### 📋 Tarefas

##### 8.1 Integration Tests - Fluxos Médicos Completos
```javascript
// test/integration/medical-workflow.test.js - CRIAR
describe('Complete Medical Workflow Integration', () => {
  test('should complete patient search to regulation flow', async () => {
    // 1. Setup mocks
    jest.spyOn(API, 'searchPatients').mockResolvedValue([
      { nome: 'PACIENTE_***', isenPK: 'TEST_123' }
    ]);

    jest.spyOn(API, 'fetchVisualizaUsuario').mockResolvedValue({
      isenFullPKCrypto: 'CRYPTO_TOKEN_123'
    });

    jest.spyOn(API, 'fetchAllTimelineData').mockResolvedValue({
      consultas: [/* dados mock */],
      exames: [/* dados mock */],
      regulacoes: [/* dados mock */]
    });

    // 2. Execute complete flow
    const searchResults = await API.searchPatients('João');
    const patient = searchResults[0];

    await selectPatient(patient);

    const userDetails = await API.fetchVisualizaUsuario(patient.isenPK);
    const timeline = await API.fetchAllTimelineData(userDetails.isenFullPKCrypto);

    // 3. Validate end state
    expect(store.getState().currentPatient).toBeTruthy();
    expect(store.getState().currentPatient.timeline).toBeTruthy();
    expect(document.querySelector('#patient-info')).toHaveTextContent('PACIENTE_***');
  });
});
```

##### 8.2 Performance Tests
```javascript
// test/integration/performance.test.js - CRIAR
describe('Medical Extension Performance', () => {
  test('should load patient timeline within acceptable time', async () => {
    const startTime = Date.now();

    const mockPatient = { isenPK: 'TEST_123' };
    await selectPatient(mockPatient, true); // forceRefresh

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(2000); // Menos de 2 segundos
  });

  test('should handle large timeline datasets efficiently', async () => {
    const largeTimeline = Array(1000).fill().map((_, i) => ({
      data: `2024-01-${i % 31 + 1}`,
      tipo: 'consulta',
      especialidade: `Especialidade ${i}`
    }));

    const startTime = Date.now();

    const normalized = TimelineManager.normalizeTimelineData({
      consultas: largeTimeline,
      exames: [],
      regulacoes: []
    });

    const endTime = Date.now();
    const processTime = endTime - startTime;

    expect(processTime).toBeLessThan(500); // Menos de 0.5 segundos
    expect(normalized.consultas).toHaveLength(1000);
  });
});
```

#### 📊 Métricas Semana 8
- ✅ Integration tests: 15 cenários cobertos
- ✅ Performance benchmarks: ✅ Estabelecidos

### 🔒 Semana 9: Testes de Segurança Avançados

#### 🎯 Objetivos
- Testes de segurança médica avançados
- Validação de compliance LGPD/GDPR
- Testes de vulnerabilidades

#### 📋 Tarefas

##### 9.1 Advanced Security Tests
```javascript
// test/security/medical-compliance.test.js - CRIAR
describe('Medical Data Compliance', () => {
  describe('LGPD Compliance', () => {
    test('should never persist sensitive data beyond session', async () => {
      const sensitiveData = {
        cpf: '123.456.789-00',
        nome: 'João Silva',
        isenPK: 'TEST_123'
      };

      // Simular carregamento de paciente
      await selectPatient(sensitiveData);

      // Verificar que dados sensíveis não estão no localStorage
      const localStorage = await chrome.storage.local.get();
      const serialized = JSON.stringify(localStorage);

      expect(serialized).not.toContain('123.456.789-00');
      expect(serialized).not.toContain('João Silva');
    });

    test('should clear sensitive data on extension unload', () => {
      const clearSpy = jest.spyOn(chrome.storage.session, 'clear');

      // Simular unload da extensão
      window.dispatchEvent(new Event('beforeunload'));

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize HTML content in patient data', () => {
      const maliciousData = {
        nome: '<script>alert("XSS")</script>João Silva',
        observacoes: '<img src="x" onerror="alert(1)">'
      };

      const sanitized = sanitizeForDisplay(maliciousData);

      expect(sanitized.nome).not.toContain('<script>');
      expect(sanitized.observacoes).not.toContain('onerror');
    });
  });
});
```

##### 9.2 API Security Tests
```javascript
// test/security/api-security.test.js - CRIAR
describe('API Security', () => {
  describe('SIGSS API Protection', () => {
    test('should validate SIGSS origin before API calls', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      // Tentar API call de origem não válida
      global.location = { origin: 'https://malicious.com' };

      try {
        await API.fetchRegulationDetails('REG_123');
      } catch (error) {
        expect(error.message).toContain('Invalid origin');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API call from invalid origin')
      );
    });

    test('should rate limit API calls', async () => {
      const rateLimiter = new RateLimiter(5, 1000); // 5 calls per second

      // Fazer 6 chamadas rápidas
      const promises = Array(6).fill().map(() =>
        rateLimiter.checkTab(123)
      );

      const results = await Promise.all(promises);
      const blocked = results.filter(r => !r.allowed);

      expect(blocked).toHaveLength(1); // Última chamada bloqueada
    });
  });
});
```

#### 📊 Métricas Semana 9
- ✅ Security tests: 100% compliance scenarios
- ✅ XSS/CSRF prevention: ✅ Validado

### 🏆 Semana 10: Otimização e Finalização

#### 🎯 Objetivos
- Otimização de performance dos testes
- Documentação completa
- Estabelecimento de métricas de qualidade

#### 📋 Tarefas

##### 10.1 Test Performance Optimization
```javascript
// test/utils/test-performance.js - CRIAR
export class TestOptimizer {
  static async setupFastMocks() {
    // Mocks otimizados para velocidade
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('sigss')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(getMockSigssResponse(url))
        });
      }
      return Promise.reject(new Error('Unmocked URL'));
    });
  }

  static measureTestPerformance(testSuite) {
    const startTime = Date.now();

    return {
      end: () => {
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          console.warn(`Slow test suite: ${testSuite} took ${duration}ms`);
        }
        return duration;
      }
    };
  }
}
```

##### 10.2 Quality Gates Implementation
```javascript
// test/quality-gates.js - CRIAR
export const qualityGates = {
  coverage: {
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80
  },

  performance: {
    maxTestDuration: 30000, // 30 segundos
    maxSingleTestDuration: 5000, // 5 segundos
    maxMemoryUsage: 512 * 1024 * 1024 // 512MB
  },

  medical: {
    sensitiveDataLeaks: 0, // Zero tolerance
    securityVulnerabilities: 0,
    complianceViolations: 0
  }
};
```

##### 10.3 Documentation and Reporting
```markdown
// docs/TESTING_GUIDELINES.md - CRIAR
# 🧪 Medical Extension Testing Guidelines

## 🏥 Medical Testing Principles

1. **Zero Sensitive Data**: Never use real patient data in tests
2. **Sanitization First**: All test data must be sanitized
3. **Compliance Validation**: Every test must validate LGPD compliance
4. **Security by Default**: Assume all inputs are malicious

## 🚀 Running Tests

```bash
# Full test suite
npm run test

# Medical compliance only
npm run test:medical

# Performance benchmarks
npm run test:performance

# Security validation
npm run test:security
```
```

#### 📊 Métricas Semana 10
- ✅ All quality gates: ✅ Passing
- ✅ Documentation: ✅ Complete
- ✅ CI/CD integration: ✅ Optimized

---

## 📊 MÉTRICAS FINAIS ESPERADAS

### 🎯 Cobertura de Código

```
GLOBAL COVERAGE TARGET: 85%+
├── Statements: 85%+
├── Branches: 75%+
├── Functions: 90%+
└── Lines: 85%+

CRITICAL MODULES:
├── api.js: 90%+
├── ErrorHandler.js: 95%+
├── sidebar.js: 80%+
├── background.js: 85%+
├── TimelineManager.js: 85%+
└── SectionManager.js: 80%+
```

### 🏥 Métricas Médicas Específicas

```
MEDICAL COMPLIANCE: 100%
├── Sensitive data leaks: 0
├── Security vulnerabilities: 0
├── LGPD violations: 0
└── XSS/CSRF vulnerabilities: 0

PERFORMANCE BENCHMARKS:
├── Patient search: <1s
├── Timeline load: <2s
├── Section render: <500ms
└── API response: <3s
```

### 🧪 Suíte de Testes

```
TOTAL TESTS: 200+
├── Unit tests: 150+
├── Integration tests: 30+
├── Security tests: 15+
└── Performance tests: 10+

TEST CATEGORIES:
├── Medical APIs: 45 tests
├── UI Components: 40 tests
├── Security/Compliance: 35 tests
├── Data Processing: 30 tests
├── Browser Extension: 25 tests
└── Performance: 25 tests
```

---

## 🔧 FERRAMENTAS E CONFIGURAÇÃO

### 📦 Dependências Adicionais

```bash
# Testing utilities
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev puppeteer-core
npm install --save-dev lighthouse

# Medical testing helpers
npm install --save-dev medical-data-sanitizer
npm install --save-dev hipaa-compliance-validator
```

### ⚙️ Jest Configuration Update

```javascript
// config/jest/jest.unit.cjs - UPDATE
module.exports = {
  // Existing config...

  // Medical testing specific
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.js',
    '<rootDir>/test/medical-setup.js' // NOVO
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './api.js': {
      branches: 80,
      functions: 95,
      lines: 90,
      statements: 90
    },
    './ErrorHandler.js': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },

  // Performance monitoring
  maxWorkers: '50%',
  testTimeout: 30000,

  // Medical compliance reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/unit',
      filename: 'unit-test-report.html',
      pageTitle: 'Medical Extension Unit Tests'
    }],
    ['./test/reporters/medical-compliance-reporter.js']
  ]
};
```

---

## 📅 CRONOGRAMA RESUMIDO

| Fase | Duração | Foco Principal | Cobertura Meta | Status |
|------|---------|----------------|----------------|--------|
| **Fase 1** | 3 semanas | Estabilização + Core | 50% | 🔄 Planejado |
| **Fase 2** | 4 semanas | Módulos Críticos | 70% | ⏳ Aguardando |
| **Fase 3** | 3 semanas | Refinamento + E2E | 85%+ | ⏳ Aguardando |

**Total:** 10 semanas (2,5 meses)
**Esforço:** ~80-100 horas
**ROI:** Redução drástica de bugs em produção, compliance garantido

---

## 🚨 RISCOS E MITIGAÇÕES

### ⚠️ Riscos Identificados

1. **Dados Médicos Reais em Testes**
   - **Risco:** Vazamento acidental de dados sensíveis
   - **Mitigação:** Mocks obrigatórios + validação automática

2. **Performance de Testes**
   - **Risco:** Testes lentos atrasam desenvolvimento
   - **Mitigação:** Otimização contínua + paralelização

3. **Manutenção de Mocks**
   - **Risco:** Mocks desatualizados com APIs SIGSS
   - **Mitigação:** Validação periódica + versionamento

### 🛠️ Estratégias de Mitigação

```javascript
// Validação automática de dados sensíveis
beforeEach(() => {
  const sensitiveDataChecker = new SensitiveDataChecker();
  sensitiveDataChecker.scanTestEnvironment();
});

// Performance monitoring
afterEach(() => {
  if (performance.now() > 5000) {
    throw new Error('Test too slow - optimize or split');
  }
});
```

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### 📋 Ações Urgentes (Esta Semana)

1. **Corrigir testes instáveis**
   ```bash
   npm run test:unit --detectOpenHandles
   # Identificar e corrigir memory leaks no store.js
   ```

2. **Melhorar mocks médicos**
   ```bash
   # Expandir test/mocks/medical-apis.js
   # Adicionar dados sanitizados mais realistas
   ```

3. **Setup CI/CD robusto**
   ```bash
   # Configurar GitHub Actions para rodar todos os testes
   # Adicionar quality gates obrigatórios
   ```

### 📊 Relatórios de Acompanhamento

- **Semanal:** Relatório de cobertura + métricas
- **Mensal:** Análise de qualidade + compliance
- **Release:** Validação completa + auditoria de segurança

---

**Este plano garante que a extensão médica terá a qualidade e segurança necessárias para lidar com dados sensíveis de pacientes, cumprindo todas as normas de compliance e oferecendo uma base sólida para futuras evoluções.**
