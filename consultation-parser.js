/**
 * @file Parser para dados de consultas HTML do sistema SIGSS
 * Este módulo contém funções especializadas para extrair e processar
 * dados de consultas médicas a partir de HTML retornado pela API.
 */

/**
 * Extrai texto formatado de um elemento HTML, convertendo <br> em quebras de linha.
 * @param {Element} element - Elemento HTML para extrair texto
 * @returns {string} Texto formatado com quebras de linha
 */
function getFormattedText(element) {
  if (!element) return "";
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll("br")
    .forEach((br) =>
      br.parentNode.replaceChild(document.createTextNode("\n"), br)
    );
  return clone.textContent || "";
}

/**
 * Converte string de data em objeto Date para ordenação.
 * @param {string} dateString - String de data no formato brasileiro
 * @returns {Date|null} Objeto Date ou null se inválido
 */
function parseDateForSorting(dateString) {
  const datePart = (
    dateString.split("\n").find((p) => p.startsWith("At")) || dateString
  )
    .replace("At", "")
    .trim();
  const match = datePart.match(
    /(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?/
  );
  if (!match) return null;
  const [, day, month, year, hour = 0, minute = 0, second = 0] = match;
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Processa seções SOAP de uma consulta.
 * @param {Array<Element>} blockRows - Linhas da tabela para processar
 * @param {object} consultation - Objeto de consulta para adicionar detalhes
 */
function processSoapSections(blockRows, consultation) {
  const soapSections = ["SUBJETIVO", "OBJETIVO", "AVALIAÇÃO", "PLANO"];

  soapSections.forEach((sectionName) => {
    const headerRowIndex = blockRows.findIndex((row) =>
      row.textContent.includes(`SOAP - ${sectionName}`)
    );
    if (headerRowIndex === -1) return;

    let content = "",
      ciapCid = "",
      obsNota = "";

    const contentEndIndex = blockRows.findIndex(
      (row, index) =>
        index > headerRowIndex && row.textContent.includes("SOAP -")
    );

    const sectionRows = blockRows.slice(
      headerRowIndex + 1,
      contentEndIndex !== -1 ? contentEndIndex : blockRows.length
    );

    sectionRows.forEach((row) => {
      // Processa diagnósticos CID/CIAP
      const diagCell = Array.from(row.querySelectorAll("td")).find(
        (cell) =>
          cell.textContent.includes("CID -") ||
          cell.textContent.includes("CIAP -")
      );
      if (diagCell) {
        ciapCid = diagCell.textContent.trim();
        if (diagCell.nextElementSibling) {
          ciapCid += ` - ${diagCell.nextElementSibling.textContent.trim()}`;
        }
      }

      // Processa descrições
      const descDiv = row.querySelector(".divHpdnObs");
      if (descDiv) content += getFormattedText(descDiv);

      // Processa observações/notas
      const obsCell = Array.from(row.querySelectorAll("td")).find((cell) =>
        cell.textContent.trim().startsWith("OBS./NOTA:")
      );
      if (obsCell) {
        obsNota = obsCell.textContent.replace("OBS./NOTA:", "").trim();
      }
    });

    // Monta valor final da seção
    let finalValue = "";
    if (ciapCid) finalValue += ciapCid.trim();
    if (obsNota) {
      finalValue += (finalValue ? "\n" : "") + `Obs.: ${obsNota.trim()}`;
    }
    if (content) {
      finalValue += (finalValue ? "\n" : "") + `Descrição: ${content.trim()}`;
    }

    if (finalValue.trim()) {
      consultation.details.push({ label: sectionName, value: finalValue });
    }
  });
}

/**
 * Processa consultas não-SOAP (formato tradicional).
 * @param {Array<Element>} blockRows - Linhas da tabela para processar
 * @param {object} consultation - Objeto de consulta para adicionar detalhes
 */
function processTraditionalConsultation(blockRows, consultation) {
  blockRows.forEach((row) => {
    // Processa hipóteses diagnósticas
    const cidCell = Array.from(row.querySelectorAll("td")).find((cell) =>
      cell.textContent.includes("CID -")
    );
    if (cidCell) {
      const descCell = cidCell.nextElementSibling;
      if (descCell) {
        consultation.details.push({
          label: "Hipótese Diagnóstica",
          value: `${cidCell.textContent.trim()} - ${descCell.textContent.trim()}`,
        });
      }
    }

    const rowText = row.textContent.trim();

    // Processa descrição da consulta
    if (rowText.includes("DESCRIÇÃO DA CONSULTA")) {
      const nextRow = row.nextElementSibling;
      const descDiv = nextRow?.querySelector(".divHpdnObs");
      if (descDiv) {
        consultation.details.push({
          label: "Descrição da Consulta",
          value: getFormattedText(descDiv).trim(),
        });
      }
    }

    // Processa observações de enfermagem
    if (rowText.includes("OBSERVAÇÃO DE ENFERMAGEM:")) {
      const obsCell = row.querySelector("td[colspan]");
      if (obsCell) {
        consultation.details.push({
          label: "Observação de Enfermagem",
          value: getFormattedText(obsCell)
            .replace("OBSERVAÇÃO DE ENFERMAGEM:", "")
            .trim(),
        });
      }
    }
  });
}

/**
 * Processa uma linha principal de consulta.
 * @param {Element} mainRow - Linha principal da tabela
 * @param {Array<Element>} rows - Todas as linhas da tabela
 * @param {number} startIndex - Índice da linha atual
 * @returns {object} Objeto de consulta processado
 */
function processConsultationRow(mainRow, rows, startIndex) {
  const mainCells = mainRow.querySelectorAll("td");
  const dateText = mainCells[1].textContent.trim().replace(/\s+/g, " ");

  const consultation = {
    priority: mainCells[0].textContent.trim(),
    date: dateText.replace("At", "\nAt"),
    sortableDate: parseDateForSorting(dateText),
    unit: mainCells[2].textContent.trim(),
    specialty: mainCells[3].textContent.trim(),
    professional: mainCells[4].textContent
      .trim()
      .replace(/Insc\.: \d+/, "")
      .trim(),
    details: [],
    isNoShow: mainRow.textContent.includes("FALTOU A CONSULTA"),
  };

  // Encontra o fim do bloco desta consulta
  let endIndex = rows.findIndex(
    (row, index) =>
      index > startIndex &&
      row.querySelectorAll("td").length > 5 &&
      row.querySelectorAll("td")[0].className.includes("width10")
  );
  if (endIndex === -1) endIndex = rows.length;

  const blockRows = rows.slice(startIndex + 1, endIndex);
  const isSoapNote = blockRows.some((row) =>
    row.textContent.includes("SOAP -")
  );

  if (isSoapNote) {
    processSoapSections(blockRows, consultation);
  } else {
    processTraditionalConsultation(blockRows, consultation);
  }

  return { consultation, nextIndex: endIndex };
}

/**
 * Converte HTML de consultas em array de objetos estruturados.
 * Esta função processa o HTML retornado pela API do SIGSS e extrai
 * informações estruturadas sobre consultas médicas.
 *
 * @param {string} htmlString - HTML da tabela de consultas
 * @returns {Array<object>} Array de objetos de consulta
 */
export function parseConsultasHTML(htmlString) {
  if (!htmlString) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const rows = Array.from(doc.querySelectorAll("tbody > tr"));
  const consultations = [];

  let i = 0;
  while (i < rows.length) {
    const mainRow = rows[i];
    const mainCells = mainRow.querySelectorAll("td");

    // Verifica se é uma linha principal de consulta
    if (mainCells.length < 5 || !mainCells[0].className.includes("width10")) {
      i++;
      continue;
    }

    try {
      const result = processConsultationRow(mainRow, rows, i);
      consultations.push(result.consultation);
      i = result.nextIndex;
    } catch (error) {
      console.warn(`Erro ao processar consulta na linha ${i}:`, error);
      i++; // Continua para a próxima linha em caso de erro
    }
  }

  return consultations;
}
