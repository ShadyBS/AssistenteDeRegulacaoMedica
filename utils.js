/**
 * @file Contém funções utilitárias compartilhadas em toda a extensão.
 */

import { CONFIG, getTimeout, getCSSClass, getUIConfig } from "./config.js";

/**
 * Atraso na execução de uma função após o utilizador parar de digitar.
 * @param {Function} func A função a ser executada.
 * @param {number} [delay=500] O tempo de espera em milissegundos.
 * @returns {Function} A função com debounce.
 */
export function debounce(func, delay = CONFIG.TIMEOUTS.DEBOUNCE_DEFAULT) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Mostra ou esconde o loader principal.
 * @param {boolean} show - `true` para mostrar, `false` para esconder.
 */
export function toggleLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = show ? "block" : "none";
  }
}

/**
 * Exibe uma mensagem na área de mensagens.
 * @param {string} text O texto da mensagem.
 * @param {'error' | 'success' | 'info'} [type='error'] O tipo de mensagem.
 */
export function showMessage(text, type = "error") {
  const messageArea = document.getElementById("message-area");
  if (messageArea) {
    messageArea.textContent = text;
    const typeClasses = {
      error: getCSSClass("MESSAGE_ERROR"),
      success: getCSSClass("MESSAGE_SUCCESS"),
      info: getCSSClass("MESSAGE_INFO"),
    };
    messageArea.className = `p-3 rounded-md text-sm ${
      typeClasses[type] || typeClasses.error
    }`;
    messageArea.style.display = "block";
  }
}

/**
 * Limpa a área de mensagens.
 */
export function clearMessage() {
  const messageArea = document.getElementById("message-area");
  if (messageArea) {
    messageArea.style.display = "none";
  }
}

/**
 * Converte uma string de data em vários formatos para um objeto Date.
 * @param {string} dateString A data no formato "dd/MM/yyyy" ou "yyyy-MM-dd", podendo conter prefixos.
 * @returns {Date|null} O objeto Date ou null se a string for inválida.
 */
export function parseDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  // Tenta extrair o primeiro padrão de data válido da string.
  const dateMatch = dateString.match(
    /(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{2,4})/
  );
  if (!dateMatch) return null;

  const matchedDate = dateMatch[0];
  let year, month, day;

  // Tenta o formato YYYY-MM-DD
  if (matchedDate.includes("-")) {
    [year, month, day] = matchedDate.split("-").map(Number);
  } else if (matchedDate.includes("/")) {
    // Tenta o formato DD/MM/YYYY
    [day, month, year] = matchedDate.split("/").map(Number);
  }

  // Valida se os números são válidos e se a data é real
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Lida com anos de 2 dígitos (ex: '24' -> 2024)
  if (year >= 0 && year < getUIConfig("TWO_DIGIT_YEAR_THRESHOLD")) {
    year += getUIConfig("YEAR_BASE");
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Confirma que a data não "rolou" para o mês seguinte (ex: 31 de Abril -> 1 de Maio)
  if (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  ) {
    return date;
  }

  return null; // Retorna nulo se a data for inválida (ex: 31/02/2024)
}

/**
 * Obtém um valor aninhado de um objeto de forma segura.
 * @param {object} obj O objeto.
 * @param {string} path O caminho para a propriedade (ex: 'a.b.c').
 * @returns {*} O valor encontrado ou undefined.
 */
export const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Calcula uma data relativa à data atual com base num desvio em meses.
 * @param {number} offsetInMonths - O número de meses a adicionar ou subtrair.
 * @returns {Date} O objeto Date resultante.
 */
export function calculateRelativeDate(offsetInMonths) {
  const date = new Date();
  // setMonth lida corretamente com transições de ano e dias do mês
  date.setMonth(date.getMonth() + offsetInMonths);
  return date;
}

/**
 * Retorna 'black' ou 'white' para o texto dependendo do contraste com a cor de fundo.
 * @param {string} hexcolor - A cor de fundo em formato hexadecimal (com ou sem #).
 * @returns {'black' | 'white'}
 */
export function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);
  var yiq = (r * getUIConfig("YIQ_FORMULA").RED_WEIGHT + g * getUIConfig("YIQ_FORMULA").GREEN_WEIGHT + b * getUIConfig("YIQ_FORMULA").BLUE_WEIGHT) / getUIConfig("YIQ_FORMULA").DIVISOR;
  return yiq >= getUIConfig("YIQ_THRESHOLD") ? "black" : "white";
}

/**
 * Normaliza uma string removendo acentos, cedilha e convertendo para minúsculas.
 * @param {string} str - A string a ser normalizada.
 * @returns {string} A string normalizada.
 */
export function normalizeString(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Configura um sistema de abas (tabs) dentro de um container.
 * @param {HTMLElement} container - O elemento que contém os botões e os painéis das abas.
 */
export function setupTabs(container) {
  if (!container) return;

  const tabButtons = container.querySelectorAll(".tab-button");
  const tabContents = container.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      button.classList.add("active");
      const activeContent = container.querySelector(`#${tabName}-tab`);
      if (activeContent) {
        activeContent.classList.add("active");
      }
    });
  });
}

/**
 * Normalizes data from various sources into a single, sorted timeline event list.
 * Optimized for memory efficiency with large datasets using streaming approach.
 * @param {object} apiData - An object containing arrays of consultations, exams, etc.
 * @param {object} options - Processing options for memory optimization
 * @returns {Array<object>} A sorted array of timeline event objects.
 */
export function normalizeTimelineData(apiData, options = {}) {
  const { 
    maxEvents = CONFIG.PERFORMANCE.MAX_TIMELINE_EVENTS || 1000,
    batchSize = CONFIG.PERFORMANCE.BATCH_SIZE || 100,
    enableGC = true 
  } = options;

  // Use a priority queue-like approach to maintain only the most recent events
  const eventHeap = [];
  let processedCount = 0;
  let rejectedCount = 0;

  // Helper function to insert event maintaining sorted order and size limit
  const insertEvent = (event) => {
    if (!event || !event.sortableDate || isNaN(event.sortableDate)) {
      rejectedCount++;
      return;
    }

    if (eventHeap.length < maxEvents) {
      // If we haven't reached the limit, just add and maintain sort
      eventHeap.push(event);
      if (eventHeap.length % 100 === 0) {
        // Re-sort periodically to maintain order
        eventHeap.sort((a, b) => b.sortableDate - a.sortableDate);
      }
    } else {
      // If at limit, only add if event is more recent than the oldest
      const oldestEvent = eventHeap[eventHeap.length - 1];
      if (event.sortableDate > oldestEvent.sortableDate) {
        eventHeap.pop(); // Remove oldest
        eventHeap.push(event);
        // Keep sorted - find correct position and insert
        let insertPos = eventHeap.length - 1;
        while (insertPos > 0 && eventHeap[insertPos].sortableDate > eventHeap[insertPos - 1].sortableDate) {
          [eventHeap[insertPos], eventHeap[insertPos - 1]] = [eventHeap[insertPos - 1], eventHeap[insertPos]];
          insertPos--;
        }
      } else {
        rejectedCount++;
      }
    }
  };

  // Streaming processor for memory efficiency
  const processStream = (items, normalizer, typeName) => {
    if (!Array.isArray(items) || items.length === 0) return;
    
    let batchBuffer = [];
    const processBatch = () => {
      if (batchBuffer.length === 0) return;
      
      for (const item of batchBuffer) {
        try {
          const event = normalizer(item);
          if (event) {
            insertEvent(event);
            processedCount++;
          }
        } catch (itemError) {
          console.warn(`Failed to process ${typeName} item:`, itemError);
          rejectedCount++;
        }
      }
      
      // Clear batch buffer to free memory
      batchBuffer = [];
      
      // Trigger garbage collection hint periodically
      if (enableGC && processedCount % 500 === 0) {
        // Force garbage collection by removing references
        // No ambiente de browser extension, não temos acesso ao global.gc()
        // Apenas fazemos limpeza manual de referências
        if (typeof window !== 'undefined' && window.gc) {
          window.gc();
        }
      }
    };

    // Process items in streaming fashion
    for (let i = 0; i < items.length; i++) {
      batchBuffer.push(items[i]);
      
      if (batchBuffer.length >= batchSize) {
        processBatch();
      }
    }
    
    // Process remaining items
    processBatch();
  };

  // Consultation normalizer with memory optimization
  const normalizeConsultation = (c) => {
    if (!c?.date) return null;
    
    const searchText = normalizeString(
      [
        c.specialty,
        c.professional,
        c.unit,
        ...(c.details || []).map((d) => d.value || ''),
      ].filter(Boolean).join(" ")
    );
    
    return {
      type: "consultation",
      date: parseDate(c.date.split("\n")[0]),
      sortableDate: c.sortableDate || parseDate(c.date),
      title: `Consulta: ${c.specialty || "Especialidade não informada"}`,
      summary: `com ${c.professional || "Profissional não informado"}`,
      details: c,
      subDetails: c.details || [],
      searchText,
    };
  };

  // Exam normalizer with validation
  const normalizeExam = (e) => {
    if (!e?.date) return null;
    
    const eventDate = parseDate(e.date);
    if (!eventDate) return null;
    
    const searchText = normalizeString(
      [e.examName, e.professional, e.specialty].filter(Boolean).join(" ")
    );
    
    return {
      type: "exam",
      date: eventDate,
      sortableDate: eventDate,
      title: `Exame Solicitado: ${e.examName || "Nome não informado"}`,
      summary: `Solicitado por ${e.professional || "Não informado"}`,
      details: e,
      subDetails: [
        {
          label: "Resultado",
          value: e.hasResult ? "Disponível" : "Pendente",
        },
      ],
      searchText,
    };
  };

  // Appointment normalizer
  const normalizeAppointment = (a) => {
    if (!a?.date) return null;
    
    const searchText = normalizeString(
      [a.specialty, a.description, a.location, a.professional].filter(Boolean).join(" ")
    );
    
    return {
      type: "appointment",
      date: parseDate(a.date),
      sortableDate: parseDate(a.date),
      title: `Agendamento: ${a.specialty || a.description || "Não descrito"}`,
      summary: a.location || "Local não informado",
      details: a,
      subDetails: [
        { label: "Status", value: a.status || "N/A" },
        { label: "Hora", value: a.time || "N/A" },
      ],
      searchText,
    };
  };

  // Regulation normalizer
  const normalizeRegulation = (r) => {
    if (!r?.date) return null;
    
    const searchText = normalizeString(
      [r.procedure, r.requester, r.provider, r.cid].filter(Boolean).join(" ")
    );
    
    return {
      type: "regulation",
      date: parseDate(r.date),
      sortableDate: parseDate(r.date),
      title: `Regulação: ${r.procedure || "Procedimento não informado"}`,
      summary: `Solicitante: ${r.requester || "Não informado"}`,
      details: r,
      subDetails: [
        { label: "Status", value: r.status || "N/A" },
        { label: "Prioridade", value: r.priority || "N/A" },
      ],
      searchText,
    };
  };

  // Document normalizer
  const normalizeDocument = (doc) => {
    if (!doc?.date) return null;
    
    const searchText = normalizeString(doc.description || "");
    
    return {
      type: "document",
      date: parseDate(doc.date),
      sortableDate: parseDate(doc.date),
      title: `Documento: ${doc.description || "Sem descrição"}`,
      summary: `Tipo: ${(doc.fileType || '').toUpperCase()}`,
      details: doc,
      subDetails: [],
      searchText,
    };
  };

  // Process each data type with streaming processing
  processStream(apiData.consultations, normalizeConsultation, "consultations");
  processStream(apiData.exams, normalizeExam, "exams");
  processStream(apiData.appointments, normalizeAppointment, "appointments");
  processStream(apiData.regulations, normalizeRegulation, "regulations");
  processStream(apiData.documents, normalizeDocument, "documents");

  // Final sort to ensure correct order
  eventHeap.sort((a, b) => b.sortableDate - a.sortableDate);

  // Log processing statistics
  console.log(`Timeline processing completed: ${processedCount} events processed, ${rejectedCount} rejected, ${eventHeap.length} in final timeline`);

  // Final cleanup and memory optimization
  if (enableGC) {
    // Clear references to help garbage collection
    apiData = null;
    
    // Trigger garbage collection if available
    // No ambiente de browser extension, não temos acesso ao global.gc()
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    }
  }

  return eventHeap;
}

/**
 * Filters timeline events based on automation rule filters.
 * @param {Array<object>} events - The full array of timeline events.
 * @param {object} automationFilters - The filter settings from an automation rule.
 * @returns {Array<object>} A new array with the filtered events.
 */
export function filterTimelineEvents(events, automationFilters) {
  if (!automationFilters) return events;

  const checkText = (text, filterValue) => {
    if (!filterValue) return true; // If filter is empty, it passes
    const terms = filterValue
      .toLowerCase()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (terms.length === 0) return true;
    const normalizedText = normalizeString(text || "");
    return terms.some((term) => normalizedText.includes(term));
  };

  return events.filter((event) => {
    try {
      switch (event.type) {
        case "consultation":
          const consultFilters = automationFilters.consultations || {};
          // Procura por um campo rotulado como CID ou CIAP para uma busca precisa.
          const cidDetail = (event.details.details || []).find(
            (d) =>
              normalizeString(d.label).includes("cid") ||
              normalizeString(d.label).includes("ciap")
          );
          const cidText = cidDetail ? cidDetail.value : "";
          return (
            checkText(
              event.details.specialty,
              consultFilters["consultation-filter-specialty"]
            ) &&
            checkText(
              event.details.professional,
              consultFilters["consultation-filter-professional"]
            ) &&
            checkText(cidText, consultFilters["consultation-filter-cid"])
          );

        case "exam":
          const examFilters = automationFilters.exams || {};
          return (
            checkText(
              event.details.examName,
              examFilters["exam-filter-name"]
            ) &&
            checkText(
              event.details.professional,
              examFilters["exam-filter-professional"]
            ) &&
            checkText(
              event.details.specialty,
              examFilters["exam-filter-specialty"]
            )
          );

        case "appointment":
          const apptFilters = automationFilters.appointments || {};
          const apptText = `${event.details.specialty} ${event.details.professional} ${event.details.location}`;
          return checkText(apptText, apptFilters["appointment-filter-term"]);

        case "regulation":
          const regFilters = automationFilters.regulations || {};
          return (
            checkText(
              event.details.procedure,
              regFilters["regulation-filter-procedure"]
            ) &&
            checkText(
              event.details.requester,
              regFilters["regulation-filter-requester"]
            ) &&
            (regFilters["regulation-filter-status"] === "todos" ||
              !regFilters["regulation-filter-status"] ||
              event.details.status.toUpperCase() ===
                regFilters["regulation-filter-status"].toUpperCase()) &&
            (regFilters["regulation-filter-priority"] === "todas" ||
              !regFilters["regulation-filter-priority"] ||
              event.details.priority.toUpperCase() ===
                regFilters["regulation-filter-priority"].toUpperCase())
          );

        default:
          return true;
      }
    } catch (e) {
      console.warn(
        "Error filtering timeline event, it will be included by default:",
        event,
        e
      );
      return true;
    }
  });
}
