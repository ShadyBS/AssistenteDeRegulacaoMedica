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

    // Event listener for expanding/collapsing timeline item details
    this.elements.content?.addEventListener("click", (event) => {
      const header = event.target.closest(".timeline-header");
      if (header) {
        const details = header.nextElementSibling;
        if (details && details.classList.contains("timeline-details-body")) {
          details.classList.toggle("show");
        }
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
    this.elements.content.innerHTML = ""; // Limpa conteúdo ao trocar de paciente

    if (this.elements.section) {
      this.elements.section.style.display = patient ? "block" : "none";
    }
  }

  async fetchData() {
    if (!this.currentPatient || this.isLoading) {
      return;
    }

    this.isLoading = true;
    Renderers.renderTimeline([], "loading"); // Renderiza o estado de carregamento

    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: "01/01/1900", // Busca ampla por defeito
        dataFinal: new Date().toLocaleDateString("pt-BR"),
      };

      const apiData = await API.fetchAllTimelineData(params);
      const normalizedData = Utils.normalizeTimelineData(apiData);

      this.allData = normalizedData;

      if (this.allData.length === 0) {
        Renderers.renderTimeline([], "empty");
      } else {
        Renderers.renderTimeline(this.allData, "success");
      }
    } catch (error) {
      console.error("Erro ao buscar dados para a Linha do Tempo:", error);
      Renderers.renderTimeline([], "error"); // Renderiza o estado de erro
    } finally {
      this.isLoading = false;
    }
  }

  toggleSection() {
    this.elements.wrapper?.classList.toggle("show");
    this.elements.toggleBtn.textContent =
      this.elements.wrapper.classList.contains("show")
        ? "Recolher"
        : "Expandir";
  }
}
