/**
 * @file Módulo SectionManager, responsável por gerir uma secção inteira da sidebar.
 */

import { filterConfig } from "./filter-config.js";
import * as Utils from "./utils.js";
import * as API from "./api.js";
import { store } from "./store.js";

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
      }, 300)
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

      if (target.id === `${this.prefix}-save-filter-btn`) this.saveFilterSet();
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
      '<p class="text-slate-500">Carregando...</p>';

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
          : "01/01/1900",
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
      const sectionNameMap = {
        consultations: "consultas",
        exams: "exames",
        appointments: "agendamentos",
        regulations: "regulações",
        documents: "documentos",
      };
      const friendlyName = sectionNameMap[this.sectionKey] || this.sectionKey;
      Utils.showMessage(
        `Erro ao buscar ${friendlyName}. Verifique a conexão e a URL base.`
      );
      this.allData = [];
    } finally {
      this.isLoading = false;
      this.applyFiltersAndRender();
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
