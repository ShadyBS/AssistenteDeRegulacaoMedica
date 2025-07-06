/**
 * @file Contém todas as funções responsáveis por gerar o HTML dos resultados.
 */

import { getSortIndicator } from "./SectionManager.js";
import * as Utils from "./utils.js";

export function renderConsultations(consultations, sortState) {
  const contentDiv = document.getElementById("consultations-content");
  if (!contentDiv) return;

  if (consultations.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhuma consulta encontrada para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="specialty">Especialidade/Profissional <span class="sort-indicator">${getSortIndicator(
          "specialty",
          sortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="sortableDate">Data <span class="sort-indicator">${getSortIndicator(
          "sortableDate",
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    consultations
      .map(
        (c) => `
        <div class="p-3 mb-3 border rounded-lg ${
          c.isNoShow ? "bg-red-50 border-red-200" : "bg-white"
        } consultation-item">
            <div class="flex justify-between items-start cursor-pointer consultation-header">
                <div>
                    <p class="font-bold text-blue-700 pointer-events-none">${
                      c.specialty
                    }</p>
                    <p class="text-sm text-slate-600 pointer-events-none">${
                      c.professional
                    }</p>
                </div>
                <p class="text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap text-right pointer-events-none">${c.date.replace(
                  /\n/g,
                  "<br>"
                )}</p>
            </div>
            <div class="consultation-body collapse-section show">
                ${
                  c.isNoShow
                    ? '<p class="text-center font-bold text-red-600 mt-2">PACIENTE FALTOU</p>'
                    : `
                <p class="text-sm text-slate-500 mt-1">${c.unit}</p>
                <div class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    ${c.details
                      .map(
                        (d) =>
                          `<p class="text-xs font-semibold text-slate-500 uppercase">${
                            d.label
                          }</p><p class="text-sm text-slate-700 whitespace-pre-wrap">${d.value.replace(
                            /\n/g,
                            "<br>"
                          )} <span class="copy-icon" title="Copiar" data-copy-text="${
                            d.value
                          }">📄</span></p>`
                      )
                      .join("")}
                </div>`
                }
            </div>
        </div>
    `
      )
      .join("");
}

export function renderExams(exams, sortState) {
  const contentDiv = document.getElementById("exams-content");
  if (!contentDiv) return;

  if (exams.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum exame encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="examName">Nome do Exame <span class="sort-indicator">${getSortIndicator(
          "examName",
          sortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    exams
      .map((exam) => {
        const idp = exam.resultIdp;
        const ids = exam.resultIds;
        const idpStr = idp !== null && idp !== undefined ? String(idp) : "";
        const idsStr = ids !== null && ids !== undefined ? String(ids) : "";
        const showBtn =
          exam.hasResult &&
          idp !== null &&
          idp !== undefined &&
          ids !== null &&
          ids !== undefined &&
          idpStr !== "" &&
          idsStr !== "";
        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <p class="font-semibold text-indigo-700">${
              exam.examName || "Nome do exame não informado"
            } <span class="copy-icon" title="Copiar" data-copy-text="${
          exam.examName
        }">📄</span></p>
            <div class="text-sm text-slate-500 mt-1">
                <p>Solicitado por: ${exam.professional || "Não informado"} (${
          exam.specialty || "N/A"
        })</p>
                <p>Data: ${exam.date || "Não informada"}</p>
            </div>
            ${
              showBtn
                ? `<button class="view-exam-result-btn mt-2 w-full text-sm bg-green-100 text-green-800 py-1 rounded hover:bg-green-200" data-idp="${idpStr}" data-ids="${idsStr}">Visualizar Resultado</button>`
                : ""
            }
        </div>
      `;
      })
      .join("");
}

export function renderAppointments(appointments, sortState) {
  const contentDiv = document.getElementById("appointments-content");
  if (!contentDiv) return;

  const statusStyles = {
    AGENDADO: "bg-blue-100 text-blue-800",
    PRESENTE: "bg-green-100 text-green-800",
    FALTOU: "bg-red-100 text-red-800",
    CANCELADO: "bg-yellow-100 text-yellow-800",
    ATENDIDO: "bg-purple-100 text-purple-800",
  };

  if (appointments.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum agendamento encontrado para o filtro selecionado.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="specialty">Especialidade <span class="sort-indicator">${getSortIndicator(
          "specialty",
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          "status",
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    appointments
      .map((item) => {
        const style = statusStyles[item.status] || "bg-gray-100 text-gray-800";
        let typeText = item.type;
        if (item.isSpecialized) {
          typeText = "CONSULTA ESPECIALIZADA";
        } else if (item.isOdonto) {
          typeText = "CONSULTA ODONTO";
        } else if (item.type.toUpperCase().includes("EXAME")) {
          typeText = "EXAME";
        }

        let idp, ids;
        const idParts = item.id.split("-");

        if (idParts[0].toLowerCase() === "exam") {
          idp = idParts[1];
          ids = idParts[2];
        } else {
          idp = idParts[0];
          ids = idParts[1];
        }

        const appointmentDataString = JSON.stringify(item);

        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${typeText}</p>
                    <p class="text-sm text-indigo-600 font-medium">${
                      item.specialty || "Sem especialidade"
                    }</p>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
          item.status
        }</span>
            </div>
            <div class="text-sm text-slate-500 mt-2 border-t pt-2">
                <p><strong>Data:</strong> ${item.date} às ${item.time}</p>
                <p><strong>Local:</strong> ${item.location}</p>
                <p><strong>Profissional:</strong> ${item.professional}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t">
                 <button class="view-appointment-details-btn text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${
                   idp || ""
                 }" data-ids="${ids || ""}" data-type="${item.type}">
                    Abrir
                </button>
                <button class="appointment-info-btn text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" data-appointment='${appointmentDataString}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>
        </div>
      `;
      })
      .join("");
}

export function renderRegulations(regulations, sortState, globalSettings) {
  const contentDiv = document.getElementById("regulations-content");
  if (!contentDiv) return;

  const priorityNameMap = new Map();
  const priorityColorMap = new Map();
  if (globalSettings && globalSettings.regulationPriorities) {
    globalSettings.regulationPriorities.forEach((prio) => {
      priorityNameMap.set(prio.coreDescricao, prio.coreDescricao);
      priorityColorMap.set(prio.coreDescricao, prio.coreCor);
    });
  }

  const statusStyles = {
    AUTORIZADO: "bg-green-100 text-green-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
    NEGADO: "bg-red-100 text-red-800",
    DEVOLVIDO: "bg-orange-100 text-orange-800",
    CANCELADA: "bg-gray-100 text-gray-800",
    "EM ANÁLISE": "bg-blue-100 text-blue-800",
  };

  if (regulations.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum resultado encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="procedure">Procedimento <span class="sort-indicator">${getSortIndicator(
          "procedure",
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          "status",
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    regulations
      .map((item) => {
        const statusKey = (item.status || "").toUpperCase();
        const style = statusStyles[statusKey] || "bg-gray-100 text-gray-800";

        const priorityKey = (item.priority || "").toUpperCase();
        const priorityColor = priorityColorMap.get(priorityKey) || "CCCCCC";
        const textColor = Utils.getContrastYIQ(priorityColor);
        const priorityStyle = `background-color: #${priorityColor}; color: ${textColor};`;
        const priorityText = priorityNameMap.get(priorityKey) || item.priority;

        const typeText = (item.type || "").startsWith("CON")
          ? "CONSULTA"
          : "EXAME";
        const typeColor =
          typeText === "CONSULTA" ? "text-cyan-700" : "text-fuchsia-700";

        return `
            <div class="p-3 mb-3 border rounded-lg bg-white">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                           <p class="font-bold ${typeColor}">${typeText}</p>
                           <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="${priorityStyle}">${priorityText}</span>
                        </div>
                        <p class="text-sm text-slate-800 font-medium">${
                          item.procedure
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
          item.procedure
        }">📄</span></p>
                        <p class="text-xs text-slate-500">${
                          item.cid
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
          item.cid
        }">📄</span></p>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
          item.status
        }</span>
                </div>
                <div class="text-sm text-slate-500 mt-2 border-t pt-2 space-y-1">
                    <p><strong>Data:</strong> ${item.date}</p>
                    <p><strong>Solicitante:</strong> ${item.requester}</p>
                    <p><strong>Executante:</strong> ${
                      item.provider || "Não definido"
                    }</p>
                </div>
                <div class="mt-2 pt-2 border-t">
                     <button class="view-regulation-details-btn w-full text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${
                       item.idp
                     }" data-ids="${item.ids}">
                        Visualizar Detalhes
                    </button>
                </div>
            </div>
      `;
      })
      .join("");
}
