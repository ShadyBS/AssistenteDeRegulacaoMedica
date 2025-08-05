# 🤖 Plano de Execução IA - Correção Modo Manual

## 🎯 MISSÃO ESPECÍFICA

**OBJETIVO**: Corrigir `SectionManager.js` para que o modo MANUAL seja **completamente manual** - sem automação alguma.

**PROBLEMA ATUAL**: `setPatient()` executa automação mesmo no modo MANUAL.

**SOLUÇÃO**: Adicionar verificação de modo antes de qualquer automação.

## 📋 DESCOBERTAS CRÍTICAS

### ✅ O QUE JÁ EXISTE E FUNCIONA

- **Interface de gatilhos**: `options.html` linhas 1030-1036 ✅ FUNCIONANDO
- **Lógica de detecção**: `sidebar.js` linhas 649-658 ✅ FUNCIONANDO
- **Estrutura de dados**: `rule.triggerKeywords[]` ✅ FUNCIONANDO
- **Método de aplicação**: `SectionManager.applyAutomationFilters()` linha 734 ✅ EXISTE

### ❌ O QUE PRECISA SER CORRIGIDO

- **`SectionManager.setPatient()`**: Linha ~161 - executa automação no modo MANUAL
- **Verificação de modo**: Falta verificar `autoLoad` antes de aplicar filtros

## 🔧 IMPLEMENTAÇÃO EXATA

### 1. Análise do Sistema Existente

**Sistema COMPLETO já implementado:**

```javascript
// ✅ sidebar.js (linhas 649-658) - LÓGICA FUNCIONANDO
for (const rule of automationRules) {
  if (rule.isActive) {
    const hasMatch = rule.triggerKeywords.some((keyword) =>
      contextString.includes(keyword.toLowerCase().trim())
    );

    if (hasMatch) {
      // ✅ Aplica filtros quando gatilho é encontrado
      Object.entries(sectionManagers).forEach(([key, manager]) => {
        if (rule.filterSettings[key] && typeof manager.applyAutomationFilters === 'function') {
          manager.applyAutomationFilters(rule.filterSettings[key], rule.name);
        }
      });
      return;
    }
  }
}
```

**Interface COMPLETA já implementada:**

```html
<!-- ✅ options.html (linhas 1030-1036) - INTERFACE FUNCIONANDO -->
<label for="rule-triggers-input" class="block font-medium text-sm mb-1">
  Palavras-chave de Gatilho (separadas por vírgula)
</label>
<input
  type="text"
  id="rule-triggers-input"
  placeholder="Ex: ecocardiograma, cardiologia, I3581"
  class="w-full px-3 py-2 border border-slate-300 rounded-md"
/>
```

**❌ PROBLEMA**: `SectionManager.js` NÃO está integrado com essa lógica existente.

### 2. Atualização do `SectionManager.js` (ÚNICA MUDANÇA NECESSÁRIA)

```javascript
// ✅ INTEGRAÇÃO: Usar a lógica de gatilhos já implementada no sidebar.js
async setPatient(patient) {
  this.currentPatient = patient;
  this.allData = [];
  this.clearFilters(false);
  this.clearAutomationFeedbackAndFilters(false);
  this.applyFiltersAndRender();

  if (this.elements.section) {
    this.elements.section.classList.toggle('no-patient', !patient);
  }

  // ✅ CORREÇÃO: Verifica modo AUTO para carregamento automático do PACIENTE
  const autoLoadKey = `autoLoad${this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)}`;
  const isAutoMode = this.globalSettings.userPreferences[autoLoadKey];

  if (isAutoMode && patient) {
    console.log(`[Assistente Médico] Modo AUTO: Carregando ${this.sectionKey} automaticamente`);
    this.fetchData(); // ✅ SEMPRE carrega no modo AUTO
  }

  // 🚫 MODO MANUAL: NÃO faz NADA automaticamente
  // Usuário deve clicar manualmente para carregar dados
  // Filtros de automação também não são aplicados

  // ✅ CORREÇÃO: Remove chamada automática de filtros no modo MANUAL
  if (isAutoMode) {
    await this.applyAutomationFilters();
  }
}

/**
 * � REMOVIDA: Função não necessária no modo MANUAL
 * No modo MANUAL, usuário deve clicar manualmente para carregar
 */

/**
 * 🎯 ATUALIZADA: Aplica automação APENAS no modo AUTO
 * Modo MANUAL não executa nenhuma automação
 */
async applyAutomationFilters() {
  if (!this.currentPatient) return;

  // 🚫 MODO MANUAL: Não aplica filtros automaticamente
  const autoLoadKey = `autoLoad${this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)}`;
  const isAutoMode = this.globalSettings.userPreferences[autoLoadKey];

  if (!isAutoMode) {
    console.log('[Assistente Médico] Modo MANUAL: Filtros de automação desabilitados');
    return;
  }

  const automationRules = this.globalSettings.automationRules || [];
  if (automationRules.length === 0) return;

  // ✅ Apenas no MODO AUTO: usa lógica já implementada do sidebar.js
  const contextString = this.getCurrentPageContent().toLowerCase();

  for (const rule of automationRules) {
    if (!rule.isActive) continue;

    const hasMatch = rule.triggerKeywords?.some((keyword) =>
      contextString.includes(keyword.toLowerCase().trim())
    );

    if (hasMatch && rule.filterSettings[this.sectionKey]) {
      console.log(`[Assistente Médico] MODO AUTO: Aplicando filtros da regra "${rule.name}" para ${this.sectionKey}`);

      // ✅ USA O MÉTODO JÁ EXISTENTE
      this.applyAutomationFilters(rule.filterSettings[this.sectionKey], rule.name);

      // Mostra feedback visual
      this.showAutomationFeedback([rule]);
      break; // Aplica apenas a primeira regra que faz match
    }
  }
}

/**
 * 🔍 MANTIDA: Obtém conteúdo da página para detecção de gatilhos
 * Compatível com a implementação do sidebar.js
 */
getCurrentPageContent() {
  try {
    // ✅ MESMO PADRÃO usado no sidebar.js para contextString
    const mainContent = document.querySelector('main, .main-content, #content, .content');
    const contentText = mainContent ? mainContent.textContent : document.body.textContent;
    const titleText = document.title || '';

    return `${titleText} ${contentText || ''}`.trim();
  } catch (error) {
    console.error('[Assistente Médico] Erro ao obter conteúdo da página:', error.message);
    return '';
  }
}
```

### 3. Sistema de Gatilhos Existente (MANTER COMO ESTÁ)

**LOCALIZAÇÃO:** `options.html` (linhas 1030-1036) e `options.js`

**✅ SISTEMA COMPLETO JÁ FUNCIONANDO:**

```html
<!-- NO options.html -->
<label for="rule-triggers-input" class="block font-medium text-sm mb-1">
  Palavras-chave de Gatilho (separadas por vírgula)
</label>
<input
  type="text"
  id="rule-triggers-input"
  placeholder="Ex: ecocardiograma, cardiologia, I3581"
  class="w-full px-3 py-2 border border-slate-300 rounded-md"
/>
```

**✅ FUNCIONALIDADES JÁ DISPONÍVEIS:**

- ✅ Campo de input para palavras-chave
- ✅ Separação por vírgula automática
- ✅ Salvamento em `rule.triggerKeywords`
- ✅ Interface completa de CRUD de regras
- ✅ Edição e duplicação de regras
- ✅ Reordenação por prioridade (drag & drop)

**✅ ESTRUTURA DE DADOS JÁ FUNCIONANDO:**

```javascript
// Exemplo de regra salva no sistema atual
const automationRule = {
  id: '1640995200000',
  name: 'Cardiologia Urgente',
  triggerKeywords: ['cardiologia', 'cardio', 'urgente', 'infarto'], // ✅ JÁ EXISTE!
  isActive: true,
  filterSettings: {
    consultations: {
      /* filtros */
    },
    exams: {
      /* filtros */
    },
    // ... outras seções
  },
};
```

**✅ DETECÇÃO JÁ IMPLEMENTADA NO `sidebar.js`:**

```javascript
// Lógica já implementada em sidebar.js (linhas 649-658)
for (const rule of automationRules) {
  if (rule.isActive) {
    const hasMatch = rule.triggerKeywords.some((keyword) =>
      contextString.includes(keyword.toLowerCase().trim())
    );

    if (hasMatch) {
      // ✅ Aplica filtros quando gatilho é encontrado
      Object.entries(sectionManagers).forEach(([key, manager]) => {
        if (rule.filterSettings[key] && typeof manager.applyAutomationFilters === 'function') {
          manager.applyAutomationFilters(rule.filterSettings[key], rule.name);
        }
      });
      return;
    }
  }
}
```

**🔴 ÚNICO PROBLEMA:** A lógica de gatilhos já funciona no `sidebar.js`, mas **não está integrada** com o `SectionManager.js` para o carregamento manual/automático.

### 4. Estrutura de Dados (JÁ IMPLEMENTADA)

```javascript
// ✅ Estrutura já implementada e funcionando
const automationRule = {
  id: 'cardiologia-urgente-001',
  name: 'Cardiologia Urgente',

  // 🔍 GATILHOS - sistema já implementado
  triggerKeywords: [
    'cardiologia',
    'cardio',
    'coração',
    'urgente',
    'emergência',
    'infarto',
    'arritmia',
  ],

  // Condições do paciente (já implementado)
  conditions: {
    ageMin: 18,
    ageMax: 99,
    specialty: 'cardiologia',
  },

  // Ações a executar (já implementado)
  filterSettings: {
    exams: {
      priority: 'alta',
      status: 'pendente',
      dateRange: 'last30days',
    },
    consultations: {
      specialty: 'cardiologia',
      urgency: 'alta',
    },
  },
};
```

## 📋 COMPORTAMENTO CORRETO (APÓS INTEGRAÇÃO)

### Matriz de Comportamento

| Modo       | Paciente          | Gatilho Detectado | Filtros Aplicados | Resultado Final                  |
| ---------- | ----------------- | ----------------- | ----------------- | -------------------------------- |
| **AUTO**   | ✅ Sempre carrega | ❌ Não            | ❌ Não            | ✅ **Dados básicos carregados**  |
| **AUTO**   | ✅ Sempre carrega | ✅ Sim            | ✅ Sim            | ✅ **Dados + filtros aplicados** |
| **MANUAL** | ❌ Nunca carrega  | ❌ Não            | ❌ Não            | ❌ **Nada carregado**            |
| **MANUAL** | ❌ Nunca carrega  | ✅ Sim            | ❌ Não            | ❌ **Nada carregado**            |

### Fluxo de Execução (CORRIGIDO)

```text
1. 👤 Usuário seleciona paciente
   ↓
2. 🔄 setPatient() é chamado
   ↓
3. ❓ É MODO AUTO?
   ├─ ✅ SIM → fetchData() + applyAutomationFilters()
   └─ ❌ NÃO → Para aqui (NADA automático)
   ↓
4. (Apenas MODO AUTO) 🔍 applyAutomationFilters()
   ↓
5. (Apenas MODO AUTO) 📄 getCurrentPageContent()
   ↓
6. (Apenas MODO AUTO) ⚡ Verifica triggerKeywords
   ↓
7. (Apenas MODO AUTO) ❓ Gatilho encontrado?
   ├─ ❌ NÃO → Dados básicos carregados
   └─ ✅ SIM → Aplica filtros + dados carregados
   ↓
8. ✅ MODO AUTO: Dados carregados (com ou sem filtros)
   ❌ MODO MANUAL: Nada automático
```

## 🧪 VALIDAÇÃO E TESTES

### Casos de Teste

#### Modo AUTO (autoLoad = true)

| Cenário             | Página Contém          | Gatilhos Config   | Paciente Carregado | Filtros Aplicados |
| ------------------- | ---------------------- | ----------------- | ------------------ | ----------------- |
| AUTO + Sem contexto | "consulta geral"       | `["cardiologia"]` | ✅ **SIM**         | ❌ Não            |
| AUTO + Com contexto | "consulta cardiologia" | `["cardiologia"]` | ✅ **SIM**         | ✅ **SIM**        |
| AUTO + Sem regras   | "qualquer coisa"       | `[]` (sem regras) | ✅ **SIM**         | ❌ Não            |

#### Modo MANUAL (autoLoad = false)

| Cenário               | Página Contém          | Gatilhos Config   | Paciente Carregado | Filtros Aplicados |
| --------------------- | ---------------------- | ----------------- | ------------------ | ----------------- |
| MANUAL + Sem contexto | "consulta geral"       | `["cardiologia"]` | ❌ Não             | ❌ Não            |
| MANUAL + Com contexto | "consulta cardiologia" | `["cardiologia"]` | ✅ **SIM**         | ✅ **SIM**        |
| MANUAL + Sem regras   | "qualquer coisa"       | `[]` (sem regras) | ❌ Não             | ❌ Não            |

### Logs Esperados (APÓS INTEGRAÇÃO)

#### Modo AUTO sem gatilho

```log
[Assistente Médico] Modo AUTO: Carregando exams automaticamente
[Assistente Médico] Nenhum gatilho de automação detectado - filtros não aplicados
```

#### Modo AUTO com gatilho

```log
[Assistente Médico] Modo AUTO: Carregando exams automaticamente
[Assistente Médico] Aplicando filtros da regra "Cardiologia Urgente" para exams
```

#### Modo MANUAL sem gatilho

```log
[Assistente Médico] Modo MANUAL: Nenhuma automação executada
```

#### Modo MANUAL com gatilho

```log
[Assistente Médico] Modo MANUAL: Filtros de automação desabilitados
```

## 🚀 CRONOGRAMA DE INTEGRAÇÃO

### ✅ Fase 1: Análise (COMPLETA)

- [x] Verificar interface existente de regras ✅ **ENCONTRADA**
- [x] Analisar implementação do `sidebar.js` ✅ **FUNCIONANDO**
- [x] Identificar problema no `SectionManager.js` ✅ **NÃO INTEGRADO**
- [x] Confirmar estrutura de dados `triggerKeywords` ✅ **IMPLEMENTADA**

### 🔧 Fase 2: Correção (FOCO PRINCIPAL)

- [ ] **ÚNICA TAREFA**: Corrigir `SectionManager.js` para respeitar modo MANUAL
- [ ] Remover qualquer automação no modo MANUAL
- [ ] Manter automação apenas no modo AUTO
- [ ] Preservar compatibilidade com interface atual

### 🧪 Fase 3: Validação

- [ ] Testar comportamento em modo AUTO vs MANUAL
- [ ] Validar que modo MANUAL não executa nenhuma automação
- [ ] Verificar que interface de configuração permanece igual
- [ ] Executar `npm run ci:validate`

### 📦 Fase 4: Build e Deploy

- [ ] Executar `npm run build:css` (se necessário)
- [ ] Executar `npm run build:zips`
- [ ] Atualizar `CHANGELOG.md`
- [ ] Commit e release

**NOTA CRÍTICA**: Esta é uma **correção**, não integração. O modo MANUAL deve ser **completamente manual** - sem automação alguma.

## 📝 COMANDOS DE BUILD

### Desenvolvimento

```bash
npm run dev              # Desenvolvimento com watch
npm run lint:fix         # Fix linting issues
npm run test:unit        # Testes unitários
```

### Build

```bash
npm run build:css        # Build TailwindCSS
npm run build:zips       # Generate browser packages
npm run ci:validate      # Validação completa
```

### Release

```bash
npm run release:patch    # Release patch version
```

## ✅ CHECKLIST DE INTEGRAÇÃO

### Implementação

- [ ] `SectionManager.js` **corrigido** para respeitar modo MANUAL
- [ ] Modo MANUAL não executa nenhuma automação
- [ ] Modo AUTO continua com automação de gatilhos
- [ ] Compatibilidade total com regras e interface existentes

### Qualidade

- [ ] `npm run ci:validate` passou
- [ ] Medical data security verificada
- [ ] Cross-browser testado
- [ ] Logs seguros implementados

### Funcionalidade

- [ ] Modo AUTO carrega sempre + aplica filtros se gatilho
- [ ] Modo MANUAL **nunca** executa automação
- [ ] Interface de regras continua funcionando (apenas para modo AUTO)
- [ ] Usuário tem controle total no modo MANUAL

### Deploy

- [ ] CSS/ZIPs rebuilt (se necessário)
- [ ] Version bumped
- [ ] Commit realizado
- [ ] Funcionalidade testada no contexto SIGSS

**IMPORTANTE**: O modo MANUAL deve ser **completamente manual** - sem qualquer automação.

## 🚨 AVISOS IMPORTANTES

### Segurança Médica

- ❌ Nunca logar dados médicos sensíveis
- ✅ Sanitizar logs de debug
- ✅ Verificar conformidade LGPD

### Compatibilidade

- ✅ Testar em Chrome/Firefox/Edge
- ✅ Verificar Manifest V3 compliance
- ✅ Validar CSP policies

### Performance

- ✅ Debounce detecção de gatilhos se necessário
- ✅ Cache de conteúdo da página
- ✅ Evitar múltiplas chamadas `fetchData()`

## 📚 RESUMO EXECUTIVO

### 🔍 Situação Descoberta

- ✅ **Sistema de gatilhos COMPLETO** já implementado
- ✅ **Interface funcional** para configuração de regras
- ✅ **Detecção ativa** funcionando no `sidebar.js`
- ❌ **Não integrado** com carregamento manual/auto do `SectionManager.js`

### 🎯 Tarefa Real

**CORRIGIR** (não integrar) o comportamento para que:

1. **Modo AUTO**: Continue carregando sempre + aplique filtros se gatilho
2. **Modo MANUAL**: **ZERO automação** - usuário controla tudo manualmente
3. **Mantém** toda a funcionalidade existente do sistema de regras (só no AUTO)

### 💻 Mudança Necessária

**Apenas no `SectionManager.js`:**

- Remover qualquer automação no modo MANUAL
- Manter `applyAutomationFilters()` apenas para modo AUTO
- Usuário clica manualmente para carregar dados no modo MANUAL

### ⏱️ Estimativa

**< 1 hora** de trabalho real, pois é **correção simples**.

---

Esta correção resolve definitivamente o problema do carregamento automático, garantindo que o modo MANUAL seja **completamente manual** e o modo AUTO mantenha a automação inteligente baseada em gatilhos.

## 📚 REFERÊNCIAS

- [Projeto AssistenteDeRegulacaoMedica](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica)
- [Guia de Agentes AI](../agents.md)
- [Documentação SIGSS](../SIGSS_DOCUMENTATION.md)
- [CHANGELOG do Projeto](../CHANGELOG.md)
