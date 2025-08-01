/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 */
import * as API from './api.js';

export class KeepAliveManager {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos

    this.init();
  }

  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();

    // Escuta mudanças nas configurações
    if (typeof browser !== 'undefined') {
      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.keepSessionAliveInterval) {
          this.updateInterval(changes.keepSessionAliveInterval.newValue);
        }
      });
    }
  }

  async loadSettings() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.sync.get({
        keepSessionAliveInterval: 10,
      });

      this.updateInterval(result.keepSessionAliveInterval);
    } catch (error) {
      console.error('Erro ao carregar configurações do keep-alive:', error);
    }
  }

  updateInterval(minutes) {
    const newMinutes = parseInt(minutes, 10) || 0;

    this.intervalMinutes = newMinutes;

    // Para o timer atual
    this.stop();

    // Inicia novo timer se o valor for maior que 0
    if (this.intervalMinutes > 0) {
      this.start();
    }
  }

  start() {
    if (this.intervalMinutes <= 0) {
      console.log('Keep-alive desativado (intervalo = 0)');
      return;
    }

    if (this.isActive) {
      console.log('Keep-alive já está ativo');
      return;
    }

    const intervalMs = this.intervalMinutes * 60 * 1000; // Converte minutos para milissegundos

    this.intervalId = setInterval(async () => {
      try {
        const success = await API.keepSessionAlive();
        if (success) {
          console.log(`Keep-alive executado com sucesso (${new Date().toLocaleTimeString()})`);
        } else {
          console.warn(`Keep-alive falhou (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error('Erro no keep-alive:', error);
      }
    }, intervalMs);

    this.isActive = true;
    console.log(`Keep-alive iniciado: ${this.intervalMinutes} minutos (${intervalMs}ms)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isActive = false;
    console.log('Keep-alive parado');
  }

  getStatus() {
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      nextExecution: this.isActive ? new Date(Date.now() + this.intervalMinutes * 60 * 1000) : null,
    };
  }
}
