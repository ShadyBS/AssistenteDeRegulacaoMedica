/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 * Usa a API de alarmes para garantir funcionamento em Manifest V3
 */
import * as API from "./api.js";
import { getBrowserAPIInstance } from "./BrowserAPI.js";

export class KeepAliveManager {
  constructor() {
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos
    this.alarmName = "keepSessionAlive";
    this.api = getBrowserAPIInstance();
    
    this.init();
  }

  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();
    
    // Configura listener para alarmes
    this.setupAlarmListener();
    
    // Escuta mudanças nas configurações
    this.api.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes.keepSessionAliveInterval) {
        this.updateInterval(changes.keepSessionAliveInterval.newValue);
      }
    });
  }

  setupAlarmListener() {
    if (this.api.alarms) {
      this.api.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name === this.alarmName) {
          try {
            const success = await API.keepSessionAlive();
            if (success) {
              console.log(`[KeepAlive] Executado com sucesso (${new Date().toLocaleTimeString()})`);
            } else {
              console.warn(`[KeepAlive] Falhou (${new Date().toLocaleTimeString()})`);
            }
          } catch (error) {
            console.error("[KeepAlive] Erro durante execução:", error);
          }
        }
      });
    }
  }

  async loadSettings() {
    try {
      const result = await this.api.storage.sync.get({
        keepSessionAliveInterval: 10
      });
      
      this.updateInterval(result.keepSessionAliveInterval);
    } catch (error) {
      console.error("[KeepAlive] Erro ao carregar configurações:", error);
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
      console.log("[KeepAlive] Desativado (intervalo = 0)");
      return;
    }

    if (this.isActive) {
      console.log("[KeepAlive] Já está ativo");
      return;
    }
    
    if (!this.api.alarms) {
      console.error("[KeepAlive] API de alarmes não disponível - keep-alive não funcionará");
      return;
    }

    try {
      // Cria um alarme periódico
      await this.api.alarms.create(this.alarmName, {
        delayInMinutes: this.intervalMinutes,
        periodInMinutes: this.intervalMinutes
      });

      this.isActive = true;
      console.log(`[KeepAlive] Iniciado: ${this.intervalMinutes} minutos usando alarmes`);
      
      // Executa imediatamente uma vez para testar
      try {
        const success = await API.keepSessionAlive();
        if (success) {
          console.log(`[KeepAlive] Execução inicial bem-sucedida (${new Date().toLocaleTimeString()})`);
        } else {
          console.warn(`[KeepAlive] Execução inicial falhou (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error("[KeepAlive] Erro na execução inicial:", error);
      }
      
    } catch (error) {
      console.error("[KeepAlive] Erro ao criar alarme:", error);
    }
  }

  async stop() {
    if (this.api.alarms) {
      try {
        await this.api.alarms.clear(this.alarmName);
      } catch (error) {
        console.error("[KeepAlive] Erro ao limpar alarme:", error);
      }
    }
    
    this.isActive = false;
    console.log("[KeepAlive] Parado");
  }

  async getStatus() {
    let nextExecution = null;
    
    if (this.isActive && this.api.alarms) {
      try {
        const alarm = await this.api.alarms.get(this.alarmName);
        if (alarm && alarm.scheduledTime) {
          nextExecution = new Date(alarm.scheduledTime);
        }
      } catch (error) {
        console.error("[KeepAlive] Erro ao obter status do alarme:", error);
      }
    }
    
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      nextExecution: nextExecution
    };
  }
}