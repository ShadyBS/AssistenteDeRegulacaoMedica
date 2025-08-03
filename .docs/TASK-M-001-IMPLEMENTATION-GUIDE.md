# 🏗️ TASK-M-001: Refatorar Store Pattern Para Better Memory Management

## 📋 ANÁLISE E PLANEJAMENTO COMPLETO

**Data de Criação:** 03 de Agosto de 2025
**Responsável:** AI Agent
**Prioridade:** Média (Semana 2)
**Estimativa:** 4 dias (32 horas)
**Impacto:** Fundacional - Base para múltiplas outras tasks

> ⚠️ **ATUALIZAÇÃO CRÍTICA**: Durante análise do código, identificado que `FilterManager` e `AutomationManager` NÃO existem atualmente. O plano foi ajustado para implementação progressiva com fallbacks e integração com sistema atual.

---

## 🏥 CONTEXTO MÉDICO ESSENCIAL

### **Fluxo Médico Atual (DEVE SER PRESERVADO)**

O comportamento atual da extensão segue uma lógica médica bem definida:

1. **Nova Análise = Filtros Padrão**:

   - Cada troca de paciente representa uma nova análise médica independente
   - Filtros são automaticamente resetados para a configuração padrão do usuário
   - Isso evita "vazamento" de critérios entre análises diferentes

2. **Configurações Personalizadas**:

   - Usuário define seus filtros padrão em `options.html`
   - Sistema de filtros salvos permite reutilização de conjuntos específicos
   - Automação pode aplicar regras predefinidas quando habilitada

3. **Distinção de Origem**:
   - **Busca Manual**: Regulador digita nome/CPF → vai para lista de recentes
   - **Detecção Automática**: Sistema detecta mudança de página → não vai para recentes

### **Dados Sensíveis vs Seguros**

```javascript
// ❌ DADOS SENSÍVEIS - NUNCA PERSISTIR
const SENSITIVE_DATA = [
  'currentPatient.ficha.cpf',
  'currentPatient.ficha.cns',
  'currentPatient.cadsus.nomeMae',
  'currentPatient.timeline',
  'regulationDetails',
  'analysisState',
];

// ✅ DADOS SEGUROS - PODEM PERSISTIR
const SAFE_DATA = [
  'recentPatients[].id', // ID não-criptográfico
  'recentPatients[].nome', // Nome (necessário para UX)
  'recentPatients[].searchedAt', // Timestamp
  'savedFilterSets', // Filtros salvos pelo usuário
  'userPreferences', // Configurações da extensão
  'automationRules', // Regras de automação
];
```

---

## 🎯 OBJETIVO PRINCIPAL

Refatorar o sistema de store atual (`store.js`) para melhorar o gerenciamento de memória, eliminar memory leaks de listeners e implementar persistência médica consciente que **preserva o fluxo médico atual** de "nova análise de paciente = filtros resetados para padrão do usuário", estabelecendo uma base sólida para features futuras mantendo a simplicidade do código.

---

## 📊 ANÁLISE DA IMPLEMENTAÇÃO ATUAL

### ✅ Pontos Fortes Identificados

1. **Simplicidade Elegante**: Store atual usa padrão publish-subscribe simples e eficaz
2. **API Clara**: Métodos bem definidos (`subscribe`, `setPatient`, `getState`, etc.)
3. **Unsubscribe Function**: Já retorna função de cleanup no `subscribe()`
4. **Error Handling**: Uso do `ErrorHandler.js` para capturar erros em listeners
5. **Imutabilidade Parcial**: `getState()` retorna cópias dos objetos (shallow copy)
6. **Modularidade**: Bem separado em módulo ES6

### ⚠️ Problemas Identificados

1. **Memory Leaks Potenciais**:

   - Array `listeners[]` pode acumular referências órfãs
   - Sem limpeza automática de listeners inativos
   - Não há detecção de listeners "mortos"

2. **Gestão de Estado**:

   - Sem estratégia de limpeza de dados antigos
   - Estado pode crescer indefinidamente
   - Falta controle de tamanho de `recentPatients`

3. **Debugging e Monitoramento**:

   - Sem ferramentas para debug do store
   - Não há métricas de performance
   - Difícil rastrear vazamentos de memória

4. **Escalabilidade e Fluxo Médico**:
   - Pattern atual não suporta facilmente novas features
   - Sem separação por domínio (patients vs filters vs config)
   - Falta persistence strategies médicas conscientes
   - Não distingue entre dados persistentes vs dados de sessão médica

### 🔍 Análise de Uso Atual

**Locais que usam store.subscribe():**

- `ui/search.js` (linha 151) - atualização de pacientes recentes
- `ui/patient-card.js` (linha 163) - mudanças de paciente
- `TimelineManager.js` (linha 32) - gestão de timeline
- `SectionManager.js` (linha 62) - gestão de seções

**Padrão de Uso Detectado:**

```javascript
// Pattern atual (sem cleanup adequado)
store.subscribe(() => {
  // logic here
});

// Pattern desejado (com cleanup)
const unsubscribe = store.subscribe(() => {
  // logic here
});
// ... posteriormente ...
unsubscribe();
```

**Comportamento Médico Atual (PRESERVAR):**

```javascript
// Sequência atual na troca de paciente
function selectPatient(newPatient) {
  store.clearPatient(); // Limpa paciente anterior
  // ⚠️ FALTANDO: Reset de filtros para padrão do usuário
  store.setPatient(newPatient); // Carrega novo paciente
  store.addRecentPatient(newPatient); // Adiciona aos recentes
}

// Sequência desejada (com fluxo médico correto)
function selectPatient(newPatient) {
  store.changePatient(newPatient, 'manual'); // Método integrado
  // ✅ Inclui: clear + reset filtros + load + adicionar recentes
}
```

---

## 🛠️ ESTRATÉGIA DE IMPLEMENTAÇÃO

### Princípio #1: **NÃO COMPLICAR DESNECESSARIAMENTE**

A implementação atual é **fundamentalmente boa**. O objetivo é **melhorar**, não reescrever. Vamos:

- ✅ Manter a API atual intacta (backward compatibility)
- ✅ Adicionar features incrementalmente
- ✅ Preservar a simplicidade do código
- ❌ NÃO implementar frameworks complexos
- ❌ NÃO quebrar o código existente

### Princípio #2: **Foco nos Problemas Reais**

Baseado na auditoria, os problemas são:

1. **Memory leaks** - prioridade alta
2. **Falta de cleanup** - prioridade alta
3. **Debugging tools** - prioridade média
4. **State persistence médica** - prioridade baixa mas crítica para compliance

### Princípio #3: **Implementação Progressiva e Realista**

Como `FilterManager` e `AutomationManager` **não existem atualmente**:

- ✅ **Implementar store melhorado** primeiro (Fases 1-2)
- ✅ **Criar abstrações mínimas** para filtros e automação (Fase 3)
- ✅ **Fallbacks inteligentes** quando managers não existem
- ✅ **Integração gradual** com sistema atual em `sidebar.js`
- ❌ **NÃO bloquear implementação** por dependências inexistentes

---

## 📝 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Memory Management (Dia 1-2) 🔴 CRÍTICO

#### 1.1: Implementar WeakMap para Listeners Registry

**Problema**: Array `listeners[]` mantém referências que podem vazar memória.

**Solução**: Usar `WeakMap` para tracking automático + identificação única.

```javascript
// ANTES (atual)
const listeners = [];

export const store = {
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};

// DEPOIS (melhorado)
const listeners = new Set(); // Para performance O(1) em add/remove
const listenerMetadata = new WeakMap(); // Para tracking automático

let nextListenerId = 1;

export const store = {
  subscribe(listener, options = {}) {
    const listenerId = nextListenerId++;
    const metadata = {
      id: listenerId,
      createdAt: Date.now(),
      component: options.component || 'unknown',
      description: options.description || '',
    };

    listeners.add(listener);
    listenerMetadata.set(listener, metadata);

    // Retorna enhanced unsubscribe function
    return () => {
      listeners.delete(listener);
      listenerMetadata.delete(listener);

      // Debug logging se em dev mode
      if (store._debugMode) {
        console.log(`[Store] Unsubscribed listener ${metadata.id} from ${metadata.component}`);
      }
    };
  },
};
```

#### 1.2: Adicionar Auto-Cleanup de Listeners Órfãos

**Problema**: Listeners podem "morrer" sem fazer unsubscribe adequado.

**Solução**: Detecção automática de listeners órfãos + cleanup.

```javascript
// Método para detectar e limpar listeners órfãos
_cleanupOrphanedListeners() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutos

  for (const listener of listeners) {
    const metadata = listenerMetadata.get(listener);
    if (metadata && (now - metadata.createdAt) > maxAge) {
      // Verificar se listener ainda é válido
      try {
        // Tentar executar listener com estado vazio para testar
        listener.call(null);
      } catch (error) {
        // Se erro, remove listener órfão
        listeners.delete(listener);
        listenerMetadata.delete(listener);

        if (this._debugMode) {
          console.warn(`[Store] Removed orphaned listener ${metadata.id}`);
        }
      }
    }
  }
}
```

#### 1.3: Implementar método clearOldData() para State Cleanup

**Problema**: Estado pode crescer indefinidamente.

**Solução**: Limpeza inteligente de dados antigos.

```javascript
// Novo método para limpeza de estado
clearOldData(options = {}) {
  const {
    maxRecentPatients = 50,
    maxFilterSets = 20,
    clearCurrentPatient = false,
    clearAllData = false
  } = options;

  if (clearAllData) {
    state.currentPatient.ficha = null;
    state.currentPatient.cadsus = null;
    state.currentPatient.lastCadsusCheck = null;
    state.currentPatient.isUpdating = false;
    state.recentPatients = [];
    state.savedFilterSets = {};
    this._notify();
    return;
  }

  // Limpar paciente atual se solicitado
  if (clearCurrentPatient) {
    this.clearPatient();
  }

  // Limpar pacientes recentes excessivos
  if (state.recentPatients.length > maxRecentPatients) {
    state.recentPatients = state.recentPatients.slice(0, maxRecentPatients);
  }

  // Limpar filtros salvos excessivos
  const filterKeys = Object.keys(state.savedFilterSets);
  if (filterKeys.length > maxFilterSets) {
    const toKeep = filterKeys.slice(0, maxFilterSets);
    const newFilterSets = {};
    toKeep.forEach(key => {
      newFilterSets[key] = state.savedFilterSets[key];
    });
    state.savedFilterSets = newFilterSets;
  }

  this._notify();

  if (this._debugMode) {
    console.log('[Store] Old data cleared', {
      recentPatientsCount: state.recentPatients.length,
      filterSetsCount: Object.keys(state.savedFilterSets).length
    });
  }
}
```

### FASE 2: Debug e Monitoring Tools (Dia 2-3) 🟡 IMPORTANTE

#### 2.1: Implementar Debug Mode para Store Monitoring

```javascript
// Adicionar ao store object
_debugMode: false,
_stats: {
  notificationCount: 0,
  listenerCount: 0,
  lastNotification: null,
  memoryUsage: {}
},

// Toggle debug mode
enableDebug(enable = true) {
  this._debugMode = enable;
  if (enable) {
    console.log('[Store] Debug mode enabled');
    this._logCurrentState();
  }
},

// Log estado atual
_logCurrentState() {
  const state = this.getState();
  const stats = {
    listenersCount: listeners.size,
    stateSize: JSON.stringify(state).length,
    recentPatientsCount: state.recentPatients.length,
    filterSetsCount: Object.keys(state.savedFilterSets).length,
    currentPatientLoaded: !!state.currentPatient.ficha
  };

  console.log('[Store] Current state:', stats);
  return stats;
},

// Método para obter estatísticas
getDebugInfo() {
  return {
    ...this._stats,
    listenersCount: listeners.size,
    debugMode: this._debugMode,
    stateSnapshot: this.getState()
  };
}
```

#### 2.2: Implementar Memory Usage Tracking

```javascript
// Adicionar tracking de uso de memória
_updateMemoryStats() {
  if (performance.memory) {
    this._stats.memoryUsage = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      timestamp: Date.now()
    };
  }
},

// Override _notify para tracking
_notify() {
  this._stats.notificationCount++;
  this._stats.lastNotification = Date.now();
  this._stats.listenerCount = listeners.size;

  if (this._debugMode) {
    this._updateMemoryStats();
    console.log(`[Store] Notifying ${listeners.size} listeners (notification #${this._stats.notificationCount})`);
  }

  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      logError('STORE_LISTENER', 'Erro num listener do store', {
        errorMessage: error.message,
        listenerMetadata: listenerMetadata.get(listener)
      });
    }
  }

  // Auto-cleanup a cada 100 notificações
  if (this._stats.notificationCount % 100 === 0) {
    this._cleanupOrphanedListeners();
  }
}
```

### FASE 3: State Persistence Strategies (Dia 3-4) 🟢 ENHANCEMENT

#### 3.1: Implementar Persistence Médica Consciente

**Problema**: Estado atual não distingue entre dados que devem persistir entre sessões vs dados de análise atual.

**Solução**: Persistence strategy que respeita o fluxo médico de "nova análise = filtros padrão".

```javascript
// Definir quais dados são persistentes
const PERSISTENT_DATA = {
  recentPatients: true,        // Lista de pacientes buscados manualmente
  savedFilterSets: true,       // Conjuntos de filtros salvos pelo usuário
  userPreferences: true,       // Configurações da extensão
  automationRules: true        // Regras de automação configuradas
};

const SESSION_ONLY_DATA = {
  currentPatient: false,       // Dados médicos atuais (NUNCA persiste)
  currentFilters: false,       // Filtros da análise atual (reset para padrão)
  timeline: false,             // Timeline atual (dados sensíveis)
  analysisState: false         // Estado da análise em andamento
};

// Métodos de persistência conscientes do fluxo médico
async saveToStorage(keys = null) {
  try {
    // Se não especificado, salvar apenas dados persistentes permitidos
    const defaultPersistentKeys = Object.keys(PERSISTENT_DATA).filter(
      key => PERSISTENT_DATA[key]
    );

    const keysToSave = keys || defaultPersistentKeys;

    // Filtrar apenas chaves permitidas para persistência
    const allowedKeys = keysToSave.filter(key => PERSISTENT_DATA[key]);

    if (allowedKeys.length === 0) {
      if (this._debugMode) {
        console.log('[Store] Nenhuma chave persistente para salvar');
      }
      return;
    }

    const api = typeof browser !== 'undefined' ? browser : chrome;
    const dataToSave = {};

    allowedKeys.forEach(key => {
      if (state[key] !== undefined) {
        dataToSave[key] = state[key];
      }
    });

    await api.storage.local.set(dataToSave);

    if (this._debugMode) {
      console.log('[Store] Dados médicos persistidos (sem estado de análise):', Object.keys(dataToSave));
    }
  } catch (error) {
    logError('STORE_PERSISTENCE', 'Erro ao salvar no storage', {
      errorMessage: error.message,
      keys: keys || 'default'
    });
  }
},

async loadFromStorage() {
  try {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    const persistentKeys = Object.keys(PERSISTENT_DATA).filter(
      key => PERSISTENT_DATA[key]
    );

    const data = await api.storage.local.get(persistentKeys);

    let hasChanges = false;
    persistentKeys.forEach(key => {
      if (data[key] !== undefined) {
        state[key] = data[key];
        hasChanges = true;
      }
    });

    // ✅ IMPORTANTE: NÃO carregar currentPatient ou currentFilters
    // Nova sessão = nova análise com filtros padrão do usuário

    if (hasChanges) {
      this._notify();
    }

    if (this._debugMode) {
      console.log('[Store] Dados persistentes carregados (análise resetada):', Object.keys(data));
    }

    return data;
  } catch (error) {
    logError('STORE_PERSISTENCE', 'Erro ao carregar do storage', {
      errorMessage: error.message
    });
    return {};
  }
}
```

#### 3.2: Implementar clearPatient() Médico Consciente

**Problema**: clearPatient atual não considera o fluxo médico de reset de filtros.

**Solução**: Método que integra limpeza de paciente + reset de filtros para nova análise.

```javascript
// Método clearPatient atualizado para fluxo médico
clearPatient(options = {}) {
  const {
    resetFiltersToDefault = true,  // ✅ Por padrão reseta filtros para nova análise
    keepTimeline = false,
    keepForSeconds = 0,
    reason = 'patient_change',
    notifyListeners = true
  } = options;

  if (this._debugMode) {
    console.log(`[Store] Clearing patient data (reason: ${reason})`);
  }

  // Limpeza imediata de dados sensíveis
  state.currentPatient.ficha = null;
  state.currentPatient.cadsus = null;
  state.currentPatient.lastCadsusCheck = null;
  state.currentPatient.isUpdating = false;

  // Timeline: manter temporariamente se solicitado (para UX suave)
  if (keepTimeline && keepForSeconds > 0) {
    setTimeout(() => {
      state.currentPatient.timeline = null;
      if (notifyListeners) this._notify();
    }, keepForSeconds * 1000);
  } else {
    state.currentPatient.timeline = null;
  }

  // ✅ CRUCIAL: Reset filtros para nova análise médica
  if (resetFiltersToDefault) {
    // ⚠️ IMPLEMENTAÇÃO ATUAL: Trabalhar com sistema existente
    // TODO: Implementar resetToDefault() ou integrar com sidebar.js
    if (typeof window !== 'undefined') {
      // Opção 1: Criar FilterManager simples
      if (window.FilterManager?.resetToDefault) {
        window.FilterManager.resetToDefault();
      } else {
        // Opção 2: Integrar com sistema atual (sidebar.js)
        if (typeof window.resetFiltersToDefault === 'function') {
          window.resetFiltersToDefault();
        }
      }
    }
  }

  // Nunca persiste dados do paciente atual
  // (dados sensíveis permanecem apenas em memória da sessão)

  if (notifyListeners) {
    this._notify();
  }
},

// Novo método específico para mudança de paciente
async changePatient(newPatientData, source = 'manual') {
  if (this._debugMode) {
    console.log(`[Store] Changing patient (source: ${source}):`, newPatientData.nome || 'Unknown');
  }

  // 1. Limpar análise anterior (incluindo filtros)
  this.clearPatient({
    resetFiltersToDefault: true,
    reason: 'new_patient_analysis'
  });

  // 2. Carregar novo paciente
  this.setPatient(newPatientData.ficha, newPatientData.cadsus);

  // 3. Adicionar aos recentes SE foi busca manual
  if (source === 'manual') {
    this.addRecentPatient(newPatientData);
    this._autoSave(['recentPatients']); // ✅ Persiste apenas lista
  }

  // 4. Aplicar automação SE configurada
  if (typeof window !== 'undefined') {
    // ⚠️ IMPLEMENTAÇÃO ATUAL: Sistema de automação pode não existir ainda
    if (window.AutomationManager?.isEnabled && window.AutomationManager.isEnabled()) {
      await window.AutomationManager.applyRules();
    } else if (typeof window.applyAutomationRules === 'function') {
      // Integração com sistema atual se existir
      await window.applyAutomationRules();
    }
    // Se não existe automação, continua normalmente (não é crítico)
  }

  if (this._debugMode) {
    console.log('[Store] Nova análise de paciente iniciada');
  }
}
```

#### 3.4: Implementação Progressiva de Managers (OPCIONAL)

**Problema**: `FilterManager` e `AutomationManager` não existem no código atual.

**Solução**: Criar implementações mínimas ou integrar com sistema existente.

```javascript
// Opção A: FilterManager mínimo (se necessário)
window.FilterManager = window.FilterManager || {
  resetToDefault() {
    // Integrar com sistema atual em sidebar.js
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    const defaultFilters = userPreferences.defaultFilters || {};

    // Aplicar filtros padrão do usuário
    Object.keys(defaultFilters).forEach((filterId) => {
      const element = document.getElementById(filterId);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = defaultFilters[filterId];
        } else {
          element.value = defaultFilters[filterId];
        }
      }
    });

    console.log('[FilterManager] Filtros resetados para configuração padrão do usuário');
  },
};

// Opção B: AutomationManager mínimo (se necessário)
window.AutomationManager = window.AutomationManager || {
  isEnabled() {
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    return userPreferences.automationEnabled || false;
  },

  async applyRules() {
    // Integrar com sistema de automação existente se houver
    if (typeof window.applyAutomationRules === 'function') {
      await window.applyAutomationRules();
    } else {
      console.log('[AutomationManager] Nenhuma regra de automação configurada');
    }
  },
};

// Opção C: Integração direta (PREFERIDA)
// Trabalhar diretamente com funções existentes em sidebar.js
function resetFiltersToUserDefault() {
  try {
    // Buscar configuração padrão do usuário
    const userPreferences = getUserPreferences(); // Função existente

    // Aplicar filtros padrão
    if (userPreferences.defaultFilters) {
      applyFilterSet(userPreferences.defaultFilters);
    }

    console.log('[Store] Filtros resetados para configuração padrão do usuário');
  } catch (error) {
    console.warn('[Store] Erro ao resetar filtros:', error);
  }
}

// Disponibilizar globalmente para o store
window.resetFiltersToDefault = resetFiltersToUserDefault;
```

#### 3.5: Auto-Save Seletivo para Dados Médicos

```javascript
// addRecentPatient() com controle de persistência
addRecentPatient(patient, options = {}) {
  const {
    manual = true,      // Apenas adiciona se foi busca manual
    maxRecent = 50
  } = options;

  // Apenas adiciona se foi busca manual (não navegação casual)
  if (!manual) {
    if (this._debugMode) {
      console.log('[Store] Paciente auto-detectado não adicionado aos recentes');
    }
    return;
  }

  // Sanitizar dados para persistência (remover informações sensíveis)
  const safePatient = {
    id: patient.id,
    nome: patient.nome,           // Nome é necessário para UX
    searchedAt: Date.now(),
    source: 'manual_search'
    // CPF, CNS, dados médicos → NUNCA salvos
  };

  // Remove duplicatas
  const filtered = state.recentPatients.filter(p => p.id !== patient.id);

  // Adiciona no início
  state.recentPatients = [safePatient, ...filtered].slice(0, maxRecent);

  // Auto-save APENAS recentPatients (dados não-sensíveis)
  this._autoSave(['recentPatients']);
  this._notify();

  if (this._debugMode) {
    console.log(`[Store] Paciente adicionado aos recentes: ${patient.nome}`);
  }
},

// Auto-save seletivo e inteligente
_autoSave: (() => {
  let timeout;
  return (keys = []) => {
    // Filtrar apenas chaves permitidas para persistência
    const allowedKeys = keys.filter(key => PERSISTENT_DATA[key]);

    if (allowedKeys.length === 0) {
      if (this._debugMode) {
        console.log('[Store] Nenhuma chave persistente para salvar');
      }
      return;
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.saveToStorage(allowedKeys);
    }, 1000); // Save após 1 segundo de inatividade
  };
})()
```

### FASE 4: Testes e Validação (Dia 4) ✅ CRÍTICO

#### 4.1: Testes de Memory Leaks

```javascript
// test/unit/core/store-memory.test.js
describe('Store Memory Management', () => {
  test('should not leak listeners', () => {
    const initialCount = store.getDebugInfo().listenersCount;

    // Adicionar 100 listeners
    const unsubscribes = [];
    for (let i = 0; i < 100; i++) {
      const unsubscribe = store.subscribe(() => {});
      unsubscribes.push(unsubscribe);
    }

    expect(store.getDebugInfo().listenersCount).toBe(initialCount + 100);

    // Remover todos
    unsubscribes.forEach((unsub) => unsub());

    expect(store.getDebugInfo().listenersCount).toBe(initialCount);
  });

  test('should cleanup old data', () => {
    // Adicionar muitos pacientes
    const manyPatients = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Patient ${i}`,
    }));

    store.setRecentPatients(manyPatients);
    expect(store.getRecentPatients().length).toBe(100);

    // Cleanup com limite
    store.clearOldData({ maxRecentPatients: 50 });
    expect(store.getRecentPatients().length).toBe(50);
  });
});
```

#### 4.2: Testes de Fluxo Médico

```javascript
// test/unit/core/store-medical-flow.test.js
describe('Store Medical Flow', () => {
  test('should reset filters when changing patient', async () => {
    // Mock FilterManager
    window.FilterManager = {
      resetToDefault: jest.fn(),
      applyFilterSet: jest.fn(),
    };

    const patient1 = { id: 1, nome: 'João Silva', ficha: {} };
    const patient2 = { id: 2, nome: 'Maria Santos', ficha: {} };

    // Carregar primeiro paciente
    await store.changePatient(patient1, 'manual');

    // Verificar reset foi chamado
    expect(window.FilterManager.resetToDefault).toHaveBeenCalledTimes(1);

    // Trocar para segundo paciente
    await store.changePatient(patient2, 'manual');

    // Verificar reset foi chamado novamente (nova análise)
    expect(window.FilterManager.resetToDefault).toHaveBeenCalledTimes(2);

    // Limpar mock
    delete window.FilterManager;
  });

  test('should not add auto-detected patients to recent list', async () => {
    const initialRecentCount = store.getRecentPatients().length;
    const autoDetectedPatient = { id: 999, nome: 'Auto Detected', ficha: {} };

    // Simular detecção automática
    await store.changePatient(autoDetectedPatient, 'auto_detection');

    // Lista de recentes não deve mudar
    expect(store.getRecentPatients().length).toBe(initialRecentCount);
  });

  test('should add manually searched patients to recent list', async () => {
    const initialRecentCount = store.getRecentPatients().length;
    const manualPatient = { id: 888, nome: 'Manual Search', ficha: {} };

    // Simular busca manual
    await store.changePatient(manualPatient, 'manual');

    // Lista de recentes deve aumentar
    expect(store.getRecentPatients().length).toBe(initialRecentCount + 1);
    expect(store.getRecentPatients()[0].nome).toBe('Manual Search');
  });
});
```

#### 4.3: Testes de Persistência Médica

```javascript
// test/unit/core/store-persistence.test.js
describe('Store Medical Persistence', () => {
  let mockChromeStorage;

  beforeEach(() => {
    // Mock Chrome Storage API
    mockChromeStorage = {
      local: {
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({}),
      },
    };
    global.chrome = { storage: mockChromeStorage };
  });

  test('should only persist allowed medical data', async () => {
    const sensitivePatient = {
      id: 1,
      nome: 'João Silva',
      cpf: '12345678900', // Sensível - não deve persistir
      cns: '123456789012345', // Sensível - não deve persistir
      ficha: { detalhes: 'médicos sensíveis' },
    };

    // Definir estado com dados sensíveis
    store.setPatient(sensitivePatient, null);
    store.addRecentPatient(sensitivePatient, { manual: true });

    // Aguardar auto-save
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Verificar que apenas dados seguros foram salvos
    expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
      recentPatients: [
        expect.objectContaining({
          id: 1,
          nome: 'João Silva',
          source: 'manual_search',
        }),
      ],
    });

    // Verificar que dados sensíveis NÃO foram salvos
    const savedData = mockChromeStorage.local.set.mock.calls[0][0];
    expect(savedData.currentPatient).toBeUndefined();
    expect(savedData.recentPatients[0].cpf).toBeUndefined();
    expect(savedData.recentPatients[0].cns).toBeUndefined();
  });

  test('should not persist current patient data', async () => {
    const patient = { id: 1, nome: 'Test Patient', ficha: { dados: 'sensíveis' } };

    store.setPatient(patient, null);
    await store.saveToStorage();

    // currentPatient nunca deve ser salvo
    expect(mockChromeStorage.local.set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        currentPatient: expect.anything(),
      })
    );
  });

  test('should restore session correctly after restart', async () => {
    // Simular dados persistidos
    const persistedData = {
      recentPatients: [{ id: 1, nome: 'João Silva', searchedAt: Date.now() }],
      savedFilterSets: { favorito: { status: 'all' } },
    };

    mockChromeStorage.local.get.mockResolvedValue(persistedData);

    // Carregar dados
    await store.loadFromStorage();

    // Verificar dados foram carregados
    expect(store.getRecentPatients()).toEqual(persistedData.recentPatients);
    expect(store.getSavedFilterSets()).toEqual(persistedData.savedFilterSets);

    // Verificar que currentPatient permanece vazio (nova sessão = nova análise)
    expect(store.getCurrentPatient().ficha).toBeNull();
  });
});
```

#### 4.4: Testes de Performance

```javascript
// test/unit/core/store-performance.test.js
describe('Store Performance', () => {
  test('should handle many listeners efficiently', () => {
    const start = performance.now();

    // Adicionar 1000 listeners
    const unsubscribes = [];
    for (let i = 0; i < 1000; i++) {
      const unsubscribe = store.subscribe(() => {});
      unsubscribes.push(unsubscribe);
    }

    // Notificar
    store.setPatient({ id: 'test' }, null);

    const end = performance.now();

    // Não deve demorar mais que 100ms
    expect(end - start).toBeLessThan(100);

    // Cleanup
    unsubscribes.forEach((unsub) => unsub());
  });

  test('should maintain performance with large recent patients list', () => {
    const manyPatients = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      nome: `Patient ${i}`,
      searchedAt: Date.now(),
    }));

    const start = performance.now();

    // Simular adição sequencial (como uso real)
    manyPatients.forEach((patient) => {
      store.addRecentPatient(patient, { manual: true });
    });

    const end = performance.now();

    // Operação deve ser rápida mesmo com muitos pacientes
    expect(end - start).toBeLessThan(200);

    // Lista deve ser limitada automaticamente
    expect(store.getRecentPatients().length).toBeLessThanOrEqual(50);
  });
});
```

---

## 🎯 CRITÉRIOS DE ACEITAÇÃO

### ✅ Funcionais

1. **Backward Compatibility**:

   - [ ] Todos os métodos existentes funcionam sem mudanças
   - [ ] Código existente continua funcionando sem modificação

2. **Memory Management**:

   - [ ] Memory leaks eliminados (verificado por testes)
   - [ ] Auto-cleanup de listeners órfãos funcionando
   - [ ] clearOldData() implementado e funcional

3. **Debug Tools**:

   - [ ] Debug mode habilitável/desabilitável
   - [ ] Estatísticas de store acessíveis
   - [ ] Memory usage tracking funcionando

4. **Fluxo Médico Preservado**:

   - [ ] Troca de paciente reseta filtros para padrão do usuário
   - [ ] Pacientes auto-detectados NÃO vão para lista de recentes
   - [ ] Pacientes buscados manualmente SÃO adicionados aos recentes
   - [ ] clearPatient() integrado com reset de filtros

5. **Persistence Médica**:

   - [ ] Apenas dados não-sensíveis são persistidos
   - [ ] currentPatient NUNCA é salvo no storage
   - [ ] recentPatients salvos sem dados sensíveis (CPF, CNS)
   - [ ] Restart da extensão = nova análise com filtros padrão
   - [ ] Configurações e listas preservadas entre sessões

### ✅ Não-Funcionais

1. **Performance**:

   - [ ] Notificações para 1000+ listeners < 100ms
   - [ ] Memory usage estável em uso prolongado
   - [ ] Auto-cleanup sem impacto perceptível
   - [ ] addRecentPatient() rápido mesmo com muitos pacientes

2. **Segurança Médica**:

   - [ ] Dados sensíveis NUNCA persistidos
   - [ ] Sanitização automática de dados para storage
   - [ ] Compliance LGPD/HIPAA mantida
   - [ ] Logs não expõem informações médicas

3. **Qualidade**:

   - [ ] Cobertura de testes > 90%
   - [ ] Testes específicos para fluxo médico
   - [ ] Sem novos bugs introduzidos
   - [ ] ESLint/Prettier passing

4. **Manutenibilidade**:
   - [ ] Código bem documentado
   - [ ] Patterns consistentes
   - [ ] Debug logs úteis mas não verbosos
   - [ ] Separação clara entre dados persistentes e sessão

---

## 🔄 DEPENDÊNCIAS E IMPACTOS

### ⬆️ Dependências (TASK-M-001 precisa de...)

- **TASK-M-005** (Error Handler): Store usa `logError()` para tratamento ✅ **JÁ EXISTE**
- **Sistema de Filtros Atual**: Integração com implementação existente em `sidebar.js`
- **Configurações do Usuário**: Sistema existente em `options.html` e storage
- **⚠️ IMPORTANTE**: `FilterManager` e `AutomationManager` **NÃO EXISTEM** - serão criados como parte desta task ou simulados

### ⬇️ Impactos (TASK-M-001 permite...)

- **TASK-A-004** (Memory Leaks): Patterns estabelecidos aqui resolvem os leaks
- **TASK-M-006** (Data Encryption): Persistence patterns preparar integração crypto
- **TASK-M-007** (Performance Monitoring): Debug tools base para metrics
- **Fluxo Médico Futuro**: Base sólida para features que respeitam análise médica
- **Compliance LGPD/HIPAA**: Patterns de persistência segura estabelecidos
- **Componentes Futuros**: Store patterns como base arquitetural

---

## 🚨 AVISOS E CUIDADOS

### ❌ O QUE NÃO FAZER

1. **NÃO usar bibliotecas externas** (Redux, MobX, etc.) - viola princípio de simplicidade
2. **NÃO quebrar a API existente** - backwards compatibility é obrigatória
3. **NÃO implementar features desnecessárias** - foque nos problemas reais
4. **NÃO complicar o debugging** - ferramentas devem ser opt-in
5. **NÃO persistir dados sensíveis** - NUNCA salvar CPF, CNS, dados clínicos
6. **NÃO quebrar o fluxo médico** - sempre resetar filtros na troca de paciente

### ⚠️ CUIDADOS ESPECIAIS

1. **Medical Data**: Store lida com dados sensíveis - nunca logar ou persistir informações médicas (CPF, CNS, dados clínicos)
2. **Filter Reset**: Toda troca de paciente DEVE resetar filtros para configuração padrão do usuário (nova análise médica)
3. **Browser Compatibility**: Testes obrigatórios em Chrome/Firefox/Edge
4. **Performance**: Store é usado intensivamente - mudanças devem ser rápidas
5. **Memory**: Extensões têm limitações de memory - monitorar usage
6. **Persistence Strategy**: Apenas dados não-sensíveis e configurações do usuário devem persistir
7. **Medical Flow**: Respeitar distinção entre busca manual (persiste) vs detecção automática (não persiste)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Preparação

- [ ] Ler este documento completamente
- [ ] Configurar ambiente de desenvolvimento (`npm run dev`)
- [ ] Executar testes atuais para baseline (`npm run test:unit`)
- [ ] Criar branch para desenvolvimento (`git checkout -b feature/task-m-001`)

### Implementação Fase 1 (Dia 1-2)

- [ ] Implementar WeakMap para listeners registry
- [ ] Adicionar auto-cleanup de listeners órfãos
- [ ] Implementar método clearOldData()
- [ ] Testar memory management localmente

### Implementação Fase 2 (Dia 2-3)

- [ ] Adicionar debug mode e tools
- [ ] Implementar memory usage tracking
- [ ] Testar debugging tools
- [ ] Validar performance impact

### Implementação Fase 3 (Dia 3-4)

- [ ] Implementar persistence médica consciente
- [ ] Implementar clearPatient() com reset de filtros
- [ ] Implementar changePatient() para fluxo médico
- [ ] **REALISTA**: Criar abstrações mínimas para FilterManager/AutomationManager
- [ ] **ALTERNATIVA**: Integrar diretamente com sistema atual (sidebar.js)
- [ ] Adicionar auto-save seletivo (apenas dados seguros)
- [ ] Testar fluxo de troca de paciente (manual vs auto)
- [ ] Validar que dados sensíveis nunca são persistidos
- [ ] Validar cross-browser compatibility

### Implementação Fase 4 (Dia 4)

- [ ] Escrever testes de memory leaks
- [ ] Escrever testes de fluxo médico
- [ ] Escrever testes de persistência médica
- [ ] Escrever testes de performance
- [ ] Executar validação completa (`npm run ci:validate`)
- [ ] Testar comportamento em Chrome/Firefox/Edge

### Finalização

- [ ] Documentar mudanças no CHANGELOG.md
- [ ] Executar build completo (`npm run build:all`)
- [ ] Commit com mensagem apropriada
- [ ] Merge e deploy se necessário

---

## 📚 RECURSOS DE REFERÊNCIA

### Documentação Técnica

- [JavaScript Memory Management](https://developer.mozilla.org/docs/Web/JavaScript/Memory_Management)
- [WeakMap MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [Chrome Extension Storage](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Performance API](https://developer.mozilla.org/docs/Web/API/Performance)

### Projeto Específico

- `agents.md` - Convenções e padrões do projeto (**OBRIGATÓRIO LEITURA**)
- `ErrorHandler.js` - Sistema de logging existente
- `filter-config.js` - Configuração atual de filtros
- `options.html/js` - Interface de configurações do usuário
- Arquivos de teste existentes em `test/unit/`
- Store atual em `store.js`

### Compliance e Segurança Médica

- LGPD (Lei Geral de Proteção de Dados)
- HIPAA Compliance Guidelines
- Chrome Extension Security Best Practices
- Medical Data Handling Standards

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Testes
npm run test:unit
npm run test:watch
npm run test:coverage

# Validação
npm run ci:validate
npm run lint:fix

# Build
npm run build:all

# Teste específico médico (se disponível)
npm run test:medical-flow
npm run validate:security
```

---

## 🎯 CONCLUSÃO

Esta implementação mantém a **simplicidade e elegância** do store atual enquanto resolve os **problemas identificados na auditoria** e **respeita totalmente o fluxo médico**. O foco está em:

1. **Resolver problemas reais** sem complicar o código
2. **Manter backward compatibility** total
3. **Preservar o comportamento médico** de reset de filtros na troca de paciente
4. **Implementar persistência inteligente** que distingue dados seguros vs sensíveis
5. **Estabelecer base sólida** para features futuras
6. **Seguir padrões do projeto** estabelecidos

### 🏥 **Benefícios para o Fluxo Médico**

- **Nova análise = filtros padrão**: Cada paciente inicia com configuração personalizada do usuário
- **Persistência consciente**: Listas e configurações preservadas, dados sensíveis sempre frescos
- **UX preservada**: Comportamento familiar mantido, com melhorias transparentes
- **Compliance médico**: Dados sensíveis nunca persistem, sempre em memória de sessão apenas

### 🔄 **Exemplos de Fluxo Após Implementação**

```javascript
// Cenário 1: Regulador busca paciente manualmente
await store.changePatient(patient, 'manual');
// ✅ Filtros resetados para padrão do usuário
// ✅ Paciente adicionado aos recentes (persistido)
// ✅ Automação aplicada se configurada

// Cenário 2: Sistema detecta mudança automática no SIGSS
await store.changePatient(detectedPatient, 'auto_detection');
// ✅ Filtros resetados para padrão do usuário
// ✅ Paciente NÃO adicionado aos recentes
// ✅ Apenas dados em memória de sessão

// Cenário 3: Restart da extensão
await store.loadFromStorage();
// ✅ Listas e configurações carregadas
// ✅ currentPatient vazio (nova análise)
// ✅ Filtros nos valores padrão do usuário
```

O resultado será um store mais robusto, com melhor gerenciamento de memória, ferramentas de debug, persistência inteligente e **total respeito ao fluxo médico atual**, mantendo a mesma facilidade de uso que os desenvolvedores já conhecem.
