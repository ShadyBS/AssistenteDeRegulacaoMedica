/**
 * @file Módulo TimelineManager, responsável por gerir a secção da Linha do Tempo.
 */
import * as API from "./api.js";
import * as Utils from "./utils.js";
import * as Renderers from "./renderers.js";
import { store } from "./store.js";

export class TimelineManager {
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.config = config;
    this.globalSettings = globalSettings;

    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;

    // State for automation filters
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;

    this.elements = {};
    this.init();
  }

  init() {
    this.cacheDomElements();
    this.addEventListeners();
    store.subscribe(() => this.onStateChange());
  }

  cacheDomElements() {
    this.elements = {
      section: document.getElementById("timeline-section"),
      wrapper: document.getElementById("timeline-wrapper"),
      content: document.getElementById("timeline-content"),
      fetchBtn: document.getElementById("fetch-timeline-btn"),
      toggleBtn: document.getElementById("toggle-timeline-list-btn"),
      automationFeedback: document.getElementById(
        "timeline-automation-feedback"
      ),
    };
  }

  addEventListeners() {
    this.elements.fetchBtn?.addEventListener("click", () => this.fetchData());
    this.elements.toggleBtn?.addEventListener("click", () =>
      this.toggleSection()
    );

    this.elements.section?.addEventListener("click", (event) => {
      // For expanding/collapsing timeline item details
      const header = event.target.closest(".timeline-header");
      if (header) {
        const details = header.nextElementSibling;
        if (details && details.classList.contains("timeline-details-body")) {
          details.classList.toggle("show");
        }
        return;
      }

      // For toggling the focused timeline view
      const toggleFilterBtn = event.target.closest(
        "#timeline-toggle-filter-btn"
      );
      if (toggleFilterBtn) {
        this.toggleFilteredView();
      }
    });
  }

  onStateChange() {
    const patientState = store.getPatient();
    const newPatient = patientState ? patientState.ficha : null;

    if (this.currentPatient?.isenPK?.idp !== newPatient?.isenPK?.idp) {
      this.setPatient(newPatient);
    }
  }

  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearAutomation(); // Reset automation on patient change
    this.elements.content.innerHTML = "";

    if (this.elements.section) {
      this.elements.section.style.display = patient ? "block" : "none";
    }
  }

  async fetchData() {
    if (!this.currentPatient || this.isLoading) {
      return;
    }

    this.isLoading = true;
    Renderers.renderTimeline([], "loading");

    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: "01/01/1900",
        dataFinal: new Date().toLocaleDateString("pt-BR"),
      };

      const apiData = await API.fetchAllTimelineData(params);
      const normalizedData = Utils.normalizeTimelineData(apiData);

      this.allData = normalizedData;
      this.render();
    } catch (error) {
      console.error("Erro ao buscar dados para a Linha do Tempo:", error);
      Renderers.renderTimeline([], "error");
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.allData.length === 0) {
      Renderers.renderTimeline([], "empty");
      return;
    }

    let dataToRender = this.allData;
    if (this.isFilteredView && this.activeRuleFilters) {
      dataToRender = Utils.filterTimelineEvents(
        this.allData,
        this.activeRuleFilters
      );
    }

    Renderers.renderTimeline(dataToRender, "success");
  }

  toggleSection() {
    this.elements.wrapper?.classList.toggle("show");
    this.elements.toggleBtn.textContent =
      this.elements.wrapper.classList.contains("show")
        ? "Recolher"
        : "Expandir";
  }

  applyAutomationFilters(filters, ruleName) {
    this.activeRuleFilters = filters;
    this.activeRuleName = ruleName;
    this.isFilteredView = false; // Start with the complete view

    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center text-sm">
                <span>Regra '<strong>${ruleName}</strong>' ativa.</span>
                <button id="timeline-toggle-filter-btn" class="font-semibold text-blue-600 hover:underline">
                    Ver timeline focada
                </button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove("hidden");
    }

    // If data is already loaded, re-render to show the option
    if (this.allData.length > 0) {
      this.render();
    }
  }

  clearAutomation() {
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;
    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.classList.add("hidden");
      this.elements.automationFeedback.innerHTML = "";
    }
    if (this.allData.length > 0) {
      this.render();
    }
  }

  toggleFilteredView() {
    this.isFilteredView = !this.isFilteredView;
    const button = document.getElementById("timeline-toggle-filter-btn");
    if (button) {
      button.textContent = this.isFilteredView
        ? "Ver timeline completa"
        : "Ver timeline focada";
    }
    this.render();
  }
}
