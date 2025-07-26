/**
 * @file Módulo SectionManager, responsável por gerir uma secção inteira da sidebar.
 */

import { filterConfig } from "./filter-config.js";
import * as Utils from "./utils.js";
import * as API from "./api.js";
import { store } from "./store.js";
import { CONFIG, getSectionName, getTimeout } from "./config.js";

/**
 * Tipos de erro para classificação e tratamento específico
 */
const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication', 
  SERVER: 'server',
  TIMEOUT: 'timeout',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

/**
 * Configurações para retry automático
 */
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 segundo
  MAX_DELAY: 10000, // 10 segundos
  BACKOFF_FACTOR: 2
};

/**
 * Classifica o tipo de erro baseado na mensagem e propriedades
 * @param {Error} error - O erro a ser classificado
 * @returns {string} Tipo do erro
 */
function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  const message = error.message?.toLowerCase() || '';
  
  // Erros de rede/conectividade
  if (error.name === 'TypeError' && message.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }
  
  if (message.includes('network') || message.includes('connection') || 
      message.includes('conectividade') || message.includes('conexão')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Erros de autenticação
  if (message.includes('401') || message.includes('403') || 
      message.includes('unauthorized') || message.includes('forbidden') ||
      message.includes('sessão') || message.includes('login')) {
    return ERROR_TYPES.AUTHENTICATION;
  }
  
  // Erros de timeout
  if (message.includes('timeout') || message.includes('tempo limite')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  // Erros do servidor
  if (message.includes('500') || message.includes('502') || 
      message.includes('503') || message.includes('504') ||
      message.includes('server') || message.includes('servidor')) {
    return ERROR_TYPES.SERVER;
  }
  
  // Erros de validação
  if (message.includes('validation') || message.includes('validação') ||
      message.includes('invalid') || message.includes('inválido')) {
    return ERROR_TYPES.VALIDATION;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Gera mensagem de erro amigável baseada no tipo
 * @param {string} errorType - Tipo do erro
 * @param {string} sectionName - Nome da seção
 * @param {Error} originalError - Erro original
 * @returns {object} Objeto com mensagem e sugestões
 */
function generateUserFriendlyMessage(errorType, sectionName, originalError) {
  const messages = {
    [ERROR_TYPES.NETWORK]: {
      title: 'Problema de Conexão',
      message: `Não foi possível conectar ao servidor para carregar ${sectionName}.`,
      suggestions: [
        'Verifique sua conexão com a internet',
        'Tente novamente em alguns segundos',
        'Verifique se o SIGSS está acessível'
      ],
      canRetry: true,
      severity: 'warning'
    },
    [ERROR_TYPES.AUTHENTICATION]: {
      title: 'Sessão Expirada',
      message: `Sua sessão no SIGSS expirou. É necessário fazer login novamente.`,
      suggestions: [
        'Faça login no SIGSS em uma nova aba',
        'Recarregue esta página após o login',
        'Verifique suas credenciais'
      ],
      canRetry: false,
      severity: 'error'
    },
    [ERROR_TYPES.SERVER]: {
      title: 'Erro do Servidor',
      message: `O servidor do SIGSS está temporariamente indisponível para ${sectionName}.`,
      suggestions: [
        'Tente novamente em alguns minutos',
        'O problema pode ser temporário',
        'Contate o suporte se persistir'
      ],
      canRetry: true,
      severity: 'error'
    },
    [ERROR_TYPES.TIMEOUT]: {
      title: 'Tempo Limite Excedido',
      message: `A requisição para ${sectionName} demorou mais que o esperado.`,
      suggestions: [
        'Tente novamente com um período menor',
        'Verifique a estabilidade da conexão',
        'O servidor pode estar sobrecarregado'
      ],
      canRetry: true,
      severity: 'warning'
    },
    [ERROR_TYPES.VALIDATION]: {
      title: 'Dados Inválidos',
      message: `Os dados fornecidos para ${sectionName} são inválidos.`,
      suggestions: [
        'Verifique os filtros aplicados',
        'Confirme as datas selecionadas',
        'Limpe os filtros e tente novamente'
      ],
      canRetry: false,
      severity: 'warning'
    },
    [ERROR_TYPES.UNKNOWN]: {
      title: 'Erro Inesperado',
      message: `Ocorreu um erro inesperado ao carregar ${sectionName}.`,
      suggestions: [
        'Tente recarregar a página',
        'Verifique a configuração da URL base',
        'Contate o suporte técnico se persistir'
      ],
      canRetry: true,
      severity: 'error'
    }
  };
  
  return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
}

/**
 * Calcula delay para retry com backoff exponencial
 * @param {number} attempt - Número da tentativa (começando em 1)
 * @returns {number} Delay em milissegundos
 */
function calculateRetryDelay(attempt) {
  const delay = RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
}

/**
 * Gera o HTML para o indicador de ordenação (seta para cima/baixo).
 * @param {string} key - A chave da coluna atual.
 * @param {object} state - O objeto de estado de ordenação da secção.
 * @returns {string} O caractere da seta ou uma string vazia.
 */
export function getSortIndicator(key, state) {
  if (state.key !== key) return "";
  return state.order === "asc" ? "▲" : "▼";
}

export class SectionManager {
  /**
   * @param {string} sectionKey - A chave da secção (ex: "consultations").
   * @param {object} config - Configurações específicas da secção.
   * @param {Function} config.fetchFunction - A função da API para buscar dados.
   * @param {Function} config.renderFunction - A função para renderizar os dados.
   * @param {object} config.initialSortState - O estado inicial de ordenação.
   * @param {object} globalSettings - Configurações globais da aplicação.
   */
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.prefix = this.getPrefix(sectionKey);
    this.config = config;
    this.globalSettings = globalSettings;

    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;
    this.sortState = { ...config.initialSortState };
    this.fetchType = "all";

    this.elements = {};

    this.init();
  }

  getPrefix(sectionKey) {
    const map = {
      consultations: "consultation",
      exams: "exam",
      appointments: "appointment",
      regulations: "regulation",
      documents: "document",
    };
    return map[sectionKey] || sectionKey;
  }

  init() {
    this.cacheDomElements();
    this.renderFilterControls();
    this.addEventListeners();
    store.subscribe(() => this.onStateChange());
  }

  onStateChange() {
    const patientState = store.getPatient();
    const newPatient = patientState ? patientState.ficha : null;

    if (this.currentPatient?.isenPK?.idp !== newPatient?.isenPK?.idp) {
      this.setPatient(newPatient);
    }

    this.populateSavedFilterDropdown();
  }

  cacheDomElements() {
    const { sectionKey, prefix } = this;
    this.elements = {
      section: document.getElementById(`${sectionKey}-section`),
      wrapper: document.getElementById(`${sectionKey}-wrapper`),
      content: document.getElementById(`${sectionKey}-content`),
      fetchBtn: document.getElementById(`fetch-${sectionKey}-btn`),
      toggleBtn: document.getElementById(`toggle-${sectionKey}-list-btn`),
      toggleMoreBtn: document.getElementById(
        `toggle-more-${prefix}-filters-btn`
      ),
      clearBtn: document.getElementById(`clear-${prefix}-filters-btn`),
      mainFilters: document.getElementById(`${prefix}-main-filters`),
      moreFilters: document.getElementById(`${prefix}-more-filters`),
      automationFeedback: document.getElementById(
        `${sectionKey}-automation-feedback`
      ),
    };
  }

  addEventListeners() {
    this.elements.fetchBtn?.addEventListener("click", () => this.fetchData());
    this.elements.toggleBtn?.addEventListener("click", () =>
      this.toggleSection()
    );
    this.elements.toggleMoreBtn?.addEventListener("click", () =>
      this.toggleMoreFilters()
    );
    this.elements.clearBtn?.addEventListener("click", () =>
      this.clearFilters()
    );

    this.elements.section?.addEventListener(
      "input",
      Utils.debounce((e) => {
        if (e.target.matches("input[type='text'], input[type='date']"))
          this.applyFiltersAndRender();
      }, getTimeout('DEBOUNCE_FILTERS'))
    );

    this.elements.section?.addEventListener("change", (e) => {
      if (e.target.matches("select, input[type='checkbox']")) {
        if (e.target.closest(".filter-select-group")) {
          this.handleFetchTypeChange(e.target);
        } else {
          this.applyFiltersAndRender();
        }
      }
      if (e.target.id === `${this.prefix}-saved-filters-select`)
        this.loadFilterSet();
    });

    this.elements.section?.addEventListener("click", (e) => {
      const target = e.target;
      const sortHeader = target.closest(".sort-header");
      if (sortHeader) this.handleSort(sortHeader.dataset.sortKey);

      if (target.closest(`#${this.prefix}-save-filter-btn`))
        this.saveFilterSet();
      if (target.closest(`#${this.prefix}-delete-filter-btn`))
        this.deleteFilterSet();
      if (target.closest(".clear-automation-btn")) {
        this.clearAutomationFeedbackAndFilters(true);
      }
    });
  }

  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearFilters(false); // Reseta os filtros para o padrão ao trocar de paciente.
    this.clearAutomationFeedbackAndFilters(false);
    this.applyFiltersAndRender();

    if (this.elements.section) {
      this.elements.section.style.display = patient ? "block" : "none";
    }

    if (
      patient &&
      this.globalSettings.userPreferences[
        `autoLoad${
          this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)
        }`
      ]
    ) {
      this.fetchData();
    }
  }

  async fetchData() {
    if (!this.currentPatient) {
      if (this.elements.section.style.display !== "none")
        Utils.showMessage("Nenhum paciente selecionado.");
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.elements.content.innerHTML =
      `<p class="${CONFIG.CSS_CLASSES.BG_LOADING}">Carregando...</p>`;

    try {
      const fetchTypeElement = this.elements.mainFilters?.querySelector(
        `#${this.prefix}-fetch-type-buttons`
      );
      if (fetchTypeElement) {
        this.fetchType = fetchTypeElement.value;
      }

      const dataInicialValue = this.elements.dateInitial
        ? this.elements.dateInitial.value
        : null;
      const dataFinalValue = this.elements.dateFinal
        ? this.elements.dateFinal.value
        : null;

      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: dataInicialValue
          ? new Date(dataInicialValue).toLocaleDateString("pt-BR")
          : CONFIG.DATES.DEFAULT_START,
        dataFinal: dataFinalValue
          ? new Date(dataFinalValue).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR"),
        type: this.fetchType,
      };

      if (this.sectionKey === "exams") {
        params.comResultado =
          this.fetchType === "withResult" || this.fetchType === "all";
        params.semResultado =
          this.fetchType === "withoutResult" || this.fetchType === "all";
      }

      const result = await this.config.fetchFunction(params);
      this.allData = Array.isArray(result) ? result : result.jsonData || [];
    } catch (error) {
      console.error(`Erro ao buscar dados para ${this.sectionKey}:`, error);
      this.handleFetchError(error);
    } finally {
      this.isLoading = false;
      this.applyFiltersAndRender();
    }
  }

  /**
   * Trata erros de fetch com retry automático e feedback amigável
   * @param {Error} error - Erro ocorrido durante o fetch
   * @param {number} attempt - Número da tentativa atual (padrão: 1)
   */
  async handleFetchError(error, attempt = 1) {
    const friendlyName = getSectionName(this.sectionKey) || this.sectionKey;
    const errorType = classifyError(error);
    const errorInfo = generateUserFriendlyMessage(errorType, friendlyName, error);
    
    console.error(`[${this.sectionKey}] Erro (tentativa ${attempt}):`, error);
    
    // Verifica se deve tentar novamente
    if (errorInfo.canRetry && attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
      const delay = calculateRetryDelay(attempt);
      
      // Mostra feedback de retry para o usuário
      this.showRetryFeedback(attempt, delay, errorInfo);
      
      // Aguarda o delay e tenta novamente
      setTimeout(async () => {
        try {
          console.log(`[${this.sectionKey}] Tentativa ${attempt + 1} de ${RETRY_CONFIG.MAX_ATTEMPTS}`);
          await this.fetchData();
        } catch (retryError) {
          // Recursivamente tenta novamente ou falha definitivamente
          await this.handleFetchError(retryError, attempt + 1);
        }
      }, delay);
      
      return;
    }
    
    // Falha definitiva - mostra erro final
    this.showFinalError(errorInfo, attempt);
    
    // Define estado dos dados baseado no tipo de erro
    if (errorType === ERROR_TYPES.AUTHENTICATION || errorType === ERROR_TYPES.VALIDATION) {
      // Mantém dados anteriores para erros que não invalidam os dados
      if (!this.allData || this.allData.length === 0) {
        this.allData = [];
      }
    } else {
      // Limpa dados para outros tipos de erro
      this.allData = [];
    }
    
    // Mostra mensagem global
    Utils.showMessage(errorInfo.message, errorInfo.severity === 'error' ? 'error' : 'warning');
  }

  /**
   * Mostra feedback durante tentativas de retry
   * @param {number} attempt - Número da tentativa atual
   * @param {number} delay - Delay até a próxima tentativa
   * @param {object} errorInfo - Informações do erro
   */
  showRetryFeedback(attempt, delay, errorInfo) {
    const delaySeconds = Math.ceil(delay / 1000);
    const remainingAttempts = RETRY_CONFIG.MAX_ATTEMPTS - attempt;
    
    this.elements.content.innerHTML = `
      <div class="p-4 text-center">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center justify-center mb-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <span class="ml-2 text-yellow-800 font-medium">${errorInfo.title}</span>
          </div>
          <p class="text-yellow-700 mb-3">${errorInfo.message}</p>
          <p class="text-yellow-600 text-sm mb-3">
            Tentando novamente em ${delaySeconds} segundos... 
            (${remainingAttempts} tentativa${remainingAttempts !== 1 ? 's' : ''} restante${remainingAttempts !== 1 ? 's' : ''})
          </p>
          <button id="${this.prefix}-cancel-retry-btn" 
                  class="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">
            Cancelar Retry
          </button>
        </div>
      </div>`;
    
    // Adiciona listener para cancelar retry
    const cancelBtn = this.elements.content.querySelector(`#${this.prefix}-cancel-retry-btn`);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.showFinalError(errorInfo, attempt);
      });
    }
  }

  /**
   * Mostra erro final quando todas as tentativas falharam
   * @param {object} errorInfo - Informações do erro
   * @param {number} totalAttempts - Total de tentativas realizadas
   */
  showFinalError(errorInfo, totalAttempts) {
    const severityClass = errorInfo.severity === 'error' ? 'red' : 'yellow';
    const bgClass = `bg-${severityClass}-50`;
    const borderClass = `border-${severityClass}-200`;
    const textClass = `text-${severityClass}-800`;
    const textSecondaryClass = `text-${severityClass}-600`;
    
    let attemptsText = '';
    if (totalAttempts > 1) {
      attemptsText = `<p class="${textSecondaryClass} text-sm mb-3">
        Falhou após ${totalAttempts} tentativa${totalAttempts !== 1 ? 's' : ''}
      </p>`;
    }
    
    const suggestionsHtml = errorInfo.suggestions.map(suggestion => 
      `<li class="${textSecondaryClass} text-sm">${suggestion}</li>`
    ).join('');
    
    this.elements.content.innerHTML = `
      <div class="p-4">
        <div class="${bgClass} ${borderClass} border rounded-lg p-4">
          <div class="flex items-center mb-3">
            <svg class="h-5 w-5 ${textClass} mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <h3 class="${textClass} font-medium">${errorInfo.title}</h3>
          </div>
          <p class="${textClass} mb-3">${errorInfo.message}</p>
          ${attemptsText}
          
          <div class="mb-4">
            <h4 class="${textClass} text-sm font-medium mb-2">Sugestões:</h4>
            <ul class="list-disc list-inside space-y-1">
              ${suggestionsHtml}
            </ul>
          </div>
          
          <div class="flex gap-2">
            <button id="${this.prefix}-retry-manual-btn" 
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
              Tentar Novamente
            </button>
            <button id="${this.prefix}-clear-filters-btn" 
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>`;
    
    // Adiciona listeners para ações
    const retryBtn = this.elements.content.querySelector(`#${this.prefix}-retry-manual-btn`);
    const clearBtn = this.elements.content.querySelector(`#${this.prefix}-clear-filters-btn`);
    
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.fetchData();
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
        this.fetchData();
      });
    }
  }

  
  applyFiltersAndRender() {
    let filteredData = [...this.allData];
    if (this.config.filterLogic) {
      filteredData = this.config.filterLogic(
        filteredData,
        this.getFilterValues(),
        this.fetchType
      );
    }
    const sortedData = this.sortData(filteredData);
    this.config.renderFunction(sortedData, this.sortState, this.globalSettings);
    this.updateActiveFiltersIndicator();
  }

  sortData(data) {
    const { key, order } = this.sortState;
    return [...data].sort((a, b) => {
      let valA, valB;
      if (key === "date" || key === "sortableDate") {
        valA = a.sortableDate || Utils.parseDate(a.date);
        valB = b.sortableDate || Utils.parseDate(b.date);
      } else {
        valA = (a[key] || "").toString().toLowerCase();
        valB = (b[key] || "").toString().toLowerCase();
      }
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }

  getFilterValues() {
    const values = {};
    const filters = filterConfig[this.sectionKey] || [];
    filters.forEach((filter) => {
      if (filter.type === "component") return;

      const el = document.getElementById(filter.id);
      if (el) {
        values[filter.id] = el.type === "checkbox" ? el.checked : el.value;
      }
    });
    return values;
  }

  toggleSection() {
    this.elements.wrapper?.classList.toggle("show");
    this.elements.toggleBtn.textContent =
      this.elements.wrapper.classList.contains("show")
        ? "Recolher"
        : "Expandir";
  }

  toggleMoreFilters() {
    const shouldShow = !this.elements.moreFilters.classList.contains("show");
    this.elements.moreFilters.classList.toggle("show", shouldShow);
    this.elements.toggleMoreBtn.querySelector(".button-text").textContent =
      shouldShow ? "Menos filtros" : "Mais filtros";
    this.updateActiveFiltersIndicator();
  }

  clearFilters(shouldRender = true) {
    const sectionLayout =
      this.globalSettings.filterLayout[this.sectionKey] || [];
    const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

    // --- INÍCIO DA CORREÇÃO ---
    // Reseta o período de busca para o padrão global da seção
    const dateRangeDefaults =
      this.globalSettings.userPreferences.dateRangeDefaults;
    const defaultRanges = {
      consultations: { start: -6, end: 0 },
      exams: { start: -6, end: 0 },
      appointments: { start: -1, end: 3 },
      regulations: { start: -12, end: 0 },
      documents: { start: -24, end: 0 },
    };
    const range =
      dateRangeDefaults[this.sectionKey] || defaultRanges[this.sectionKey];
    if (this.elements.dateInitial)
      this.elements.dateInitial.valueAsDate = Utils.calculateRelativeDate(
        range.start
      );
    if (this.elements.dateFinal)
      this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(
        range.end
      );
    // --- FIM DA CORREÇÃO ---

    (filterConfig[this.sectionKey] || []).forEach((filter) => {
      if (filter.type === "component") return;

      const el = document.getElementById(filter.id);
      if (el) {
        const savedFilterSettings = layoutMap.get(filter.id);
        let defaultValue;

        if (
          savedFilterSettings &&
          savedFilterSettings.defaultValue !== undefined
        ) {
          defaultValue = savedFilterSettings.defaultValue;
        } else {
          defaultValue =
            filter.defaultChecked ??
            (filter.options ? filter.options[0].value : "");
        }

        if (el.type === "checkbox") {
          el.checked = defaultValue;
        } else {
          el.value = defaultValue;
        }

        if (el.classList.contains("filter-select-group")) {
          this.handleFetchTypeChange(el);
        }
      }
    });
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }

  handleSort(sortKey) {
    if (this.sortState.key === sortKey) {
      this.sortState.order = this.sortState.order === "asc" ? "desc" : "asc";
    } else {
      this.sortState.key = sortKey;
      this.sortState.order = "desc";
    }
    this.applyFiltersAndRender();
  }

  handleFetchTypeChange(element) {
    this.fetchType = element.value || element.dataset.fetchType;
    this.fetchData();
  }

  updateActiveFiltersIndicator() {
    const indicator = this.elements.toggleMoreBtn?.querySelector(
      "span:not(.button-text)"
    );
    if (!indicator || !this.elements.moreFilters) return;
    const isShown = this.elements.moreFilters.classList.contains("show");
    let activeCount = 0;
    const filterElements =
      this.elements.moreFilters.querySelectorAll("input, select");
    filterElements.forEach((el) => {
      if (
        (el.type === "select-one" || el.type === "select") &&
        el.value !== "todos" &&
        el.value !== "todas" &&
        el.value !== "" &&
        el.value !== "all"
      )
        activeCount++;
      else if (el.type === "text" && el.value.trim() !== "") activeCount++;
      else if (el.type === "checkbox" && el.checked) activeCount++;
    });
    if (activeCount > 0 && !isShown) {
      indicator.textContent = activeCount;
      indicator.classList.remove("hidden");
    } else {
      indicator.classList.add("hidden");
    }
  }

  saveFilterSet() {
    const name = window.prompt("Digite um nome para o conjunto de filtros:");
    if (!name || name.trim() === "") {
      Utils.showMessage("Nome inválido. O filtro não foi salvo.");
      return;
    }

    const savedSets = store.getSavedFilterSets();
    if (!savedSets[this.sectionKey]) {
      savedSets[this.sectionKey] = [];
    }
    const existingIndex = savedSets[this.sectionKey].findIndex(
      (set) => set.name === name
    );
    const filterValues = this.getFilterValues();
    const newSet = { name, values: filterValues };
    if (existingIndex > -1) {
      savedSets[this.sectionKey][existingIndex] = newSet;
    } else {
      savedSets[this.sectionKey].push(newSet);
    }
    browser.storage.local.set({ savedFilterSets: savedSets });
    store.setSavedFilterSets(savedSets);
    Utils.showMessage(`Filtro "${name}" salvo com sucesso.`, "success");
  }

  loadFilterSet() {
    const select = document.getElementById(
      `${this.prefix}-saved-filters-select`
    );
    const name = select.value;
    if (!name) return;
    const set = (store.getSavedFilterSets()[this.sectionKey] || []).find(
      (s) => s.name === name
    );
    if (!set) return;
    Object.entries(set.values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === "checkbox") el.checked = value;
        else el.value = value;

        if (el.classList.contains("filter-select-group")) {
          this.handleFetchTypeChange(el);
        }
      }
    });
    this.applyFiltersAndRender();
  }

  deleteFilterSet() {
    const select = document.getElementById(
      `${this.prefix}-saved-filters-select`
    );
    const name = select.value;
    if (!name) {
      Utils.showMessage("Selecione um filtro para apagar.");
      return;
    }

    const confirmation = window.confirm(
      `Tem certeza que deseja apagar o filtro "${name}"?`
    );
    if (!confirmation) return;

    const savedSets = store.getSavedFilterSets();
    savedSets[this.sectionKey] = (savedSets[this.sectionKey] || []).filter(
      (set) => set.name !== name
    );
    browser.storage.local.set({ savedFilterSets: savedSets });
    store.setSavedFilterSets(savedSets);
    Utils.showMessage(`Filtro "${name}" apagado.`, "success");
  }

  populateSavedFilterDropdown() {
    const select = document.getElementById(
      `${this.prefix}-saved-filters-select`
    );
    if (!select) return;
    const currentSelection = select.value;
    select.innerHTML = '<option value="">Carregar filtro...</option>';
    const sets = store.getSavedFilterSets()[this.sectionKey] || [];
    sets.forEach((set) => {
      const option = document.createElement("option");
      option.value = set.name;
      option.textContent = set.name;
      select.appendChild(option);
    });
    select.value = currentSelection;
  }

  renderFilterControls() {
    try {
      const sectionFilters = filterConfig[this.sectionKey] || [];
      const sectionLayout =
        this.globalSettings.filterLayout[this.sectionKey] || [];
      const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

      const sortedItems = [...sectionFilters].sort((a, b) => {
        const orderA = layoutMap.get(a.id)?.order ?? Infinity;
        const orderB = layoutMap.get(b.id)?.order ?? Infinity;
        return orderA - orderB;
      });

      if (this.elements.mainFilters) this.elements.mainFilters.innerHTML = "";
      if (this.elements.moreFilters) this.elements.moreFilters.innerHTML = "";

      sortedItems.forEach((item) => {
        const location =
          layoutMap.get(item.id)?.location || item.defaultLocation;
        const container =
          location === "main"
            ? this.elements.mainFilters
            : this.elements.moreFilters;

        if (container) {
          let element;
          if (item.type === "component") {
            element = this.createUiComponent(item.componentName);
          } else {
            element = this.createFilterElement(item);
          }
          if (element) {
            container.appendChild(element);
          }
        }
      });
    } catch (e) {
      console.error(`Erro ao renderizar filtros para ${this.sectionKey}:`, e);
    }
  }

  createUiComponent(componentName) {
    switch (componentName) {
      case "date-range":
        return this.renderDateRangeComponent();
      case "saved-filters":
        return this.renderSavedFiltersComponent();
      default:
        return null;
    }
  }

  renderDateRangeComponent() {
    const container = document.createElement("div");
    container.className = "grid grid-cols-2 gap-4 text-sm";
    container.innerHTML = `
        <div>
            <label for="${this.prefix}-date-initial" class="block font-medium">Data Inicial</label>
            <input type="date" id="${this.prefix}-date-initial" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
        <div>
            <label for="${this.prefix}-date-final" class="block font-medium">Data Final</label>
            <input type="date" id="${this.prefix}-date-final" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
      `;
    this.elements.dateInitial = container.querySelector(
      `#${this.prefix}-date-initial`
    );
    this.elements.dateFinal = container.querySelector(
      `#${this.prefix}-date-final`
    );
    return container;
  }

  renderSavedFiltersComponent() {
    const container = document.createElement("div");
    container.className = "mt-4 pt-4 border-t";
    container.id = `${this.prefix}-saved-filters-container`;
    container.innerHTML = `
        <h3 class="text-sm font-semibold text-slate-600 mt-3 mb-2">Filtros Salvos</h3>
        <div class="flex items-center gap-2">
            <select id="${this.prefix}-saved-filters-select" class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md bg-white text-sm" title="Carregar um filtro salvo">
                <option value="">Carregar filtro...</option>
            </select>
            <button id="${this.prefix}-save-filter-btn" title="Salvar filtros atuais" class="p-1.5 text-slate-500 hover:bg-blue-100 hover:text-blue-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v4.5h2a.5.5 0 0 1 .354.854l-2.5 2.5a.5.5 0 0 1-.708 0l-2.5-2.5A.5.5 0 0 1 5.5 6.5h2V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>
            </button>
            <button id="${this.prefix}-delete-filter-btn" title="Apagar filtro selecionado" class="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            </button>
        </div>
      `;
    this.elements.savedFiltersContainer = container;
    this.populateSavedFilterDropdown();
    return container;
  }

  createFilterElement(filter) {
    const container = document.createElement("div");
    let elementHtml = "";
    if (filter.type !== "checkbox") {
      elementHtml += `<label for="${filter.id}" class="block font-medium mb-1 text-sm">${filter.label}</label>`;
    }
    switch (filter.type) {
      case "text":
        elementHtml += `<input type="text" id="${filter.id}" placeholder="${
          filter.placeholder || ""
        }" class="w-full px-2 py-1 border border-slate-300 rounded-md">`;
        break;
      case "select":
      case "selectGroup":
        elementHtml += `<select id="${filter.id}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;

        if (
          filter.id === "regulation-filter-priority" &&
          this.globalSettings.regulationPriorities
        ) {
          elementHtml += `<option value="todas">Todas</option>`;
          this.globalSettings.regulationPriorities.forEach((prio) => {
            elementHtml += `<option value="${prio.coreDescricao}">${prio.coreDescricao}</option>`;
          });
        } else {
          (filter.options || []).forEach((opt) => {
            elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
          });
        }
        elementHtml += `</select>`;
        break;
      case "checkbox":
        container.className = "flex items-center";
        elementHtml += `<input id="${filter.id}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <label for="${filter.id}" class="ml-2 block text-sm text-slate-700">${filter.label}</label>`;
        break;
    }
    container.innerHTML = elementHtml;
    return container;
  }

  applyAutomationFilters(filterSettings, ruleName) {
    if (!filterSettings) return;

    // --- INÍCIO DA CORREÇÃO ---
    // Aplica o período de busca da regra, se definido
    if (filterSettings.dateRange) {
      const { start, end } = filterSettings.dateRange;
      if (this.elements.dateInitial && start !== null && !isNaN(start)) {
        this.elements.dateInitial.valueAsDate =
          Utils.calculateRelativeDate(start);
      }
      if (this.elements.dateFinal && end !== null && !isNaN(end)) {
        this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(end);
      }
    }
    // --- FIM DA CORREÇÃO ---

    Object.entries(filterSettings).forEach(([filterId, value]) => {
      // Pula a propriedade dateRange que já foi tratada
      if (filterId === "dateRange") return;

      const el = document.getElementById(filterId);
      if (el) {
        if (el.type === "checkbox") {
          el.checked = value;
        } else {
          el.value = value;
        }
      }
    });

    this.fetchData();

    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center">
                <span>Filtro automático aplicado: <strong>${ruleName}</strong></span>
                <button class="clear-automation-btn text-blue-800 hover:text-blue-900 font-bold" title="Limpar filtro automático">&times;</button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove("hidden");
    }
  }

  clearAutomationFeedbackAndFilters(shouldRender = true) {
    if (
      this.elements.automationFeedback &&
      !this.elements.automationFeedback.classList.contains("hidden")
    ) {
      this.elements.automationFeedback.classList.add("hidden");
      this.elements.automationFeedback.innerHTML = "";
      this.clearFilters(false);
    }
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }
}
