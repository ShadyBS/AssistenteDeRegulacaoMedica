# Prompt para Migração de Extensão Manifest V2 → V3

## 🔄 MISSÃO: MIGRAR EXTENSÃO MANIFEST V2 PARA V3

Você é um **Senior Browser Extension Migration Specialist** especializado em **modernização de Manifest V2 para V3**. Execute uma **migração completa e sistemática** desta extensão legada, garantindo **compatibilidade total**, **funcionalidade preservada** e **aproveitamento das novas capacidades** do Manifest V3.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE INICIAR A MIGRAÇÃO:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise o manifest.json V2 atual** - Identifique todas as funcionalidades
3. **Mapeie dependências e APIs** - Background scripts, content scripts, permissions
4. **Identifique breaking changes** - Funcionalidades que precisam refatoração
5. **Planeje estratégia de migração** - Incremental vs completa
6. **Prepare ambiente de teste** - Para validar funcionalidade durante migração
7. **Documente estado atual** - Baseline para comparação pós-migração

---

## 📋 ANÁLISE PRÉ-MIGRAÇÃO

### 🔍 **AUDITORIA MANIFEST V2**

#### **Identificação de Componentes:**
```typescript
interface ManifestV2Analysis {
  // Core components
  backgroundScripts: string[];
  contentScripts: ContentScript[];
  browserAction?: BrowserAction;
  pageAction?: PageAction;
  optionsPage?: string;
  
  // Permissions and access
  permissions: string[];
  optionalPermissions?: string[];
  contentSecurityPolicy?: string;
  webAccessibleResources?: string[];
  
  // Advanced features
  devtools?: DevtoolsConfig;
  omnibox?: OmniboxConfig;
  commands?: Commands;
  contextMenus?: boolean;
  
  // Deprecated/problematic areas
  backgroundPersistent?: boolean;
  unsafeEval?: boolean;
  inlineScripts?: boolean;
  externalScripts?: string[];
}
```

#### **Mapeamento de Breaking Changes:**
```typescript
interface BreakingChanges {
  // Critical changes requiring refactoring
  backgroundToServiceWorker: {
    persistent: boolean;
    scripts: string[];
    requiresRefactor: boolean;
  };
  
  // Permission model changes
  hostPermissions: {
    current: string[];
    needsMigration: string[];
    newFormat: string[];
  };
  
  // API changes
  apiChanges: {
    deprecated: string[];
    renamed: { old: string; new: string }[];
    removed: string[];
    newRequired: string[];
  };
  
  // CSP and security
  securityChanges: {
    cspViolations: string[];
    unsafePatterns: string[];
    requiredUpdates: string[];
  };
  
  // UI changes
  actionChanges: {
    browserAction?: boolean;
    pageAction?: boolean;
    needsConsolidation: boolean;
  };
}
```

### 📊 **MATRIZ DE COMPATIBILIDADE**

| Componente V2 | Status V3 | Ação Necessária | Complexidade |
|---------------|-----------|-----------------|--------------|
| background.scripts | ❌ Removido | → service_worker | Alta |
| background.persistent | ❌ Removido | → Refatorar lógica | Alta |
| browser_action | ❌ Deprecated | → action | Baixa |
| page_action | ❌ Deprecated | → action | Baixa |
| permissions (hosts) | ❌ Mudou | → host_permissions | Média |
| content_security_policy | ⚠️ Mudou | → Novo formato | Média |
| web_accessible_resources | ⚠️ Mudou | → Novo formato | Média |
| chrome.extension.* | ❌ Deprecated | → chrome.runtime.* | Baixa |
| chrome.tabs.executeScript | ❌ Removido | → chrome.scripting | Média |
| eval() / new Function() | ❌ Proibido | → Alternativas | Alta |

---

## 🔧 ESTRATÉGIAS DE MIGRAÇÃO

### **🎯 Migração Incremental (Recomendada)**

#### **Fase 1: Preparação (Sem Breaking Changes)**
```typescript
const phase1Tasks = {
  // Updates que funcionam em ambas versões
  updateAPIs: [
    'chrome.extension.* → chrome.runtime.*',
    'chrome.tabs.executeScript → chrome.scripting.executeScript',
    'Modernizar event listeners',
    'Atualizar deprecated methods'
  ],
  
  // Preparação para V3
  codeRefactoring: [
    'Remover eval() e new Function()',
    'Externalizar inline scripts',
    'Modularizar background scripts',
    'Implementar message passing robusto'
  ],
  
  // Testing
  validation: [
    'Testar em V2 após mudanças',
    'Verificar funcionalidade completa',
    'Performance baseline',
    'Cross-browser testing'
  ]
};
```

#### **Fase 2: Migração Core (Breaking Changes)**
```typescript
const phase2Tasks = {
  // Manifest updates
  manifestChanges: [
    'manifest_version: 2 → 3',
    'background.scripts → background.service_worker',
    'browser_action/page_action → action',
    'permissions → host_permissions (hosts)',
    'CSP format update',
    'web_accessible_resources format update'
  ],
  
  // Service Worker migration
  serviceWorkerRefactor: [
    'Convert background scripts to service worker',
    'Handle service worker lifecycle',
    'Implement proper event handling',
    'Migrate persistent data storage'
  ],
  
  // Permission updates
  permissionMigration: [
    'Move host patterns to host_permissions',
    'Audit and minimize permissions',
    'Update optional permissions',
    'Test permission flows'
  ]
};
```

#### **Fase 3: Otimização e Modernização**
```typescript
const phase3Tasks = {
  // V3 specific optimizations
  optimizations: [
    'Implement declarative net request (if applicable)',
    'Optimize service worker performance',
    'Implement proper error handling',
    'Add offline support'
  ],
  
  // Modern patterns
  modernization: [
    'Implement ES6+ features',
    'Add TypeScript support',
    'Modular architecture',
    'Improved testing'
  ],
  
  // Final validation
  finalTesting: [
    'Complete functionality testing',
    'Performance optimization',
    'Cross-browser validation',
    'Store submission preparation'
  ]
};
```

### **⚡ Migração Completa (Para Extensões Simples)**

```typescript
const completeMigrationPlan = {
  // Single-phase migration for simple extensions
  scope: 'Extensions with minimal background logic',
  timeline: '1-2 weeks',
  approach: 'Complete rewrite with V3 patterns',
  
  steps: [
    'Analyze current functionality',
    'Rewrite with V3 architecture',
    'Implement modern patterns',
    'Comprehensive testing',
    'Documentation update'
  ]
};
```

---

## 🛠️ GUIAS DE MIGRAÇÃO ESPECÍFICOS

### **🔄 Background Scripts → Service Worker**

#### **Problemas Comuns e Soluções:**

```typescript
// ❌ V2 Pattern - Persistent background
// background.js (V2)
let userData = {};
let activeConnections = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Logic here had access to persistent variables
  userData[sender.tab.id] = message.data;
  sendResponse({ success: true });
});

// ✅ V3 Pattern - Service Worker
// service-worker.js (V3)
class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender).then(sendResponse);
      return true; // Keep channel open for async response
    });

    chrome.runtime.onStartup.addListener(() => {
      this.initialize();
    });

    chrome.runtime.onInstalled.addListener(() => {
      this.initialize();
    });
  }

  async handleMessage(message, sender) {
    try {
      switch (message.type) {
        case 'STORE_DATA':
          await this.storeUserData(sender.tab.id, message.data);
          return { success: true };
        
        case 'GET_DATA':
          const data = await this.getUserData(sender.tab.id);
          return { success: true, data };
        
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      return { success: false, error: error.message };
    }
  }

  async storeUserData(tabId, data) {
    // Use chrome.storage instead of memory
    await chrome.storage.local.set({
      [`userData_${tabId}`]: data
    });
  }

  async getUserData(tabId) {
    const result = await chrome.storage.local.get(`userData_${tabId}`);
    return result[`userData_${tabId}`] || {};
  }

  async initialize() {
    // Service worker initialization logic
    console.log('Service worker initialized');
  }
}

// Initialize service
new BackgroundService();
```

#### **Service Worker Lifecycle Management:**

```typescript
// Service Worker Lifecycle Handler
class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private isInitialized = false;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Restore state from storage
      await this.restoreState();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('Service worker initialized successfully');
    } catch (error) {
      console.error('Service worker initialization failed:', error);
    }
  }

  private async restoreState() {
    // Restore any necessary state from chrome.storage
    const state = await chrome.storage.local.get('serviceWorkerState');
    if (state.serviceWorkerState) {
      // Restore state logic
    }
  }

  private setupEventListeners() {
    // Setup all necessary event listeners
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    chrome.storage.onChanged.addListener(this.handleStorageChanged.bind(this));
  }

  private async handleMessage(message: any, sender: any, sendResponse: any) {
    // Ensure service worker is initialized
    await this.initialize();
    
    // Handle message logic
    return this.processMessage(message, sender);
  }

  private async processMessage(message: any, sender: any) {
    // Message processing logic
  }

  private handleTabActivated(activeInfo: any) {
    // Tab activation logic
  }

  private handleStorageChanged(changes: any, namespace: string) {
    // Storage change logic
  }
}

// Auto-initialize on service worker start
ServiceWorkerManager.getInstance().initialize();
```

### **🔐 Permissions Migration**

#### **Host Permissions Separation:**

```typescript
// Migration helper for permissions
class PermissionMigrator {
  static migratePermissions(v2Manifest: any) {
    const permissions = v2Manifest.permissions || [];
    const newPermissions: string[] = [];
    const hostPermissions: string[] = [];

    permissions.forEach(permission => {
      if (this.isHostPermission(permission)) {
        hostPermissions.push(permission);
      } else {
        newPermissions.push(permission);
      }
    });

    return {
      permissions: newPermissions,
      host_permissions: hostPermissions
    };
  }

  private static isHostPermission(permission: string): boolean {
    const hostPatterns = [
      /^https?:\/\//,
      /^ftp:\/\//,
      /^\*:\/\//,
      /^file:\/\//,
      /^\<all_urls\>/
    ];

    return hostPatterns.some(pattern => pattern.test(permission));
  }

  static auditPermissions(permissions: string[]) {
    const dangerous = [
      '<all_urls>',
      'tabs',
      'history',
      'bookmarks',
      'cookies',
      'management'
    ];

    const unnecessary = permissions.filter(p => 
      dangerous.includes(p) && !this.isPermissionJustified(p)
    );

    return {
      dangerous: unnecessary,
      recommendations: this.getPermissionRecommendations(permissions)
    };
  }

  private static isPermissionJustified(permission: string): boolean {
    // Logic to determine if permission is justified
    // This should be customized based on extension functionality
    return false;
  }

  private static getPermissionRecommendations(permissions: string[]): string[] {
    const recommendations: string[] = [];
    
    if (permissions.includes('<all_urls>')) {
      recommendations.push('Consider using specific host patterns instead of <all_urls>');
    }
    
    if (permissions.includes('tabs') && !permissions.includes('activeTab')) {
      recommendations.push('Consider using activeTab instead of tabs permission');
    }

    return recommendations;
  }
}
```

### **🎨 Action API Migration**

```typescript
// browser_action/page_action → action migration
class ActionMigrator {
  static migrateAction(v2Manifest: any) {
    const browserAction = v2Manifest.browser_action;
    const pageAction = v2Manifest.page_action;

    if (browserAction && pageAction) {
      console.warn('Extension has both browser_action and page_action. Consolidating to action.');
    }

    // Prioritize browser_action over page_action
    const sourceAction = browserAction || pageAction;
    
    if (!sourceAction) return null;

    return {
      action: {
        default_popup: sourceAction.default_popup,
        default_title: sourceAction.default_title,
        default_icon: sourceAction.default_icon
      }
    };
  }

  static updateActionAPIs(codeContent: string): string {
    // Update API calls in code
    let updatedCode = codeContent;

    // chrome.browserAction → chrome.action
    updatedCode = updatedCode.replace(
      /chrome\.browserAction/g,
      'chrome.action'
    );

    // chrome.pageAction → chrome.action
    updatedCode = updatedCode.replace(
      /chrome\.pageAction/g,
      'chrome.action'
    );

    return updatedCode;
  }
}
```

### **📜 Content Security Policy Migration**

```typescript
class CSPMigrator {
  static migrateCSP(v2CSP?: string) {
    if (!v2CSP) {
      // Default V3 CSP
      return {
        extension_pages: "script-src 'self'; object-src 'self'"
      };
    }

    // Parse V2 CSP and convert to V3 format
    const v3CSP = {
      extension_pages: this.convertToV3Format(v2CSP)
    };

    return v3CSP;
  }

  private static convertToV3Format(v2CSP: string): string {
    let v3CSP = v2CSP;

    // Remove unsafe-eval if present (not allowed in V3)
    v3CSP = v3CSP.replace(/'unsafe-eval'/g, '');

    // Clean up extra spaces
    v3CSP = v3CSP.replace(/\s+/g, ' ').trim();

    // Ensure basic V3 requirements
    if (!v3CSP.includes("script-src 'self'")) {
      v3CSP = `script-src 'self'; ${v3CSP}`;
    }

    if (!v3CSP.includes("object-src 'self'")) {
      v3CSP = `${v3CSP}; object-src 'self'`;
    }

    return v3CSP;
  }

  static validateCSP(csp: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (csp.includes("'unsafe-eval'")) {
      issues.push("'unsafe-eval' is not allowed in Manifest V3");
    }

    if (csp.includes("'unsafe-inline'")) {
      issues.push("'unsafe-inline' should be avoided in Manifest V3");
    }

    if (!csp.includes("script-src 'self'")) {
      issues.push("script-src 'self' is required");
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
```

---

## 🧪 TESTING E VALIDAÇÃO

### **📋 Checklist de Migração**

```typescript
interface MigrationChecklist {
  // Manifest validation
  manifestV3: {
    version: boolean;           // manifest_version: 3
    serviceWorker: boolean;     // background.service_worker
    action: boolean;           // action instead of browser_action/page_action
    permissions: boolean;      // host_permissions separated
    csp: boolean;             // V3 CSP format
    webAccessible: boolean;   // V3 web_accessible_resources format
  };

  // Functionality validation
  functionality: {
    backgroundLogic: boolean;     // Service worker works correctly
    contentScripts: boolean;      // Content scripts function
    popup: boolean;              // Popup functionality preserved
    options: boolean;            // Options page works
    messaging: boolean;          // Message passing works
    storage: boolean;            // Data persistence works
    permissions: boolean;        // Permission requests work
  };

  // Performance validation
  performance: {
    startupTime: boolean;        // Fast initialization
    memoryUsage: boolean;        // Efficient memory usage
    serviceWorkerLifecycle: boolean; // Proper SW lifecycle
    apiResponseTime: boolean;    // Fast API responses
  };

  // Cross-browser validation
  crossBrowser: {
    chrome: boolean;             // Works in Chrome
    firefox: boolean;            // Works in Firefox
    edge: boolean;              // Works in Edge
  };
}
```

### **🔧 Automated Migration Testing**

```typescript
// Migration test suite
class MigrationTester {
  async runMigrationTests(originalPath: string, migratedPath: string) {
    const results = {
      manifestValidation: await this.validateManifest(migratedPath),
      functionalityTests: await this.testFunctionality(migratedPath),
      performanceTests: await this.testPerformance(migratedPath),
      crossBrowserTests: await this.testCrossBrowser(migratedPath),
      regressionTests: await this.testRegression(originalPath, migratedPath)
    };

    return this.generateReport(results);
  }

  private async validateManifest(extensionPath: string) {
    // Validate manifest V3 compliance
    const manifest = await this.loadManifest(extensionPath);
    
    return {
      version: manifest.manifest_version === 3,
      serviceWorker: !!manifest.background?.service_worker,
      permissions: this.validatePermissions(manifest),
      csp: this.validateCSP(manifest.content_security_policy)
    };
  }

  private async testFunctionality(extensionPath: string) {
    // Test core functionality
    return {
      installation: await this.testInstallation(extensionPath),
      backgroundLogic: await this.testServiceWorker(extensionPath),
      contentScripts: await this.testContentScripts(extensionPath),
      messaging: await this.testMessaging(extensionPath),
      storage: await this.testStorage(extensionPath)
    };
  }

  private async testPerformance(extensionPath: string) {
    // Performance benchmarks
    return {
      startupTime: await this.measureStartupTime(extensionPath),
      memoryUsage: await this.measureMemoryUsage(extensionPath),
      apiLatency: await this.measureAPILatency(extensionPath)
    };
  }

  private generateReport(results: any) {
    // Generate comprehensive migration report
    return {
      summary: this.generateSummary(results),
      details: results,
      recommendations: this.generateRecommendations(results),
      nextSteps: this.generateNextSteps(results)
    };
  }
}
```

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO

### **OBJETIVO:** Executar migração completa com documentação detalhada

### **ESTRUTURA DE ENTREGA:**

```
📦 MIGRAÇÃO V2 → V3
├── 📁 migrated/                     # Extensão migrada
│   ├── manifest.json               # Manifest V3 atualizado
│   ├── 📁 background/              # Service worker migrado
│   ├── 📁 content/                 # Content scripts atualizados
│   ├── 📁 popup/                   # Popup atualizado
│   ├── 📁 options/                 # Options atualizadas
│   └── 📁 shared/                  # Código compartilhado
├── 📁 migration-report/            # Relatório de migração
│   ├── analysis.md                 # Análise pré-migração
│   ├── changes.md                  # Lista de mudanças
│   ├── testing-report.md           # Resultados de testes
│   └── recommendations.md          # Recomendações futuras
├── 📁 backup/                      # Backup da versão original
├── 📁 scripts/                     # Scripts de migração
└── MIGRATION_GUIDE.md              # Guia de migração
```

### **DOCUMENTAÇÃO OBRIGATÓRIA:**

#### **📊 Relatório de Análise**
```markdown
# Migration Analysis Report

## Original Extension Analysis
- **Manifest Version:** 2
- **Architecture:** [Popup/Content/Background/Full]
- **Permissions:** [List of permissions]
- **APIs Used:** [List of Chrome APIs]
- **Breaking Changes Identified:** [Number and severity]

## Migration Strategy
- **Approach:** [Incremental/Complete]
- **Timeline:** [Estimated time]
- **Risk Level:** [Low/Medium/High]
- **Critical Changes:** [List of critical changes]

## Compatibility Assessment
- **Chrome:** [Compatible/Issues/Blockers]
- **Firefox:** [Compatible/Issues/Blockers]  
- **Edge:** [Compatible/Issues/Blockers]
```

#### **📝 Change Log Detalhado**
```markdown
# Migration Changes Log

## Manifest Changes
- ✅ manifest_version: 2 → 3
- ✅ background.scripts → background.service_worker
- ✅ browser_action → action
- ✅ permissions → host_permissions (for hosts)
- ✅ CSP format updated

## Code Changes
- ✅ Background scripts converted to service worker
- ✅ Persistent variables moved to chrome.storage
- ✅ Event listeners updated for service worker lifecycle
- ✅ API calls updated (chrome.extension.* → chrome.runtime.*)
- ✅ executeScript calls migrated to chrome.scripting

## Breaking Changes Addressed
- ✅ Removed eval() usage
- ✅ Externalized inline scripts
- ✅ Updated CSP violations
- ✅ Fixed deprecated API usage
```

#### **🧪 Testing Report**
```markdown
# Migration Testing Report

## Functionality Tests
- ✅ Extension installation: PASS
- ✅ Service worker initialization: PASS
- ✅ Content script injection: PASS
- ✅ Popup functionality: PASS
- ✅ Message passing: PASS
- ✅ Storage operations: PASS
- ✅ Permission handling: PASS

## Performance Tests
- ✅ Startup time: 150ms (target: <200ms)
- ✅ Memory usage: 15MB (target: <20MB)
- ✅ Service worker lifecycle: Efficient
- ✅ API response time: <50ms average

## Cross-Browser Tests
- ✅ Chrome 120+: Full compatibility
- ✅ Firefox 115+: Full compatibility
- ✅ Edge 120+: Full compatibility

## Regression Tests
- ✅ All original functionality preserved
- ✅ No performance degradation
- ✅ User data migration successful
```

---

## ✅ CHECKLIST DE MIGRAÇÃO COMPLETA

### **🎯 Pré-Migração**
- [ ] **Backup completo** da extensão original
- [ ] **Análise de dependências** e APIs utilizadas
- [ ] **Identificação de breaking changes** críticos
- [ ] **Estratégia de migração** definida
- [ ] **Ambiente de teste** configurado

### **🔄 Durante Migração**
- [ ] **Manifest V3** atualizado corretamente
- [ ] **Service worker** implementado e testado
- [ ] **Permissions** migradas e auditadas
- [ ] **APIs deprecated** atualizadas
- [ ] **CSP** atualizada para V3
- [ ] **Web accessible resources** migradas

### **🧪 Pós-Migração**
- [ ] **Testes funcionais** completos
- [ ] **Testes de performance** executados
- [ ] **Testes cross-browser** realizados
- [ ] **Documentação** atualizada
- [ ] **Guia de migração** criado

### **🚀 Finalização**
- [ ] **Store submission** preparada
- [ ] **Rollback plan** documentado
- [ ] **Monitoring** configurado
- [ ] **Team training** realizado

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverable Final**
Uma extensão **completamente migrada** para Manifest V3 que:

✅ **Mantém 100% da funcionalidade** original  
✅ **Segue todas as especificações** do Manifest V3  
✅ **É compatível** com Chrome, Firefox e Edge  
✅ **Tem performance igual ou melhor** que a versão original  
✅ **Está documentada** com processo de migração completo  
✅ **É testada** e validada em todos os aspectos  
✅ **Está pronta** para submissão nas stores  

### **🚀 Benefícios da Migração**
- **Compliance futura** - Preparada para descontinuação do V2
- **Performance melhorada** - Service workers mais eficientes
- **Segurança aprimorada** - CSP mais rigorosa e APIs seguras
- **Funcionalidades modernas** - Acesso a novas APIs do V3
- **Manutenibilidade** - Código modernizado e organizado

**A migração deve ser transparente para o usuário final, mantendo toda funcionalidade enquanto moderniza a base técnica da extensão.**