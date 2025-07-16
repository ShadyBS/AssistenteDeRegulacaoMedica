/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 * Usa a API de alarmes para garantir funcionamento em Manifest V3
 */
import * as API from "./api.js";

export class KeepAliveManager {
  constructor() {
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos
    this.alarmName = "keepSessionAlive";
    
    this.init();
  }

  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();
    
    // Configura listener para alarmes
    this.setupAlarmListener();
    
    // Escuta mudanças nas configurações
    if (typeof browser !== "undefined") {
      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes.keepSessionAliveInterval) {
          this.updateInterval(changes.keepSessionAliveInterval.newValue);
        }
      });
    }
  }

  setupAlarmListener() {
    const api = typeof browser !== "undefined" ? browser : chrome;
    
    if (api.alarms) {
      api.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name === this.alarmName) {
          try {
            const success = await API.keepSessionAlive();
            if (success) {
              console.log(`Keep-alive executado com sucesso (${new Date().toLocaleTimeString()})`);
            } else {
              console.warn(`Keep-alive falhou (${new Date().toLocaleTimeString()})`);
            }
          } catch (error) {
            console.error("Erro no keep-alive:", error);
          }
        }
      });
    }
  }

  async loadSettings() {
    try {
      const api = typeof browser !== "undefined" ? browser : chrome;
      const result = await api.storage.sync.get({
        keepSessionAliveInterval: 10
      });
      
      this.updateInterval(result.keepSessionAliveInterval);
    } catch (error) {
      console.error("Erro ao carregar configurações do keep-alive:", error);
    }
  }

  updateInterval(minutes) {
    const newMinutes = parseInt(minutes, 10) || 0;
    
    this.intervalMinutes = newMinutes;
    
    // Para o alarme atual
    this.stop();
    
    // Inicia novo alarme se o valor for maior que 0
    if (this.intervalMinutes > 0) {
      this.start();
    }
  }

  async start() {
    if (this.intervalMinutes <= 0) {
      console.log("Keep-alive desativado (intervalo = 0)");
      return;
    }

    if (this.isActive) {
      console.log("Keep-alive já está ativo");
      return;
    }

    const api = typeof browser !== "undefined" ? browser : chrome;
    
    if (!api.alarms) {
      console.error("API de alarmes não disponível - keep-alive não funcionará");
      return;
    }

    try {
      // Cria um alarme periódico
      await api.alarms.create(this.alarmName, {
        delayInMinutes: this.intervalMinutes,
        periodInMinutes: this.intervalMinutes
      });

      this.isActive = true;
      console.log(`Keep-alive iniciado: ${this.intervalMinutes} minutos usando alarmes`);
      
      // Executa imediatamente uma vez para testar
      try {
        const success = await API.keepSessionAlive();
        if (success) {
          console.log(`Keep-alive inicial executado com sucesso (${new Date().toLocaleTimeString()})`);
        } else {
          console.warn(`Keep-alive inicial falhou (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error("Erro no keep-alive inicial:", error);
      }
      
    } catch (error) {
      console.error("Erro ao criar alarme para keep-alive:", error);
    }
  }

  async stop() {
    const api = typeof browser !== "undefined" ? browser : chrome;
    
    if (api.alarms) {
      try {
        await api.alarms.clear(this.alarmName);
      } catch (error) {
        console.error("Erro ao limpar alarme:", error);
      }
    }
    
    this.isActive = false;
    console.log("Keep-alive parado");
  }

  async getStatus() {
    const api = typeof browser !== "undefined" ? browser : chrome;
    let nextExecution = null;
    
    if (this.isActive && api.alarms) {
      try {
        const alarm = await api.alarms.get(this.alarmName);
        if (alarm && alarm.scheduledTime) {
          nextExecution = new Date(alarm.scheduledTime);
        }
      } catch (error) {
        console.error("Erro ao obter status do alarme:", error);
      }
    }
    
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      nextExecution: nextExecution
    };
  }
}