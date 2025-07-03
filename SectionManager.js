/**
 * @file Módulo SectionManager, responsável por gerir uma secção inteira da sidebar.
 */

import { filterConfig } from "./filter-config.js";
import { debounce, parseDate, showMessage } from "./utils.js";
import * as API from "./api.js";
import { store } from "./store.js";

/**
 * Gera o HTML para o indicador de ordenação (seta para cima/baixo).
 * Esta função é exportada para que os módulos de renderização possam usá-la.
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
    this.fetchType = "all"; // Padrão para grupos de botões

    this.elements = {}; // Para armazenar referências do DOM

    this.init();
  }

  getPrefix(sectionKey) {
    const map = {
      consultations: "consultation",
      exams: "exam",
      appointments: "appointment",
      regulations: "regulation",
    };
    return map[sectionKey] || sectionKey;
  }

  /**
   * Encontra e armazena os elementos do DOM e adiciona os event listeners.
   */
  init() {
    this.cacheDomElements();
    this.addEventListeners();
    this.renderFilterControls();
    store.subscribe(() => this.onStateChange()); // Subscreve ao store
  }

  /**
   * Função chamada sempre que o estado global muda.
   */
  onStateChange() {
    const newPatient = store.getPatient();
    // Verifica se o paciente realmente mudou para evitar re-renderizações desnecessárias
    if (this.currentPatient?.isenPK?.idp !== newPatient?.isenPK?.idp) {
      this.setPatient(newPatient);
    }
  }

  /**
   * Mapeia os elementos do DOM para acesso fácil.
   */
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
      savedFiltersContainer: document.getElementById(
        `${prefix}-saved-filters-container`
      ),
      dateInitial: document.getElementById(`${prefix}-date-initial`),
      dateFinal: document.getElementById(`${prefix}-date-final`),
    };
  }

  /**
   * Adiciona todos os event listeners para a secção.
   */
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
      debounce((e) => {
        if (e.target.matches("input[type='text']"))
          this.applyFiltersAndRender();
      }, 300)
    );

    this.elements.section?.addEventListener("change", (e) => {
      if (e.target.matches("select, input[type='checkbox']"))
        this.applyFiltersAndRender();
      if (e.target.id === `${this.prefix}-saved-filters-select`)
        this.loadFilterSet();
    });

    this.elements.section?.addEventListener("click", (e) => {
      const target = e.target;
      const sortHeader = target.closest(".sort-header");
      if (sortHeader) this.handleSort(sortHeader.dataset.sortKey);

      const buttonGroupBtn = target.closest("[data-fetch-type]");
      if (
        buttonGroupBtn &&
        buttonGroupBtn.parentElement.id.includes("fetch-type-buttons")
      ) {
        this.handleFetchTypeChange(buttonGroupBtn);
      }

      if (target.id === `${this.prefix}-save-filter-btn`) this.saveFilterSet();
      if (target.closest(`#${this.prefix}-delete-filter-btn`))
        this.deleteFilterSet();
    });
  }

  /**
   * Define o paciente atual para esta secção e decide se deve buscar dados.
   * @param {object|null} patient - O objeto do paciente ou null para limpar.
   */
  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
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

  /**
   * Busca os dados da API para a secção.
   */
  async fetchData() {
    if (!this.currentPatient) {
      if (this.elements.section.style.display !== "none")
        showMessage("Nenhum paciente selecionado.");
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.elements.content.innerHTML =
      '<p class="text-slate-500">Carregando...</p>';

    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: this.elements.dateInitial.value
          ? new Date(this.elements.dateInitial.value).toLocaleDateString(
              "pt-BR"
            )
          : "01/01/1900",
        dataFinal: this.elements.dateFinal.value
          ? new Date(this.elements.dateFinal.value).toLocaleDateString("pt-BR")
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
      showMessage(`Erro ao buscar ${this.sectionKey}.`);
      this.allData = [];
    } finally {
      this.isLoading = false;
      this.applyFiltersAndRender();
    }
  }

  /**
   * Aplica os filtros atuais aos dados e renderiza o resultado.
   */
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

    this.config.renderFunction(sortedData, this.sortState);
    this.updateActiveFiltersIndicator();
  }

  sortData(data) {
    const { key, order } = this.sortState;
    return [...data].sort((a, b) => {
      let valA, valB;

      if (key === "date" || key === "sortableDate") {
        valA = a.sortableDate || parseDate(a.date);
        valB = b.sortableDate || parseDate(b.date);
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
      const el = document.getElementById(filter.id);
      if (el) {
        values[filter.id] = el.type === "checkbox" ? el.checked : el.value;
      }
    });
    return values;
  }

  // --- Handlers de Eventos ---

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
    this.elements.savedFiltersContainer?.classList.toggle("show", shouldShow);
    this.elements.toggleMoreBtn.querySelector(".button-text").textContent =
      shouldShow ? "Menos filtros" : "Mais filtros";
    this.updateActiveFiltersIndicator();
  }

  clearFilters() {
    (filterConfig[this.sectionKey] || []).forEach((filter) => {
      const el = document.getElementById(filter.id);
      if (el) {
        if (filter.type === "checkbox")
          el.checked = filter.defaultChecked || false;
        else if (filter.type === "select") el.value = filter.options[0].value;
        else el.value = "";
      }
    });
    this.applyFiltersAndRender();
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

  handleFetchTypeChange(button) {
    this.fetchType = button.dataset.fetchType;
    button.parentElement
      .querySelectorAll("button")
      .forEach((btn) => btn.classList.remove("btn-active"));
    button.classList.add("btn-active");

    // CORREÇÃO: A mudança de tipo de busca sempre deve chamar fetchData,
    // pois pode alterar os parâmetros da API (ex: exames com/sem resultado).
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
        el.type === "select-one" &&
        el.value !== "todos" &&
        el.value !== "todas" &&
        el.value !== ""
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

  // --- Lógica de Filtros Salvos ---

  saveFilterSet() {
    const nameInput = document.getElementById(
      `${this.prefix}-save-filter-name-input`
    );
    const name = nameInput.value.trim();
    if (!name) {
      showMessage("Por favor, insira um nome para o conjunto de filtros.");
      return;
    }

    const savedSets = this.globalSettings.savedFilterSets;
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
    this.populateSavedFilterDropdown();
    document.getElementById(`${this.prefix}-saved-filters-select`).value = name;
    nameInput.value = "";
    showMessage(`Filtro "${name}" salvo com sucesso.`, "success");
  }

  loadFilterSet() {
    const select = document.getElementById(
      `${this.prefix}-saved-filters-select`
    );
    const name = select.value;
    if (!name) return;

    const set = (
      this.globalSettings.savedFilterSets[this.sectionKey] || []
    ).find((s) => s.name === name);
    if (!set) return;

    Object.entries(set.values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === "checkbox") el.checked = value;
        else el.value = value;
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
      showMessage("Selecione um filtro para apagar.");
      return;
    }

    const savedSets = this.globalSettings.savedFilterSets;
    savedSets[this.sectionKey] = (savedSets[this.sectionKey] || []).filter(
      (set) => set.name !== name
    );
    browser.storage.local.set({ savedFilterSets: savedSets });
    this.populateSavedFilterDropdown();
    showMessage(`Filtro "${name}" apagado.`, "success");
  }

  populateSavedFilterDropdown() {
    const select = document.getElementById(
      `${this.prefix}-saved-filters-select`
    );
    if (!select) return;

    const currentSelection = select.value;
    select.innerHTML = '<option value="">Carregar um filtro...</option>';

    const sets = this.globalSettings.savedFilterSets[this.sectionKey] || [];
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

      const sortedFilters = [...sectionFilters].sort((a, b) => {
        const orderA = layoutMap.get(a.id)?.order ?? Infinity;
        const orderB = layoutMap.get(b.id)?.order ?? Infinity;
        return orderA - orderB;
      });

      if (this.elements.mainFilters) this.elements.mainFilters.innerHTML = "";
      if (this.elements.moreFilters) this.elements.moreFilters.innerHTML = "";

      sortedFilters.forEach((filter) => {
        const location =
          layoutMap.get(filter.id)?.location || filter.defaultLocation;
        const container =
          location === "main"
            ? this.elements.mainFilters
            : this.elements.moreFilters;
        if (container) {
          const filterElement = this.createFilterElement(filter);
          container.appendChild(filterElement);
        }
      });

      this.renderSavedFiltersUI();
    } catch (e) {
      console.error(`Erro ao renderizar filtros para ${this.sectionKey}:`, e);
    }
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
        elementHtml += `<select id="${filter.id}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;
        filter.options.forEach((opt) => {
          elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
        });
        elementHtml += `</select>`;
        break;
      case "checkbox":
        container.className = "flex items-center";
        elementHtml += `<input id="${
          filter.id
        }" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" ${
          filter.defaultChecked ? "checked" : ""
        }>
                          <label for="${
                            filter.id
                          }" class="ml-2 block text-sm text-slate-700">${
          filter.label
        }</label>`;
        break;
      case "buttonGroup":
        elementHtml += `<div id="${filter.id}" class="grid grid-cols-${filter.buttons.length} gap-1 p-1 bg-slate-100 rounded-lg">`;
        filter.buttons.forEach((btn, index) => {
          const isActive = index === 0;
          elementHtml += `<button data-fetch-type="${btn.value}" class="${
            filter.id
          }-btn ${
            isActive ? "btn-active" : "text-slate-600 hover:bg-slate-200"
          } px-2 py-1 text-sm rounded-md transition-colors">${
            btn.text
          }</button>`;
        });
        elementHtml += `</div>`;
        break;
    }
    container.innerHTML = elementHtml;
    return container;
  }

  renderSavedFiltersUI() {
    const container = this.elements.savedFiltersContainer;
    if (!container) return;

    container.innerHTML = `
        <h3 class="text-sm font-semibold text-slate-600 mt-3 mb-2">Filtros Salvos</h3>
        <div class="flex items-center gap-2">
            <select id="${this.prefix}-saved-filters-select" class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md bg-white text-sm">
                <option value="">Carregar um filtro...</option>
            </select>
            <button id="${this.prefix}-delete-filter-btn" title="Apagar selecionado" class="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            </button>
        </div>
        <div class="flex items-center gap-2 mt-2">
            <input type="text" id="${this.prefix}-save-filter-name-input" placeholder="Nome para o novo filtro..." class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md text-sm">
            <button id="${this.prefix}-save-filter-btn" class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium">Salvar</button>
        </div>
    `;
    this.populateSavedFilterDropdown();
  }
}
