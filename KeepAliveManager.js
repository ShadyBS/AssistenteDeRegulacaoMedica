/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 * Versão compatível com Service Workers (Chrome/Edge) e Background Scripts (Firefox)
 */
import * as API from './api.js';

export class KeepAliveManager {
  constructor() {
    this.intervalId = null;
    this.alarmName = 'keepalive-session';
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos
    this.isServiceWorker = this.detectServiceWorkerEnvironment();

    this.init();
  }

  /**
   * Detecta se está rodando em service worker ou background script
   */
  detectServiceWorkerEnvironment() {
    // Service workers não têm acesso ao DOM
    return typeof document === 'undefined' && typeof window === 'undefined';
  }

  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();

    // Configura listener para alarms se em service worker
    if (this.isServiceWorker) {
      this.setupAlarmListener();
    }

    // Escuta mudanças nas configurações
    const api = typeof browser !== 'undefined' ? browser : chrome;
    if (api.storage && api.storage.onChanged) {
      api.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.keepSessionAliveInterval) {
          this.updateInterval(changes.keepSessionAliveInterval.newValue);
        }
      });
    }
  }

  /**
   * Configura listener para alarms API (service workers)
   */
  setupAlarmListener() {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    
    if (api.alarms && api.alarms.onAlarm) {
      api.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === this.alarmName) {
          this.executeKeepAlive();
        }
      });
    }
  }

  /**
   * Executa a lógica de keep-alive
   */
  async executeKeepAlive() {
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

    // Para o timer/alarm atual
    this.stop();

    // Inicia novo timer/alarm se o valor for maior que 0
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

    if (this.isServiceWorker) {
      this.startWithAlarms();
    } else {
      this.startWithSetInterval();
    }

    this.isActive = true;
    console.log(`Keep-alive iniciado: ${this.intervalMinutes} minutos (${this.isServiceWorker ? 'alarms' : 'setInterval'})`);
  }

  /**
   * Inicia keep-alive usando alarms API (service workers)
   */
  async startWithAlarms() {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    
    if (!api.alarms) {
      console.warn('Alarms API não disponível, fallback para setInterval');
      this.startWithSetInterval();
      return;
    }

    try {
      // Limpa alarm existente
      await api.alarms.clear(this.alarmName);
      
      // Cria novo alarm
      await api.alarms.create(this.alarmName, {
        delayInMinutes: this.intervalMinutes,
        periodInMinutes: this.intervalMinutes
      });
      
      console.log(`Alarm criado: ${this.alarmName} (${this.intervalMinutes} minutos)`);
    } catch (error) {
      console.error('Erro ao criar alarm, fallback para setInterval:', error);
      this.startWithSetInterval();
    }
  }

  /**
   * Inicia keep-alive usando setInterval (background scripts)
   */
  startWithSetInterval() {
    const intervalMs = this.intervalMinutes * 60 * 1000;

    this.intervalId = setInterval(async () => {
      await this.executeKeepAlive();
    }, intervalMs);
  }

  stop() {
    // Para setInterval se estiver ativo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Para alarm se estiver em service worker
    if (this.isServiceWorker) {
      this.stopAlarm();
    }

    this.isActive = false;
    console.log('Keep-alive parado');
  }

  /**
   * Para alarm em service workers
   */
  async stopAlarm() {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    
    if (api.alarms) {
      try {
        await api.alarms.clear(this.alarmName);
        console.log(`Alarm removido: ${this.alarmName}`);
      } catch (error) {
        console.error('Erro ao remover alarm:', error);
      }
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      environment: this.isServiceWorker ? 'service-worker' : 'background-script',
      method: this.isServiceWorker ? 'alarms' : 'setInterval',
      nextExecution: this.isActive ? new Date(Date.now() + this.intervalMinutes * 60 * 1000) : null,
    };
  }
}
