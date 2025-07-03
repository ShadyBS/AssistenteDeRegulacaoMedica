/**
 * @file store.js - Gestor de estado centralizado para a aplicação.
 * Implementa um padrão simples de "publish-subscribe" para gerir o estado global,
 * como o paciente atualmente selecionado.
 */

// O estado privado do nosso armazém.
const state = {
  currentPatient: null,
  // Outros estados globais podem ser adicionados aqui no futuro.
};

// Uma lista de funções (listeners) a serem chamadas quando o estado muda.
const listeners = [];

/**
 * O objeto 'store' exportado que fornece a interface para interagir com o estado.
 */
export const store = {
  /**
   * Adiciona uma função de callback à lista de listeners.
   * Esta função será chamada sempre que o estado for alterado.
   * @param {Function} listener A função a ser adicionada.
   */
  subscribe(listener) {
    listeners.push(listener);
  },

  /**
   * Notifica todos os listeners de que o estado mudou.
   * @private
   */
  _notify() {
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        console.error("Erro num listener do store:", error);
      }
    }
  },

  /**
   * Define o paciente atual no estado e notifica todos os listeners.
   * @param {object | null} patient - O objeto do paciente ou null para limpar.
   */
  setPatient(patient) {
    state.currentPatient = patient;
    this._notify();
  },

  /**
   * Retorna o objeto do paciente atualmente no estado.
   * @returns {object | null} O paciente atual.
   */
  getPatient() {
    return state.currentPatient;
  },

  /**
   * Retorna uma cópia completa do estado atual.
   * @returns {object} O estado da aplicação.
   */
  getState() {
    return { ...state };
  },
};
