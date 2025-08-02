# 🏥 TASK-C-001: Medical Data Logging Sanitization - Guia Completo de Implementação

## 📋 **VISÃO GERAL**

### 🎯 **Objetivo**

Eliminar completamente a exposição de dados médicos sensíveis em logs, implementando sanitização padronizada usando o ErrorHandler já implementado na TASK-M-005.

### 🚨 **Criticidade**

**CRÍTICA** - Violação ativa de LGPD/HIPAA com potencial rejeição nas web stores.

### ⏱️ **Estimativa**

4 horas (1 dia de trabalho)

### 🎯 **RESUMO EXECUTIVO - O QUE PRECISA SER FEITO**

#### 🔥 **AÇÃO CRÍTICA IMEDIATA (15 min)**

- **sidebar.js linha 665**: Remove `console.log(newValue)` que expõe dados completos de regulação médica
- **IMPACTO**: Violação direta de LGPD - dados de paciente em logs do browser

#### ⚠️ **AÇÕES IMPORTANTES (30 min)**

- **api.js linha 131**: Remove `lockId` dos logs
- **api.js linha 1151**: Sanitiza objeto `data` com informações de sessão
- **sidebar.js linha 613**: Sanitiza errors que podem conter stack traces com dados

#### 🔧 **MELHORIAS RECOMENDADAS (45 min)**

- **utils.js**: Padronizar error logging em funções de normalização
- **store.js**: Implementar logging estruturado para errors de state
- **Outros arquivos**: Categorização adequada de logs existentes

#### ✅ **VALIDAÇÃO FINAL (30 min)**

- Executar `npm run validate:security`
- Confirmar que dados sensíveis não aparecem em logs
- Verificar que debugging ainda funciona adequadamente

---

## 🌐 **LIMITAÇÕES DE NAVEGADORES E CONTEXTOS**

### ✅ **Onde o ErrorHandler PODE ser usado (ES6 Modules)**

| Contexto              | Arquivos                              | Status             | Observações                    |
| --------------------- | ------------------------------------- | ------------------ | ------------------------------ |
| **Extension Pages**   | `sidebar.js`, `options.js`, `help.js` | ✅ Suportado       | Contexto completo de extensão  |
| **Background Script** | `background.js`                       | ✅ JÁ IMPLEMENTADO | Service worker com ES6 modules |
| **Content Script**    | `content-script.js`                   | ✅ JÁ IMPLEMENTADO | Importação direta funciona     |
| **API Modules**       | `api.js`, `utils.js`, `store.js`      | ✅ Suportado       | Módulos ES6 padrão             |
| **UI Components**     | `ui/*.js`                             | ✅ Suportado       | Componentes modulares          |

### ⚠️ **Limitações e Considerações Especiais**

#### **1. Content Scripts - Contexto Isolado**

```javascript
// ✅ FUNCIONA - ErrorHandler já implementado em content-script.js
import { ERROR_CATEGORIES, logError, logInfo } from './ErrorHandler.js';

// Observação: Content scripts têm contexto isolado, mas ES6 modules funcionam
// Verificado: content-script.js já usa o ErrorHandler corretamente
```

#### **2. Browser Compatibility**

```javascript
// ✅ COMPATÍVEL com todos os navegadores target:
// - Chrome/Edge: Manifest V3 com ES6 modules ✅
// - Firefox: Manifest V3 adaptado com ES6 modules ✅

// ErrorHandler funciona em todos os contextos de extensão
```

#### **3. Dynamic Imports (se necessário)**

```javascript
// Para casos especiais onde import estático não funciona:
const { logInfo, ERROR_CATEGORIES } = await import('./ErrorHandler.js');
```

#### **4. Legacy Fallback (não necessário, mas documentado)**

```javascript
// Se por algum motivo ES6 modules não estiverem disponíveis:
// NOTA: Não aplicável ao projeto atual - todos os arquivos usam ES6

// Fallback pattern (apenas para referência):
if (typeof window !== 'undefined' && window.ErrorHandler) {
  // Use window.ErrorHandler
} else {
  // Use console fallback com sanitização manual
}
```

### 🎯 **ESTRATÉGIA DE MIGRAÇÃO TOTAL**

#### **Prioridade 1: Arquivos com Dados Médicos Sensíveis**

- ✅ `background.js` - JÁ MIGRADO
- ✅ `content-script.js` - JÁ MIGRADO
- 🔴 `sidebar.js` - **MIGRAÇÃO CRÍTICA** (linha 665)
- 🟡 `api.js` - **MIGRAÇÃO IMPORTANTE** (linhas 131, 1151)

#### **Prioridade 2: Arquivos com Logs de Sistema**

- 🟡 `utils.js` - Normalização de dados médicos
- 🟡 `store.js` - State management
- 🟢 Outros arquivos - Logging básico

#### **Prioridade 3: Padronização Completa**

- 🟢 Todos os console.log/error/warn restantes
- 🟢 Implementar logging estruturado em 100% do código

---

---

## 🎯 **MIGRAÇÃO COMPLETA PARA SISTEMA CENTRALIZADO**

### 🏆 **BENEFÍCIOS DO ERRORHANDLER CENTRALIZADO**

#### **🔒 Segurança e Compliance**

- **Sanitização automática**: Dados médicos protegidos por padrão
- **LGPD/HIPAA compliance**: Garantido pelo design do sistema
- **Auditoria**: Logs categorizados e rastreáveis
- **Controle granular**: Níveis de severidade configuráveis

#### **🛠️ Desenvolvimento e Manutenção**

- **Consistência**: Mesmo padrão em toda a extensão
- **Debugging melhorado**: Categorização facilita troubleshooting
- **Redução de bugs**: Sanitização automática evita exposição acidental
- **Testing**: Mocks e stubs centralizados

#### **📊 Monitoramento e Analytics**

- **Métricas**: Contagem automática por categoria
- **Performance**: Tracking de operações críticas
- **Alertas**: Sistema preparado para alerting futuro
- **Compliance reporting**: Logs auditáveis automaticamente

### 📋 **INVENTÁRIO COMPLETO DE MIGRAÇÃO**

#### ✅ **JÁ MIGRADOS (TASK-M-005)**

| Arquivo             | Status          | Implementação                             | Observações                    |
| ------------------- | --------------- | ----------------------------------------- | ------------------------------ |
| `background.js`     | ✅ **COMPLETO** | `logInfo()`, `logWarning()`, `logError()` | Service worker com sanitização |
| `content-script.js` | ✅ **COMPLETO** | `logInfo()`, `logError()`                 | Context isolado funcionando    |

#### 🔴 **MIGRAÇÃO CRÍTICA OBRIGATÓRIA**

| Arquivo      | Linhas  | Problema                                    | Prioridade     | Tempo Est. |
| ------------ | ------- | ------------------------------------------- | -------------- | ---------- |
| `sidebar.js` | 665-668 | `console.log(newValue)` - **dados médicos** | 🔴 **CRÍTICA** | 15 min     |
| `sidebar.js` | 613     | `console.error(error)` - stack traces       | 🔴 **ALTA**    | 10 min     |

#### 🟡 **MIGRAÇÃO IMPORTANTE**

| Arquivo  | Linhas | Problema                              | Prioridade   | Tempo Est. |
| -------- | ------ | ------------------------------------- | ------------ | ---------- |
| `api.js` | 131    | `console.log(lockId)` - ID sensível   | 🟡 **MÉDIA** | 10 min     |
| `api.js` | 1151   | `console.log(data)` - dados de sessão | 🟡 **MÉDIA** | 10 min     |

#### 🟢 **PADRONIZAÇÃO RECOMENDADA**

| Arquivo      | Linhas                  | Logs Afetados        | Benefício              | Tempo Est. |
| ------------ | ----------------------- | -------------------- | ---------------------- | ---------- |
| `utils.js`   | 249,277,302,325,346,433 | Normalization errors | Categorização médica   | 30 min     |
| `store.js`   | 41                      | State errors         | Debugging estruturado  | 15 min     |
| `sidebar.js` | 343,389,818,857,860     | UI errors            | Melhor troubleshooting | 30 min     |

### 🚀 **ESTRATÉGIA DE MIGRAÇÃO PROGRESSIVA**

#### **Fase 1: Segurança Crítica (30 min)**

```javascript
// OBRIGATÓRIO - Dados médicos sensíveis
// sidebar.js, api.js com dados de regulação/sessão
import { logInfo, logError, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';
```

#### **Fase 2: Padronização Core (45 min)**

```javascript
// IMPORTANTE - Arquivos de sistema crítico
// utils.js, store.js, components principais
// Melhora debugging e troubleshooting
```

#### **Fase 3: Cobertura Total (60 min)**

```javascript
// RECOMENDADO - Todos os arquivos restantes
// Logging 100% padronizado em toda extensão
// Base sólida para features futuras
```

### 🔍 **VERIFICAÇÃO DE COMPATIBILIDADE**

#### **ES6 Modules - Suporte Completo**

```javascript
// ✅ VERIFICADO: Todos os contextos suportam ES6 modules
// - Extension pages (sidebar, options, help)
// - Background script (service worker)
// - Content scripts (context isolado)
// - API modules (utils, store, api)

// Importação padrão funciona em 100% dos casos:
import { logInfo, logError, ERROR_CATEGORIES } from './ErrorHandler.js';
```

#### **Cross-Browser Testing**

```bash
# ✅ TESTADO EM:
# Chrome/Edge: Manifest V3 - ES6 modules nativos
# Firefox: Manifest V3 adaptado - ES6 modules funcionando

# Comando de verificação:
npm run validate:security  # Inclui cross-browser compatibility
```

---

### **Step 1: Preparação (5 min)**

```bash
# 1. Abrir VS Code no projeto
cd c:\AssistenteDeRegulacaoMedica

# 2. Verificar que ErrorHandler está disponível
grep -n "export.*ErrorHandler" ErrorHandler.js

# 3. Backup dos arquivos que serão modificados
cp api.js api.js.backup
cp sidebar.js sidebar.js.backup
cp utils.js utils.js.backup
cp store.js store.js.backup
```

### **Step 2: Correção CRÍTICA - sidebar.js (15 min)**

```javascript
// LOCALIZAR linha 665-668 e SUBSTITUIR:

// DE:
console.log('[Assistente Sidebar] Nova regulação detectada via storage.onChanged:', newValue);

// PARA:
import { logInfo, ERROR_CATEGORIES } from './ErrorHandler.js'; // (adicionar no topo)

logInfo(
  'Nova regulação detectada via storage.onChanged',
  {
    hasRegulation: !!newValue,
    hasIsenPKIdp: !!newValue?.isenPKIdp,
    regulationType: newValue?.type || 'unknown',
  },
  ERROR_CATEGORIES.MEDICAL_DATA
);
```

### **Step 3: Correções de Médio Risco (25 min)**

#### **api.js - Linha 131**

```javascript
// DE:
console.log(`[Assistente] Lock da regulação ${lockId} liberado com sucesso.`);

// PARA:
import { logInfo, ERROR_CATEGORIES } from './ErrorHandler.js'; // (adicionar no topo)

logInfo(
  'Lock da regulação liberado com sucesso',
  { lockType: 'regulation', hasLockId: !!lockId },
  ERROR_CATEGORIES.SIGSS_API
);
```

#### **api.js - Linha 1151**

```javascript
// DE:
console.log('Sessão mantida ativa:', data);

// PARA:
import { sanitizeForLog } from './ErrorHandler.js'; // (se não adicionado)

logInfo('Sessão mantida ativa', sanitizeForLog(data), ERROR_CATEGORIES.SIGSS_API);
```

### **Step 4: Validação Imediata (10 min)**

```bash
# Verificar que não há mais logs problemáticos
grep -n "console.log.*newValue" sidebar.js  # Deve retornar vazio
grep -n "console.log.*lockId" api.js        # Deve retornar vazio
grep -n "console.log.*data" api.js          # Deve retornar vazio

# Testar que a extensão ainda funciona
npm run dev
```

### **Step 5: Teste de Compliance (15 min)**

```bash
# Executar testes de segurança
npm run validate:security

# Verificar testes unitários
npm run test:unit

# Verificar que logging funciona
# (abrir sidebar.html no browser e verificar logs no console)
```

---

### 📍 **Localizações Identificadas**

#### ✅ **background.js** - JÁ CORRIGIDO

- **Status**: ✅ Já migrado para ErrorHandler
- **Implementação**: Usa `logInfo()` com dados sanitizados
- **Linhas 10-30**: Logging seguro implementado

#### ⚠️ **api.js** - REQUER CORREÇÃO

```javascript
// Linha 131 - PROBLEMÁTICO
console.log(`[Assistente] Lock da regulação ${lockId} liberado com sucesso.`);

// Linha 1151 - POTENCIALMENTE PROBLEMÁTICO
console.log('Sessão mantida ativa:', data);
```

#### ⚠️ **sidebar.js** - REQUER CORREÇÃO CRÍTICA

```javascript
// Linha 665-668 - CRÍTICO: Expõe dados completos de regulação
console.log(
  '[Assistente Sidebar] Nova regulação detectada via storage.onChanged:',
  newValue // ← PROBLEMA: newValue contém dados médicos sensíveis
);

// Outros console.error em:
// Linha 343, 389, 613, 818, 857, 860 - Podem expor dados em stack traces
```

#### ⚠️ **utils.js** - REQUER ANÁLISE

```javascript
// Múltiplos console.error em normalization functions
// Podem estar expondo dados médicos em stack traces
```

#### ⚠️ **store.js** - VERIFICAR

```javascript
// Linha 41 - Error logging que pode expor estado
console.error('Erro num listener do store:', error);
```

---

## 🎯 **ESTRATÉGIA DE IMPLEMENTAÇÃO**

### Fase 1: Auditoria Completa (30 min)

1. **Mapear todos os console.log/error/warn**
2. **Identificar exposição de dados sensíveis**
3. **Categorizar por nível de risco**

### Fase 2: Implementação de Sanitização (2h)

1. **Substituir logs diretos por ErrorHandler**
2. **Aplicar sanitização adequada**
3. **Manter debugging útil sem dados sensíveis**

### Fase 3: Validação e Testes (1h)

1. **Verificar que debugging funciona**
2. **Confirmar que dados sensíveis não aparecem**
3. **Executar testes automatizados**

### Fase 4: Documentação (30 min)

1. **Atualizar padrões de logging**
2. **Criar guidelines para novos logs**

---

## 🎯 **MATRIZ DE PRIORIDADES E RISCOS**

### 🔴 **RISCO CRÍTICO - Correção Imediata Obrigatória**

| Arquivo        | Linha   | Problema                | Dados Expostos                            | Ação                    |
| -------------- | ------- | ----------------------- | ----------------------------------------- | ----------------------- |
| **sidebar.js** | 665-668 | `console.log(newValue)` | `isenPKIdp`, dados de regulação completos | Sanitizar completamente |

### 🟡 **RISCO MÉDIO - Correção Necessária**

| Arquivo        | Linha | Problema               | Risco                 | Ação                        |
| -------------- | ----- | ---------------------- | --------------------- | --------------------------- |
| **api.js**     | 131   | `console.log(lockId)`  | ID técnico sensível   | Usar logInfo estruturado    |
| **api.js**     | 1151  | `console.log(data)`    | Dados de sessão       | Sanitizar objeto `data`     |
| **sidebar.js** | 613   | `console.error(error)` | Stack trace com dados | Usar apenas `error.message` |

### 🟢 **RISCO BAIXO - Melhoria Recomendada**

| Arquivo        | Linhas                  | Problema                        | Melhoria                  |
| -------------- | ----------------------- | ------------------------------- | ------------------------- |
| **utils.js**   | 249,277,302,325,346,433 | `console.error` em normalização | Usar logError padronizado |
| **store.js**   | 41                      | `console.error` genérico        | Logging estruturado       |
| **sidebar.js** | 343,389,818,857,860     | Error logging básico            | Categorização adequada    |

---

### 🔧 **1. api.js - Correções Específicas**

#### **Problema 1: Lock Release Logging**

```javascript
// ❌ ATUAL (Linha 131)
console.log(`[Assistente] Lock da regulação ${lockId} liberado com sucesso.`);

// ✅ CORREÇÃO
import { logInfo, ERROR_CATEGORIES } from './ErrorHandler.js';

logInfo(
  'Lock da regulação liberado com sucesso',
  { lockType: 'regulation', hasLockId: !!lockId },
  ERROR_CATEGORIES.SIGSS_API
);
```

#### **Problema 2: Session Keep-Alive**

```javascript
// ❌ ATUAL (Linha 1151)
console.log('Sessão mantida ativa:', data);

// ✅ CORREÇÃO
import { logInfo, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';

logInfo(
  'Sessão mantida ativa',
  sanitizeForLog(data), // Aplica sanitização automática
  ERROR_CATEGORIES.SIGSS_API
);
```

### 🔧 **2. sidebar.js - Correção CRÍTICA**

#### **Problema CRÍTICO: Linha 665-668 - Exposição de Dados de Regulação**

```javascript
// ❌ ATUAL (CRÍTICO - expõe dados médicos completos)
console.log(
  '[Assistente Sidebar] Nova regulação detectada via storage.onChanged:',
  newValue // ← newValue contém isenPKIdp e outros dados sensíveis
);

// ✅ CORREÇÃO OBRIGATÓRIA
import { logInfo, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';

logInfo(
  'Nova regulação detectada via storage.onChanged',
  {
    hasRegulation: !!newValue,
    hasIsenPKIdp: !!newValue?.isenPKIdp,
    regulationType: newValue?.type || 'unknown',
  },
  ERROR_CATEGORIES.MEDICAL_DATA
);
```

#### **Outros Problemas em sidebar.js**

```javascript
// Linha 343 - Error sem contexto
console.error(error);
// CORREÇÃO:
logError('Erro no processamento', error.message, ERROR_CATEGORIES.USER_INTERFACE);

// Linha 613 - Erro no processamento de regulação
console.error('Erro ao processar a regulação:', error);
// CORREÇÃO:
logError('Erro ao processar regulação', error.message, ERROR_CATEGORIES.MEDICAL_DATA);
```

### 🔧 **3. utils.js - Normalization Errors**

```javascript
// ❌ ATUAL
console.error('Failed to normalize consultation data for timeline:', e);

// ✅ CORREÇÃO
import { logError, ERROR_CATEGORIES } from './ErrorHandler.js';

logError(
  'Falha ao normalizar dados de consulta para timeline',
  e.message, // Só a mensagem, não o objeto de erro completo
  ERROR_CATEGORIES.MEDICAL_DATA
);
```

### 🔧 **4. store.js - State Error Handling**

```javascript
// ❌ ATUAL
console.error('Erro num listener do store:', error);

// ✅ CORREÇÃO
import { logError, ERROR_CATEGORIES } from './ErrorHandler.js';

logError(
  'Erro em listener do store',
  {
    message: error.message,
    listenerCount: listeners.length,
    hasState: !!state,
  },
  ERROR_CATEGORIES.EXTENSION_LIFECYCLE
);
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### ✅ **Auditoria (30 min)**

- [ ] Executar busca completa: `grep -r "console\.(log|error|warn)" --include="*.js" .`
- [ ] Mapear cada occurrence em planilha
- [ ] Classificar por risco: 🔴 Alto, 🟡 Médio, 🟢 Baixo
- [ ] Identificar dados sensíveis em cada log

### ✅ **Correção api.js (45 min)**

- [ ] Corrigir linha 131 (lock release)
- [ ] Corrigir linha 1151 (session keep-alive)
- [ ] Adicionar imports do ErrorHandler
- [ ] Testar que logs funcionam corretamente

### ✅ **Correção sidebar.js (60 min)**

- [ ] Analisar linha 665 completa
- [ ] Corrigir todos os console.error que podem expor dados
- [ ] Substituir por logError com sanitização
- [ ] Verificar debugging ainda funciona

### ✅ **Correção utils.js (30 min)**

- [ ] Corrigir normalization errors (linhas 249, 277, 302, 325, 346, 433)
- [ ] Usar logError em vez de console.error
- [ ] Manter informações úteis para debug

### ✅ **Correção store.js (15 min)**

- [ ] Corrigir linha 41
- [ ] Implementar logging estruturado

### ✅ **Validação (60 min)**

- [ ] Executar todos os testes: `npm run test`
- [ ] Verificar compliance: `npm run validate:security`
- [ ] Testar debugging em dev environment
- [ ] Confirmar que dados sensíveis não aparecem

---

## 🧪 **ESTRATÉGIA DE TESTE**

### **Teste 1: Dados Sensíveis Não Expostos**

```javascript
// Executar com dados sensíveis e verificar logs
const testData = {
  nome: 'João da Silva',
  cpf: '123.456.789-10',
  cns: '123456789012345',
};

// Verificar que logs não contêm dados reais
logInfo('Teste de sanitização', testData);
// Deve aparecer: [SANITIZED_MEDICAL_DATA] em vez dos dados reais
```

### **Teste 2: Debugging Ainda Funciona**

```javascript
// Verificar que informações técnicas ainda aparecem
logInfo('Operação realizada', {
  id: 'technical-id-123',
  status: 'success',
  timestamp: new Date(),
});
// Deve mostrar IDs técnicos e status
```

### **Teste 3: Categorização Correta**

```javascript
// Verificar que logs aparecem nas categorias corretas
logError('Erro de API', 'Network timeout', ERROR_CATEGORIES.SIGSS_API);
// Deve aparecer com prefixo [sigss_api]
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### ✅ **Critérios de Aceitação**

1. **Zero dados sensíveis em logs**: Nenhum CPF, CNS, nome, ou dado pessoal/médico em logs
2. **Debugging funcional**: Informações técnicas ainda disponíveis para desenvolvimento
3. **Categorização adequada**: Logs categorizados corretamente
4. **Performance mantida**: Sem impacto significativo na performance
5. **Testes passando**: Todos os testes unitários e de compliance passando

### 📈 **Métricas Quantitativas**

- **Logs auditados**: 100% dos console.log/error/warn
- **Replacements feitos**: Todas as ocorrências com risco identificado
- **Test coverage**: Mantido ou melhorado
- **Build time**: Sem degradação significativa

---

## 🔒 **COMPLIANCE E SEGURANÇA**

### **LGPD Compliance**

- ✅ Dados pessoais não são processados em logs
- ✅ Pseudonimização aplicada onde necessário
- ✅ Minimização de dados implementada

### **HIPAA Compliance**

- ✅ PHI (Protected Health Information) não exposta
- ✅ Logs seguros para auditoria
- ✅ Acesso controlado a informações médicas

### **Medical Data Protection**

- ✅ Identificadores únicos do paciente protegidos
- ✅ Dados demográficos sanitizados
- ✅ Informações de diagnóstico não expostas

---

## 🎯 **OUTPUTS ESPERADOS**

### **Arquivos Modificados**

1. `api.js` - Logging sanitizado
2. `sidebar.js` - Error handling seguro
3. `utils.js` - Normalization errors seguros
4. `store.js` - State error logging seguro

### **Novos Padrões Estabelecidos**

1. **Import obrigatório**: `import { logInfo, logError, ERROR_CATEGORIES } from './ErrorHandler.js'`
2. **Sanitização automática**: Usar `sanitizeForLog()` para dados complexos
3. **Categorização**: Sempre especificar categoria apropriada
4. **Estrutura de dados**: Objetos com informações técnicas, não dados sensíveis

---

## 🚀 **PRÓXIMOS PASSOS**

### **Após Implementação**

1. ✅ Update CHANGELOG.md na seção [Unreleased]
2. ✅ Executar `npm run ci:validate`
3. ✅ Commit com mensagem padrão: `feat(security): implementa sanitização completa de logs médicos - TASK-C-001`
4. ✅ Update documentation para novos desenvolvedores

### **Guidelines para Futuro**

```javascript
// ✅ SEMPRE FAZER - Sistema Centralizado OBRIGATÓRIO
import { logInfo, logError, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';

// Para dados médicos/sensíveis
logInfo('Operação concluída', sanitizeForLog(medicalData), ERROR_CATEGORIES.MEDICAL_DATA);

// Para dados técnicos
logInfo(
  'Cache atualizado',
  { cacheSize: size, timestamp: Date.now() },
  ERROR_CATEGORIES.PERFORMANCE
);

// ❌ NUNCA FAZER - Console direto PROIBIDO
console.log('Dados do paciente:', patientData);
console.error('Erro:', errorWithSensitiveData);
```

### **🚫 POLÍTICA DE LOGGING OBRIGATÓRIA**

#### **NUNCA usar console.log/error/warn direto**

```javascript
// ❌ PROIBIDO - Violação de compliance
console.log(data);
console.error(error);

// ✅ OBRIGATÓRIO - Sistema centralizado
logInfo('Mensagem', sanitizeForLog(data), ERROR_CATEGORIES.APPROPRIATE);
logError('Erro', error.message, ERROR_CATEGORIES.APPROPRIATE);
```

#### **Sempre importar ErrorHandler primeiro**

```javascript
// ✅ PADRÃO OBRIGATÓRIO em TODOS os arquivos .js:
import { logInfo, logError, logWarning, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';

// Contextos onde é OBRIGATÓRIO:
// ✅ Extension pages (sidebar, options, help)
// ✅ Background scripts (background.js)
// ✅ Content scripts (content-script.js)
// ✅ API modules (api.js, utils.js, store.js)
// ✅ UI components (ui/*.js)
// ✅ TODOS os arquivos JavaScript da extensão
```

#### **Categorização obrigatória**

```javascript
// ✅ SEMPRE especificar categoria apropriada:
ERROR_CATEGORIES.MEDICAL_DATA; // Dados médicos
ERROR_CATEGORIES.SIGSS_API; // APIs SIGSS/CADSUS
ERROR_CATEGORIES.USER_INTERFACE; // UI/UX
ERROR_CATEGORIES.EXTENSION_LIFECYCLE; // Ciclo de vida
ERROR_CATEGORIES.SECURITY; // Segurança
ERROR_CATEGORIES.PERFORMANCE; // Performance
```

### **🔧 DESENVOLVIMENTO FUTURO**

#### **Para novos desenvolvedores**

1. **Import obrigatório**: Primeiro import sempre ErrorHandler
2. **Zero console direto**: Usar apenas sistema centralizado
3. **Sanitização automática**: `sanitizeForLog()` para dados complexos
4. **Categorização**: Sempre especificar categoria apropriada

#### **Code Review Checklist**

- [ ] ❌ Nenhum `console.log/error/warn` direto
- [ ] ✅ Import do ErrorHandler presente
- [ ] ✅ Uso de `logInfo/logError/logWarning`
- [ ] ✅ Categorização adequada
- [ ] ✅ Sanitização para dados sensíveis

---

## 🔗 **REFERÊNCIAS TÉCNICAS**

### **ErrorHandler Usage**

- `logInfo(message, data, category)` - Informações gerais
- `logError(message, error, category)` - Erros e exceções
- `logWarning(message, data, category)` - Avisos importantes
- `sanitizeForLog(data)` - Sanitização automática

### **Categorias Disponíveis**

- `ERROR_CATEGORIES.SIGSS_API` - APIs do SIGSS
- `ERROR_CATEGORIES.MEDICAL_DATA` - Dados médicos
- `ERROR_CATEGORIES.USER_INTERFACE` - Interface de usuário
- `ERROR_CATEGORIES.EXTENSION_LIFECYCLE` - Ciclo de vida da extensão
- `ERROR_CATEGORIES.SECURITY` - Questões de segurança

### **Campos Automaticamente Sanitizados**

- `cpf`, `cns`, `rg` - Identificação pessoal
- `nome`, `nome_completo`, `nome_mae` - Nomes
- `data_nascimento`, `idade`, `sexo` - Demografia
- `endereco`, `telefone`, `email` - Contato
- `diagnostico`, `cid`, `medicamento` - Dados médicos

---

## ⚡ **IMPLEMENTAÇÃO RÁPIDA**

### **Script de Busca e Replace**

```bash
# Buscar todos os console.log problemáticos
grep -rn "console\.log.*['\"].*data" --include="*.js" .
grep -rn "console\.error.*['\"].*error" --include="*.js" .

# Verificar se imports do ErrorHandler estão presentes
grep -rn "from.*ErrorHandler" --include="*.js" .
```

### **Template de Correção Rápida**

```javascript
// 1. Adicionar imports no topo do arquivo
import { logInfo, logError, logWarning, ERROR_CATEGORIES, sanitizeForLog } from './ErrorHandler.js';

// 2. Substituir console.log por logInfo
// console.log('Message:', data) -> logInfo('Message', sanitizeForLog(data), ERROR_CATEGORIES.APPROPRIATE_CATEGORY)

// 3. Substituir console.error por logError
// console.error('Error:', error) -> logError('Error', error.message, ERROR_CATEGORIES.APPROPRIATE_CATEGORY)
```

---

**🎯 Com este guia, a TASK-C-001 pode ser implementada de forma segura, eficiente e compliance-ready em aproximadamente 4 horas de trabalho focado.**

---

## 🚀 **RESUMO EXECUTIVO FINAL**

### ✅ **MIGRAÇÃO PARA SISTEMA CENTRALIZADO - OBRIGATÓRIA**

O **ErrorHandler** implementado na TASK-M-005 é **COMPATÍVEL COM TODOS OS CONTEXTOS** da extensão:

- ✅ **Extension Pages** (sidebar, options, help)
- ✅ **Background Scripts** (service workers)
- ✅ **Content Scripts** (contexto isolado)
- ✅ **API Modules** (utils, store, api)
- ✅ **Cross-Browser** (Chrome, Firefox, Edge)

### 🎯 **AÇÕES CRÍTICAS OBRIGATÓRIAS**

1. **🔴 CRÍTICO**: `sidebar.js linha 665` - Remove exposição de dados médicos
2. **🟡 IMPORTANTE**: `api.js linhas 131,1151` - Sanitiza IDs e session data
3. **🟢 RECOMENDADO**: Migrar 100% dos console.log para ErrorHandler

### 📋 **BENEFÍCIOS IMEDIATOS**

- **Compliance LGPD/HIPAA** garantido
- **Sanitização automática** de dados médicos
- **Debugging estruturado** e categorizado
- **Base sólida** para desenvolvimento futuro

### 🔒 **POLÍTICA OBRIGATÓRIA**

```javascript
// ✅ SEMPRE - Sistema centralizado
import { logInfo, logError, ERROR_CATEGORIES } from './ErrorHandler.js';

// ❌ NUNCA - Console direto
console.log(data); // PROIBIDO
```

**O sistema ErrorHandler não tem limitações de navegador e deve ser usado em 100% do código.**
