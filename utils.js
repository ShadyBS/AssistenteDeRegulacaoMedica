/**
 * @file Contém funções utilitárias compartilhadas em toda a extensão.
 */

/**
 * Atraso na execução de uma função após o utilizador parar de digitar.
 * @param {Function} func A função a ser executada.
 * @param {number} [delay=500] O tempo de espera em milissegundos.
 * @returns {Function} A função com debounce.
 */
export function debounce(func, delay = 500) {
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
 * @param {'error' | 'success'} [type='error'] O tipo de mensagem.
 */
export function showMessage(text, type = "error") {
  const messageArea = document.getElementById("message-area");
  if (messageArea) {
    messageArea.textContent = text;
    messageArea.className = `p-3 rounded-md text-sm ${
      type === "error"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
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
 * Converte uma string de data "dd/MM/yyyy" para um objeto Date.
 * @param {string} dateString A data no formato "dd/MM/yyyy".
 * @returns {Date|null} O objeto Date ou null se a string for inválida.
 */
export function parseDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  // Assume dd/MM/yyyy
  return new Date(parts[2], parts[1] - 1, parts[0]);
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
