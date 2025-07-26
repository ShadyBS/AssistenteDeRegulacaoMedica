/**
 * @file Contém todas as funções responsáveis por gerar o HTML dos resultados.
 */

import { getSortIndicator } from "./SectionManager.js";
import * as Utils from "./utils.js";
import { CONFIG, getCSSClass } from "./config.js";

export function renderConsultations(consultations, sortState) {
  const contentDiv = document.getElementById("consultations-content");
  if (!contentDiv) return;

  // Limpar conteúdo anterior
  contentDiv.innerHTML = '';

  if (consultations.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = getCSSClass('TEXT_MUTED');
    emptyMessage.textContent = 'Nenhuma consulta encontrada para os filtros aplicados.';
    contentDiv.appendChild(emptyMessage);
    return;
  }

  // Criar cabeçalho
  const headerDiv = document.createElement('div');
  headerDiv.className = `flex justify-between text-xs font-bold ${getCSSClass('TEXT_MUTED')} mb-2 px-3`;
  
  const specialtyHeader = document.createElement('span');
  specialtyHeader.className = 'sort-header w-2/3';
  specialtyHeader.setAttribute('data-sort-key', 'specialty');
  specialtyHeader.innerHTML = `Especialidade/Profissional <span class="sort-indicator">${getSortIndicator("specialty", sortState)}</span>`;
  
  const dateHeader = document.createElement('span');
  dateHeader.className = 'sort-header w-1/3 text-right';
  dateHeader.setAttribute('data-sort-key', 'sortableDate');
  dateHeader.innerHTML = `Data <span class="sort-indicator">${getSortIndicator("sortableDate", sortState)}</span>`;
  
  headerDiv.appendChild(specialtyHeader);
  headerDiv.appendChild(dateHeader);
  contentDiv.appendChild(headerDiv);

  // Criar itens de consulta
  consultations.forEach(c => {
    const consultationDiv = document.createElement('div');
    consultationDiv.className = `p-3 mb-3 border rounded-lg ${c.isNoShow ? getCSSClass('PATIENT_NO_SHOW') : getCSSClass('PATIENT_NORMAL')} consultation-item`;
    
    // Header da consulta
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-start cursor-pointer consultation-header';
    
    const leftDiv = document.createElement('div');
    
    const specialtyP = document.createElement('p');
    specialtyP.className = `font-bold ${getCSSClass('TEXT_BLUE')} pointer-events-none`;
    specialtyP.textContent = c.specialty;
    
    const professionalP = document.createElement('p');
    professionalP.className = `text-sm ${getCSSClass('TEXT_SECONDARY')} pointer-events-none`;
    professionalP.textContent = c.professional;
    
    leftDiv.appendChild(specialtyP);
    leftDiv.appendChild(professionalP);
    
    const dateP = document.createElement('p');
    dateP.className = 'text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap text-right pointer-events-none';
    dateP.innerHTML = c.date.replace(/\n/g, "<br>");
    
    headerDiv.appendChild(leftDiv);
    headerDiv.appendChild(dateP);
    
    // Body da consulta
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'consultation-body collapse-section show';
    
    if (c.isNoShow) {
      const noShowP = document.createElement('p');
      noShowP.className = 'text-center font-bold text-red-600 mt-2';
      noShowP.textContent = 'PACIENTE FALTOU';
      bodyDiv.appendChild(noShowP);
    } else {
      const unitP = document.createElement('p');
      unitP.className = 'text-sm text-slate-500 mt-1';
      unitP.textContent = c.unit;
      bodyDiv.appendChild(unitP);
      
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'mt-3 pt-3 border-t border-slate-200 space-y-2';
      
      c.details.forEach(d => {
        const labelP = document.createElement('p');
        labelP.className = 'text-xs font-semibold text-slate-500 uppercase';
        labelP.textContent = d.label;
        
        const valueP = document.createElement('p');
        valueP.className = 'text-sm text-slate-700 whitespace-pre-wrap';
        valueP.innerHTML = d.value.replace(/\n/g, "<br>");
        
        const copySpan = document.createElement('span');
        copySpan.className = 'copy-icon';
        copySpan.title = 'Copiar';
        copySpan.setAttribute('data-copy-text', d.value);
        copySpan.textContent = '📄';
        
        valueP.appendChild(document.createTextNode(' '));
        valueP.appendChild(copySpan);
        
        detailsDiv.appendChild(labelP);
        detailsDiv.appendChild(valueP);
      });
      
      bodyDiv.appendChild(detailsDiv);
    }
    
    consultationDiv.appendChild(headerDiv);
    consultationDiv.appendChild(bodyDiv);
    contentDiv.appendChild(consultationDiv);
  });
}

export function renderExams(exams, sortState) {
  const contentDiv = document.getElementById("exams-content");
  if (!contentDiv) return;

  // Limpar conteúdo anterior
  contentDiv.innerHTML = '';

  if (exams.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-slate-500';
    emptyMessage.textContent = 'Nenhum exame encontrado para os filtros aplicados.';
    contentDiv.appendChild(emptyMessage);
    return;
  }

  // Criar cabeçalho
  const headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between text-xs font-bold text-slate-500 mb-2 px-3';
  
  const examNameHeader = document.createElement('span');
  examNameHeader.className = 'sort-header w-2/3';
  examNameHeader.setAttribute('data-sort-key', 'examName');
  examNameHeader.innerHTML = `Nome do Exame <span class="sort-indicator">${getSortIndicator("examName", sortState)}</span>`;
  
  const dateHeader = document.createElement('span');
  dateHeader.className = 'sort-header w-1/3 text-right';
  dateHeader.setAttribute('data-sort-key', 'date');
  dateHeader.innerHTML = `Data <span class="sort-indicator">${getSortIndicator("date", sortState)}</span>`;
  
  headerDiv.appendChild(examNameHeader);
  headerDiv.appendChild(dateHeader);
  contentDiv.appendChild(headerDiv);

  // Criar itens de exame
  exams.forEach(exam => {
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

    const examDiv = document.createElement('div');
    examDiv.className = 'p-3 mb-3 border rounded-lg bg-white';
    
    // Nome do exame
    const examNameP = document.createElement('p');
    examNameP.className = 'font-semibold text-indigo-700';
    examNameP.textContent = exam.examName || "Nome do exame não informado";
    
    const copySpan = document.createElement('span');
    copySpan.className = 'copy-icon';
    copySpan.title = 'Copiar';
    copySpan.setAttribute('data-copy-text', exam.examName);
    copySpan.textContent = '📄';
    
    examNameP.appendChild(document.createTextNode(' '));
    examNameP.appendChild(copySpan);
    
    // Detalhes do exame
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'text-sm text-slate-500 mt-1';
    
    const professionalP = document.createElement('p');
    professionalP.textContent = `Solicitado por: ${exam.professional || "Não informado"} (${exam.specialty || "N/A"})`;
    
    const dateP = document.createElement('p');
    dateP.textContent = `Data: ${exam.date || "Não informada"}`;
    
    detailsDiv.appendChild(professionalP);
    detailsDiv.appendChild(dateP);
    
    examDiv.appendChild(examNameP);
    examDiv.appendChild(detailsDiv);
    
    // Botão de visualizar resultado (se disponível)
    if (showBtn) {
      const resultBtn = document.createElement('button');
      resultBtn.className = 'view-exam-result-btn mt-2 w-full text-sm bg-green-100 text-green-800 py-1 rounded hover:bg-green-200';
      resultBtn.setAttribute('data-idp', idpStr);
      resultBtn.setAttribute('data-ids', idsStr);
      resultBtn.textContent = 'Visualizar Resultado';
      examDiv.appendChild(resultBtn);
    }
    
    contentDiv.appendChild(examDiv);
  });
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

  // Limpar conteúdo anterior
  contentDiv.innerHTML = '';

  if (appointments.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-slate-500';
    emptyMessage.textContent = 'Nenhum agendamento encontrado para o filtro selecionado.';
    contentDiv.appendChild(emptyMessage);
    return;
  }

  // Criar cabeçalho
  const headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between text-xs font-bold text-slate-500 mb-2 px-3';
  
  const specialtyHeader = document.createElement('span');
  specialtyHeader.className = 'sort-header w-1/2';
  specialtyHeader.setAttribute('data-sort-key', 'specialty');
  specialtyHeader.innerHTML = `Especialidade <span class="sort-indicator">${getSortIndicator("specialty", sortState)}</span>`;
  
  const statusHeader = document.createElement('span');
  statusHeader.className = 'sort-header w-1/4 text-center';
  statusHeader.setAttribute('data-sort-key', 'status');
  statusHeader.innerHTML = `Status <span class="sort-indicator">${getSortIndicator("status", sortState)}</span>`;
  
  const dateHeader = document.createElement('span');
  dateHeader.className = 'sort-header w-1/4 text-right';
  dateHeader.setAttribute('data-sort-key', 'date');
  dateHeader.innerHTML = `Data <span class="sort-indicator">${getSortIndicator("date", sortState)}</span>`;
  
  headerDiv.appendChild(specialtyHeader);
  headerDiv.appendChild(statusHeader);
  headerDiv.appendChild(dateHeader);
  contentDiv.appendChild(headerDiv);

  // Criar itens de agendamento
  appointments.forEach(item => {
    const style = statusStyles[item.status] || "bg-gray-100 text-gray-800";
    let typeText = item.type;
    if (item.isSpecialized) {
      typeText = "CONSULTA ESPECIALIZADA";
    } else if (item.isOdonto) {
      typeText = "CONSULTA ODONTO";
    } else if (item.type.toUpperCase().includes("EXAME")) {
      typeText = "EXAME";
    }

    // Corrigir problema com IDs que podem ter prefixos como "exam-"
    let idp, ids;
    const parts = item.id.split("-");
    
    // Verificar se o primeiro part não é numérico (indica prefixo)
    if (parts.length >= 2 && isNaN(parts[0])) {
      // Se o primeiro part não é numérico, é um prefixo (ex: "exam-525411")
      // Usar o segundo part como ids e tentar obter idp de outras fontes
      ids = parts[1];
      
      // Para exames, tentar obter o idp correto do objeto original
      // Se não disponível, usar o mesmo valor como fallback
      idp = item.examIdp || item.originalIdp || parts[1];
      
      console.warn(`ID com prefixo detectado: ${item.id}, usando idp=${idp}, ids=${ids}`);
    } else {
      // Formato normal: "idp-ids"
      [idp, ids] = parts;
    }

    const appointmentDiv = document.createElement('div');
    appointmentDiv.className = 'p-3 mb-3 border rounded-lg bg-white';
    
    // Header do agendamento
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-start';
    
    const leftDiv = document.createElement('div');
    
    const typeP = document.createElement('p');
    typeP.className = 'font-semibold text-gray-800';
    typeP.textContent = typeText;
    
    const specialtyP = document.createElement('p');
    specialtyP.className = 'text-sm text-indigo-600 font-medium';
    specialtyP.textContent = item.specialty || "Sem especialidade";
    
    leftDiv.appendChild(typeP);
    leftDiv.appendChild(specialtyP);
    
    const statusSpan = document.createElement('span');
    statusSpan.className = `text-xs font-bold px-2 py-1 rounded-full ${style}`;
    statusSpan.textContent = item.status;
    
    headerDiv.appendChild(leftDiv);
    headerDiv.appendChild(statusSpan);
    
    // Detalhes do agendamento
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'text-sm text-slate-500 mt-2 border-t pt-2';
    
    const dateP = document.createElement('p');
    dateP.innerHTML = `<strong>Data:</strong> ${item.date} às ${item.time}`;
    
    const locationP = document.createElement('p');
    locationP.innerHTML = `<strong>Local:</strong> ${item.location}`;
    
    const professionalP = document.createElement('p');
    professionalP.innerHTML = `<strong>Profissional:</strong> ${item.professional}`;
    
    detailsDiv.appendChild(dateP);
    detailsDiv.appendChild(locationP);
    detailsDiv.appendChild(professionalP);
    
    // Botão de detalhes
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex items-center justify-between mt-2 pt-2 border-t';
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'view-appointment-details-btn text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200';
    detailsBtn.setAttribute('data-idp', idp || "");
    detailsBtn.setAttribute('data-ids', ids || "");
    detailsBtn.setAttribute('data-type', item.type);
    detailsBtn.textContent = 'Ver Detalhes';
    
    buttonDiv.appendChild(detailsBtn);
    
    appointmentDiv.appendChild(headerDiv);
    appointmentDiv.appendChild(detailsDiv);
    appointmentDiv.appendChild(buttonDiv);
    contentDiv.appendChild(appointmentDiv);
  });
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

  // Limpar conteúdo anterior
  contentDiv.innerHTML = '';

  if (regulations.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-slate-500';
    emptyMessage.textContent = 'Nenhum resultado encontrado para os filtros aplicados.';
    contentDiv.appendChild(emptyMessage);
    return;
  }

  // Criar cabeçalho
  const headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between text-xs font-bold text-slate-500 mb-2 px-3';
  
  const procedureHeader = document.createElement('span');
  procedureHeader.className = 'sort-header w-1/2';
  procedureHeader.setAttribute('data-sort-key', 'procedure');
  procedureHeader.innerHTML = `Procedimento <span class="sort-indicator">${getSortIndicator("procedure", sortState)}</span>`;
  
  const statusHeader = document.createElement('span');
  statusHeader.className = 'sort-header w-1/4 text-center';
  statusHeader.setAttribute('data-sort-key', 'status');
  statusHeader.innerHTML = `Status <span class="sort-indicator">${getSortIndicator("status", sortState)}</span>`;
  
  const dateHeader = document.createElement('span');
  dateHeader.className = 'sort-header w-1/4 text-right';
  dateHeader.setAttribute('data-sort-key', 'date');
  dateHeader.innerHTML = `Data <span class="sort-indicator">${getSortIndicator("date", sortState)}</span>`;
  
  headerDiv.appendChild(procedureHeader);
  headerDiv.appendChild(statusHeader);
  headerDiv.appendChild(dateHeader);
  contentDiv.appendChild(headerDiv);

  // Criar itens de regulação
  regulations.forEach(item => {
    const statusKey = (item.status || "").toUpperCase();
    const style = statusStyles[statusKey] || "bg-gray-100 text-gray-800";

    const priorityKey = (item.priority || "").toUpperCase();
    const priorityColor = priorityColorMap.get(priorityKey) || "CCCCCC";
    const textColor = Utils.getContrastYIQ(priorityColor);
    const priorityStyle = `background-color: #${priorityColor}; color: ${textColor};`;
    const priorityText = priorityNameMap.get(priorityKey) || item.priority;

    const typeText = (item.type || "").startsWith("CON") ? "CONSULTA" : "EXAME";
    const typeColor = typeText === "CONSULTA" ? "text-cyan-700" : "text-fuchsia-700";

    const regulationDiv = document.createElement('div');
    regulationDiv.className = 'p-3 mb-3 border rounded-lg bg-white';
    
    // Header da regulação
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-start';
    
    const leftDiv = document.createElement('div');
    
    const typeDiv = document.createElement('div');
    typeDiv.className = 'flex items-center gap-2 mb-1';
    
    const typeP = document.createElement('p');
    typeP.className = `font-bold ${typeColor}`;
    typeP.textContent = typeText;
    
    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'text-xs font-bold px-2 py-0.5 rounded-full';
    prioritySpan.style.cssText = priorityStyle;
    prioritySpan.textContent = priorityText;
    
    typeDiv.appendChild(typeP);
    typeDiv.appendChild(prioritySpan);
    
    const procedureP = document.createElement('p');
    procedureP.className = 'text-sm text-slate-800 font-medium';
    procedureP.textContent = item.procedure;
    
    const procedureCopySpan = document.createElement('span');
    procedureCopySpan.className = 'copy-icon';
    procedureCopySpan.title = 'Copiar';
    procedureCopySpan.setAttribute('data-copy-text', item.procedure);
    procedureCopySpan.textContent = '📄';
    
    procedureP.appendChild(document.createTextNode(' '));
    procedureP.appendChild(procedureCopySpan);
    
    const cidP = document.createElement('p');
    cidP.className = 'text-xs text-slate-500';
    cidP.textContent = item.cid;
    
    const cidCopySpan = document.createElement('span');
    cidCopySpan.className = 'copy-icon';
    cidCopySpan.title = 'Copiar';
    cidCopySpan.setAttribute('data-copy-text', item.cid);
    cidCopySpan.textContent = '📄';
    
    cidP.appendChild(document.createTextNode(' '));
    cidP.appendChild(cidCopySpan);
    
    leftDiv.appendChild(typeDiv);
    leftDiv.appendChild(procedureP);
    leftDiv.appendChild(cidP);
    
    const statusSpan = document.createElement('span');
    statusSpan.className = `text-xs font-bold px-2 py-1 rounded-full ${style}`;
    statusSpan.textContent = item.status;
    
    headerDiv.appendChild(leftDiv);
    headerDiv.appendChild(statusSpan);
    
    // Detalhes da regulação
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'text-sm text-slate-500 mt-2 border-t pt-2 space-y-1';
    
    const dateP = document.createElement('p');
    dateP.innerHTML = `<strong>Data:</strong> ${item.date}`;
    
    const requesterP = document.createElement('p');
    requesterP.innerHTML = `<strong>Solicitante:</strong> ${item.requester}`;
    
    const providerP = document.createElement('p');
    providerP.innerHTML = `<strong>Executante:</strong> ${item.provider || "Não definido"}`;
    
    detailsDiv.appendChild(dateP);
    detailsDiv.appendChild(requesterP);
    detailsDiv.appendChild(providerP);
    
    // Botão de detalhes
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-2 pt-2 border-t';
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'view-regulation-details-btn w-full text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200';
    detailsBtn.setAttribute('data-idp', item.idp);
    detailsBtn.setAttribute('data-ids', item.ids);
    detailsBtn.textContent = 'Visualizar Detalhes';
    
    buttonDiv.appendChild(detailsBtn);
    
    regulationDiv.appendChild(headerDiv);
    regulationDiv.appendChild(detailsDiv);
    regulationDiv.appendChild(buttonDiv);
    
    // Anexos (se existirem)
    if (item.attachments && item.attachments.length > 0) {
      const attachmentsDiv = document.createElement('div');
      attachmentsDiv.className = 'mt-2 pt-2 border-t border-slate-100';
      
      const attachmentsLabel = document.createElement('p');
      attachmentsLabel.className = 'text-xs font-semibold text-slate-500 mb-1';
      attachmentsLabel.textContent = 'ANEXOS:';
      
      const attachmentsContainer = document.createElement('div');
      attachmentsContainer.className = 'space-y-1';
      
      item.attachments.forEach(att => {
        const attachmentBtn = document.createElement('button');
        attachmentBtn.className = 'view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center';
        attachmentBtn.setAttribute('data-idp', att.idp);
        attachmentBtn.setAttribute('data-ids', att.ids);
        
        const leftAttDiv = document.createElement('div');
        leftAttDiv.className = 'flex items-center gap-2 overflow-hidden';
        
        const iconSvg = document.createElement('svg');
        iconSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        iconSvg.setAttribute('width', '14');
        iconSvg.setAttribute('height', '14');
        iconSvg.setAttribute('fill', 'currentColor');
        iconSvg.className = 'flex-shrink-0';
        iconSvg.setAttribute('viewBox', '0 0 16 16');
        iconSvg.innerHTML = '<path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>';
        
        const descSpan = document.createElement('span');
        descSpan.className = 'truncate';
        descSpan.title = `${att.description} (${att.fileType.toUpperCase()})`;
        descSpan.textContent = `${att.description} (${att.fileType.toUpperCase()})`;
        
        leftAttDiv.appendChild(iconSvg);
        leftAttDiv.appendChild(descSpan);
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'text-xs text-slate-400 flex-shrink-0 ml-2';
        dateSpan.textContent = att.date;
        
        attachmentBtn.appendChild(leftAttDiv);
        attachmentBtn.appendChild(dateSpan);
        
        attachmentsContainer.appendChild(attachmentBtn);
      });
      
      attachmentsDiv.appendChild(attachmentsLabel);
      attachmentsDiv.appendChild(attachmentsContainer);
      regulationDiv.appendChild(attachmentsDiv);
    }
    
    contentDiv.appendChild(regulationDiv);
  });
}

export function renderDocuments(documents, sortState) {
  const contentDiv = document.getElementById("documents-content");
  if (!contentDiv) return;

  // Limpar conteúdo anterior
  contentDiv.innerHTML = '';

  if (!documents || documents.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-slate-500';
    emptyMessage.textContent = 'Nenhum documento encontrado.';
    contentDiv.appendChild(emptyMessage);
    return;
  }

  // Criar cabeçalho
  const headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between text-xs font-bold text-slate-500 mb-2 px-3';
  
  const descriptionHeader = document.createElement('span');
  descriptionHeader.className = 'sort-header w-2/3';
  descriptionHeader.setAttribute('data-sort-key', 'description');
  descriptionHeader.innerHTML = `Descrição <span class="sort-indicator">${getSortIndicator("description", sortState)}</span>`;
  
  const dateHeader = document.createElement('span');
  dateHeader.className = 'sort-header w-1/3 text-right';
  dateHeader.setAttribute('data-sort-key', 'date');
  dateHeader.innerHTML = `Data <span class="sort-indicator">${getSortIndicator("date", sortState)}</span>`;
  
  headerDiv.appendChild(descriptionHeader);
  headerDiv.appendChild(dateHeader);
  contentDiv.appendChild(headerDiv);

  // Criar itens de documento
  documents.forEach(doc => {
    const documentDiv = document.createElement('div');
    documentDiv.className = 'p-3 mb-2 border rounded-lg bg-white';
    
    // Descrição do documento
    const descriptionP = document.createElement('p');
    descriptionP.className = 'font-semibold text-gray-800';
    descriptionP.textContent = doc.description;
    
    // Detalhes do documento
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'text-sm text-slate-500 mt-1';
    
    const dateSpan = document.createElement('span');
    dateSpan.textContent = `Data: ${doc.date}`;
    
    const separatorSpan = document.createElement('span');
    separatorSpan.textContent = ' | ';
    
    const typeSpan = document.createElement('span');
    typeSpan.className = 'font-medium';
    typeSpan.textContent = `Tipo: ${doc.fileType.toUpperCase()}`;
    
    detailsDiv.appendChild(dateSpan);
    detailsDiv.appendChild(separatorSpan);
    detailsDiv.appendChild(typeSpan);
    
    // Botão de visualizar documento
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-document-btn mt-2 w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200';
    viewBtn.setAttribute('data-idp', doc.idp);
    viewBtn.setAttribute('data-ids', doc.ids);
    viewBtn.textContent = 'Visualizar Documento';
    
    documentDiv.appendChild(descriptionP);
    documentDiv.appendChild(detailsDiv);
    documentDiv.appendChild(viewBtn);
    contentDiv.appendChild(documentDiv);
  });
}

/**
 * Renders the timeline based on the provided events and status.
 * @param {Array<object>} events - The array of timeline event objects.
 * @param {'loading'|'empty'|'error'|'success'} status - The current status of the timeline.
 */
export function renderTimeline(events, status) {
  const contentDiv = document.getElementById("timeline-content");
  if (!contentDiv) return;

  const eventTypeStyles = {
    consultation: {
      label: "Consulta",
      color: "blue",
      bgColorClass: "bg-blue-100",
      iconColorClass: "text-blue-600",
      icon: "M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3m-6-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    },
    exam: {
      label: "Exame",
      color: "green",
      bgColorClass: "bg-green-100",
      iconColorClass: "text-green-600",
      icon: "M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",
    },
    appointment: {
      label: "Agendamento",
      color: "purple",
      bgColorClass: "bg-purple-100",
      iconColorClass: "text-purple-600",
      icon: "M8 2v4M16 2v4M3 10h18M3 4h18v16H3zM9 16l2 2 4-4",
    },
    regulation: {
      label: "Regulação",
      color: "red",
      bgColorClass: "bg-red-100",
      iconColorClass: "text-red-600",
      icon: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4",
    },
    // --- INÍCIO DA MODIFICAÇÃO ---
    document: {
      label: "Documento",
      color: "gray",
      bgColorClass: "bg-gray-100",
      iconColorClass: "text-gray-600",
      icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6",
    },
    // --- FIM DA MODIFICAÇÃO ---
  };

  let contentHtml = "";

  switch (status) {
    case "loading":
      contentHtml =
        '<p class="text-slate-500 text-center">A carregar linha do tempo...</p>';
      break;
    case "empty":
      contentHtml =
        '<p class="text-slate-500 text-center">Nenhum evento encontrado para este paciente.</p>';
      break;
    case "error":
      contentHtml =
        '<p class="text-red-500 text-center">Ocorreu um erro ao carregar os dados. Tente novamente.</p>';
      break;
    case "success":
      if (events.length === 0) {
        contentHtml =
          '<p class="text-slate-500 text-center">Nenhum evento encontrado para os filtros aplicados.</p>';
        break;
      }
      contentHtml = '<div class="relative space-y-4">';
      contentHtml +=
        '<div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>';

      contentHtml += events
        .map((event) => {
          const style = eventTypeStyles[event.type] || {
            label: "Evento",
            color: "gray",
            icon: "",
          };
          const dateString =
            event.date instanceof Date && !isNaN(event.date)
              ? event.date.toLocaleDateString("pt-BR")
              : "Data Inválida";

          let topRightDetailsHtml = "";
          let extraInfoHtml = "";

          if (event.type === "appointment") {
            const a = event.details;
            
            // Corrigir problema com IDs que podem ter prefixos como "exam-"
            let idp, ids;
            const parts = a.id.split("-");
            
            // Verificar se o primeiro part não é numérico (indica prefixo)
            if (parts.length >= 2 && isNaN(parts[0])) {
              // Se o primeiro part não é numérico, é um prefixo (ex: "exam-525411")
              // Usar o segundo part como ids e tentar obter idp de outras fontes
              ids = parts[1];
              
              // Para exames, tentar obter o idp correto do objeto original
              // Se não disponível, usar o mesmo valor como fallback
              idp = a.examIdp || a.originalIdp || parts[1];
              
              console.warn(`ID com prefixo detectado: ${a.id}, usando idp=${idp}, ids=${ids}`);
            } else {
              // Formato normal: "idp-ids"
              [idp, ids] = parts;
            }

            const statusStyles = {
              AGENDADO: "text-blue-600",
              PRESENTE: "text-green-600",
              FALTOU: "text-red-600",
              CANCELADO: "text-yellow-600",
              ATENDIDO: "text-purple-600",
            };
            const statusClass =
              statusStyles[a.status] || "text-slate-600";
            const timeHtml = `<div class="text-xs text-slate-500">às ${a.time}</div>`;
            const statusHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${a.status}</div>`;

            const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>`;
            const detailsButtonHtml = `<button class="view-appointment-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${idp}" data-ids="${ids}" data-type="${a.type}">${icon}<span>Detalhes</span></button>`;

            topRightDetailsHtml = timeHtml + statusHtml + detailsButtonHtml;
          } else if (event.type === "exam") {
            const statusText = event.details.hasResult
              ? "Com Resultado"
              : "Sem Resultado";
            const statusClass = event.details.hasResult
              ? "text-green-600"
              : "text-yellow-600";
            topRightDetailsHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${statusText}</div>`;
            if (
              event.details.hasResult &&
              event.details.resultIdp &&
              event.details.resultIds
            ) {
              topRightDetailsHtml += `<button class="view-exam-result-btn mt-2 text-xs bg-green-100 text-green-800 py-1 px-3 rounded hover:bg-green-200" data-idp="${event.details.resultIdp}" data-ids="${event.details.resultIds}">Visualizar Resultado</button>`;
            }
          } else if (event.type === "regulation") {
            const r = event.details;
            if (r.idp && r.ids) {
              const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>`;
              topRightDetailsHtml = `<button class="view-regulation-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${r.idp}" data-ids="${r.ids}">${icon}<span>Detalhes</span></button>`;
            }
          }

          if (event.type === "consultation") {
            const c = event.details;
            const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>`;
            topRightDetailsHtml = `<button class="timeline-toggle-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1">${icon}<span>Detalhes</span></button>`;
            
            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    <p class="text-sm text-slate-500 mb-2">${c.unit}</p>
                    ${c.details
                      .map(
                        (d) => `
                        <p class="text-xs font-semibold text-slate-500 uppercase mb-1">${
                          d.label
                        }</p>
                        <p class="text-sm text-slate-700 mb-2">${d.value.replace(
                          /\n/g,
                          "<br>"
                        )} <span class="copy-icon" title="Copiar" data-copy-text="${
                          d.value
                        }">📄</span></p>
                    `
                      )
                      .join("")}
                </div>
            `;
          } else if (event.type === "regulation") {
            const r = event.details;
            const attachmentsHtml =
              r.attachments && r.attachments.length > 0
                ? `
                <div class="mt-2 pt-2 border-t border-slate-100">
                    <p class="text-xs font-semibold text-slate-500 mb-1">ANEXOS:</p>
                    <div class="space-y-1">
                        ${r.attachments
                          .map(
                            (att) => `
                            <button class="view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center" data-idp="${
                              att.idp
                            }" data-ids="${att.ids}">
                                <div class="flex items-center gap-2 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
                                    <span class="truncate" title="${
                                      att.description
                                    } (${att.fileType.toUpperCase()})">${
                              att.description
                            } (${att.fileType.toUpperCase()})</span>
                                </div>
                                <span class="text-xs text-slate-400 flex-shrink-0 ml-2">${
                                  att.date
                                }</span>
                            </button>
                        `
                          )
                          .join("")}
                    </div>
                </div>
                `
                : "";

            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200 text-sm">
                    <p class="mb-1"><strong>Status:</strong> ${r.status}</p>
                    <p class="mb-1"><strong>Prioridade:</strong> ${r.priority}</p>
                    <p class="mb-1"><strong>CID:</strong> ${r.cid}</p>
                    <p class="mb-2"><strong>Executante:</strong> ${
                      r.provider || "Não definido"
                    }</p>
                    ${attachmentsHtml}
                </div>
            `;
            // --- INÍCIO DA MODIFICAÇÃO ---
          } else if (event.type === "document") {
            const doc = event.details;
            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    <button class="view-document-btn w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200" data-idp="${doc.idp}" data-ids="${doc.ids}">
                        Visualizar Documento
                    </button>
                </div>
            `;
          }
          // --- FIM DA MODIFICAÇÃO ---

          return `
                    <div class="relative pl-10 timeline-item" data-event-type="${event.type}">
                        <div class="absolute left-4 top-2 -ml-[15px] h-[30px] w-[30px] rounded-full ${style.bgColorClass} border-2 border-white flex items-center justify-center ${style.iconColorClass}" title="${style.label}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="${style.icon}" />
                            </svg>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div class="timeline-header cursor-pointer">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-sm font-semibold text-${style.color}-700">${event.title}</p>
                                        <p class="text-xs text-slate-600">${event.summary}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0 ml-2">
                                        <p class="text-xs font-medium text-slate-500">${dateString}</p>
                                        ${topRightDetailsHtml}
                                    </div>
                                </div>
                            </div>
                            ${extraInfoHtml}
                        </div>
                    </div>
                `;
        })
        .join("");
      contentHtml += "</div>";
      break;
  }
  contentDiv.innerHTML = contentHtml;
}
