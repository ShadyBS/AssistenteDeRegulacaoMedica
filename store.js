/**
 * @file store.js - Gestor de estado centralizado para a aplicação.
 * Implementa um padrão simples de "publish-subscribe" para gerir o estado global.
 */

import { createComponentLogger } from "./logger.js";

// Logger específico para Store
const logger = createComponentLogger('Store');

const state = {
  currentPatient: {
    ficha: null,
    cadsus: null,
    lastCadsusCheck: null,
    isUpdating: false,
  },
  recentPatients: [],
  savedFilterSets: {},
};

const listeners = [];
let notificationInProgress = false;
let errorCount = 0;
const MAX_ERRORS = 5;

export const store = {
  /**
   * Adiciona uma função de callback à lista de listeners.
   * @param {Function} listener A função a ser adicionada.
   * @returns {Function} Uma função para remover o listener (unsubscribe).
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      logger.error('Store listener deve ser uma função');
      return () => {};
    }

    listeners.push(listener);
    // PASSO 3.3: Retorna uma função de unsubscribe para melhor gestão de memória.
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  _notify() {
    // Prevenir notificações recursivas
    if (notificationInProgress) {
      logger.warn("Tentativa de notificação recursiva detectada, ignorando...");
      return;
    }

    // Verificar se há muitos erros consecutivos
    if (errorCount >= MAX_ERRORS) {
      logger.error(`Muitos erros consecutivos em listeners (${errorCount}), pausando notificações temporariamente`);
      // Reset contador após 5 segundos
      setTimeout(() => {
        errorCount = 0;
        logger.info("Contador de erros resetado, notificações reativadas");
      }, 5000);
      return;
    }

    notificationInProgress = true;
    let successCount = 0;
    let currentErrorCount = 0;

    for (const listener of listeners) {
      try {
        listener();
        successCount++;
      } catch (error) {
        currentErrorCount++;
        logger.error("Erro num listener do store:", error);

        // Se o erro for crítico, remove o listener problemático
        if (error.name === 'TypeError' || error.name === 'ReferenceError') {
          logger.warn("Removendo listener problemático que causou erro crítico");
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }
    }

    // Atualizar contador de erros
    if (currentErrorCount > 0) {
      errorCount += currentErrorCount;
    } else {
      // Reset contador se todas as notificações foram bem-sucedidas
      errorCount = 0;
    }

    logger.info(`Notificações do store: ${successCount} sucesso(s), ${currentErrorCount} erro(s)`);

    notificationInProgress = false;
  },

  setPatient(fichaData, cadsusData) {
    state.currentPatient.ficha = fichaData;
    state.currentPatient.cadsus = cadsusData;
    state.currentPatient.lastCadsusCheck = cadsusData ? new Date() : null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },

  clearPatient() {
    state.currentPatient.ficha = null;
    state.currentPatient.cadsus = null;
    state.currentPatient.lastCadsusCheck = null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },

  setPatientUpdating() {
    state.currentPatient.isUpdating = true;
    this._notify();
  },

  getPatient() {
    return state.currentPatient.ficha ? state.currentPatient : null;
  },

  setRecentPatients(patients) {
    state.recentPatients = patients;
    this._notify();
  },

  getRecentPatients() {
    return state.recentPatients;
  },

  setSavedFilterSets(sets) {
    state.savedFilterSets = sets;
    this._notify();
  },

  getSavedFilterSets() {
    return state.savedFilterSets;
  },

  getState() {
    return {
      currentPatient: { ...state.currentPatient },
      recentPatients: [...state.recentPatients],
      savedFilterSets: { ...state.savedFilterSets },
    };
  },
};

