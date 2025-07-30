#!/usr/bin/env node

/**
 * 🔔 NOTIFICATION SYSTEM - ASSISTENTE DE REGULAÇÃO MÉDICA
 *
 * Sistema avançado de notificações para pipeline CI/CD
 * Suporte para Discord, Slack, Teams, Email e webhooks customizados
 * Templates personalizáveis e retry logic
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class NotificationSystem {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      retryAttempts: 3,
      retryDelay: 2000,
      ...options
    };

    this.providers = {
      discord: this.sendDiscordNotification.bind(this),
      slack: this.sendSlackNotification.bind(this),
      teams: this.sendTeamsNotification.bind(this),
      email: this.sendEmailNotification.bind(this),
      webhook: this.sendWebhookNotification.bind(this)
    };

    this.templates = {
      buildSuccess: this.getBuildSuccessTemplate.bind(this),
      buildFailure: this.getBuildFailureTemplate.bind(this),
      deploymentSuccess: this.getDeploymentSuccessTemplate.bind(this),
      deploymentFailure: this.getDeploymentFailureTemplate.bind(this),
      securityAlert: this.getSecurityAlertTemplate.bind(this),
      performanceAlert: this.getPerformanceAlertTemplate.bind(this),
      releaseNotification: this.getReleaseNotificationTemplate.bind(this)
    };

    this.log('🔔 Notification System initialized');
  }

  log(message, level = 'info') {
    if (!this.options.verbose && level === 'debug') return;

    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';

    console.log(`${prefix} ${message}`);
  }

  async sendNotification(type, data, providers = null) {
    this.log(`🔔 Sending ${type} notification...`);

    try {
      // Determinar providers a usar
      const targetProviders = providers || this.getConfiguredProviders();

      if (targetProviders.length === 0) {
        this.log('⚠️ No notification providers configured', 'warning');
        return { success: false, reason: 'No providers configured' };
      }

      // Gerar conteúdo da notificação
      const content = await this.generateNotificationContent(type, data);

      // Enviar para todos os providers
      const results = await Promise.allSettled(
        targetProviders.map(provider => this.sendToProvider(provider, content, data))
      );

      // Analisar resultados
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        this.log(`✅ Notification sent successfully to ${successful}/${targetProviders.length} providers`, 'success');
        return { success: true, successful, failed, results };
      } else {
        this.log(`❌ Failed to send notification to all providers`, 'error');
        return { success: false, successful, failed, results };
      }

    } catch (error) {
      this.log(`❌ Notification system error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  getConfiguredProviders() {
    const providers = [];

    if (process.env.DISCORD_WEBHOOK_URL) providers.push('discord');
    if (process.env.SLACK_WEBHOOK_URL) providers.push('slack');
    if (process.env.TEAMS_WEBHOOK_URL) providers.push('teams');
    if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_FROM) providers.push('email');
    if (process.env.CUSTOM_WEBHOOK_URL) providers.push('webhook');

    return providers;
  }

  async generateNotificationContent(type, data) {
    this.log(`📝 Generating ${type} notification content...`, 'debug');

    if (!this.templates[type]) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await this.templates[type](data);
  }

  async sendToProvider(provider, content, data) {
    this.log(`📤 Sending to ${provider}...`, 'debug');

    if (!this.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return await this.retryOperation(
      () => this.providers[provider](content, data),
      `${provider} notification`
    );
  }

  async retryOperation(operation, operationName) {
    let lastError;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.options.retryAttempts) {
          this.log(`⚠️ ${operationName} failed (attempt ${attempt}/${this.options.retryAttempts}), retrying...`, 'warning');
          await this.sleep(this.options.retryDelay);
        }
      }
    }

    throw lastError;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===================================================================
  // DISCORD NOTIFICATIONS
  // ===================================================================

  async sendDiscordNotification(content, data) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const payload = {
      embeds: [{
        title: content.title,
        description: content.description,
        color: content.color,
        fields: content.fields || [],
        footer: {
          text: `Assistente de Regulação Médica • ${new Date().toLocaleString()}`
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Adicionar thumbnail se disponível
    if (content.thumbnail) {
      payload.embeds[0].thumbnail = { url: content.thumbnail };
    }

    // Adicionar imagem se disponível
    if (content.image) {
      payload.embeds[0].image = { url: content.image };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord notification failed: ${error}`);
    }

    this.log('✅ Discord notification sent', 'success');
    return { provider: 'discord', success: true };
  }

  // ===================================================================
  // SLACK NOTIFICATIONS
  // ===================================================================

  async sendSlackNotification(content, data) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const payload = {
      text: content.title,
      attachments: [{
        color: this.getSlackColor(content.color),
        title: content.title,
        text: content.description,
        fields: (content.fields || []).map(field => ({
          title: field.name,
          value: field.value,
          short: field.inline || false
        })),
        footer: 'Assistente de Regulação Médica',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack notification failed: ${error}`);
    }

    this.log('✅ Slack notification sent', 'success');
    return { provider: 'slack', success: true };
  }

  getSlackColor(discordColor) {
    // Converter cor do Discord para Slack
    const colorMap = {
      3066993: 'good',    // Verde
      15158332: 'danger', // Vermelho
      15105570: 'warning' // Amarelo
    };

    return colorMap[discordColor] || '#36a64f';
  }

  // ===================================================================
  // MICROSOFT TEAMS NOTIFICATIONS
  // ===================================================================

  async sendTeamsNotification(content, data) {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Teams webhook URL not configured');
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getTeamsColor(content.color),
      summary: content.title,
      sections: [{
        activityTitle: content.title,
        activitySubtitle: 'Assistente de Regulação Médica',
        text: content.description,
        facts: (content.fields || []).map(field => ({
          name: field.name,
          value: field.value
        }))
      }]
    };

    // Adicionar ações se disponível
    if (content.actions) {
      payload.potentialAction = content.actions.map(action => ({
        '@type': 'OpenUri',
        name: action.label,
        targets: [{
          os: 'default',
          uri: action.url
        }]
      }));
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Teams notification failed: ${error}`);
    }

    this.log('✅ Teams notification sent', 'success');
    return { provider: 'teams', success: true };
  }

  getTeamsColor(discordColor) {
    const colorMap = {
      3066993: '00FF00',   // Verde
      15158332: 'FF0000',  // Vermelho
      15105570: 'FFA500'   // Amarelo
    };

    return colorMap[discordColor] || '00FF00';
  }

  // ===================================================================
  // EMAIL NOTIFICATIONS
  // ===================================================================

  async sendEmailNotification(content, data) {
    const smtpConfig = {
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT) || 587,
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
      }
    };

    if (!smtpConfig.host) {
      throw new Error('Email SMTP configuration not found');
    }

    const transporter = nodemailer.createTransporter(smtpConfig);

    // Gerar HTML do email
    const htmlContent = this.generateEmailHTML(content);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO || process.env.EMAIL_FROM,
      subject: content.title,
      text: content.description,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);

    this.log('✅ Email notification sent', 'success');
    return { provider: 'email', success: true, messageId: result.messageId };
  }

  generateEmailHTML(content) {
    const colorStyle = content.color === 15158332 ? 'color: #dc3545;' :
                      content.color === 15105570 ? 'color: #ffc107;' :
                      'color: #28a745;';

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${content.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { ${colorStyle} font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .description { font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #333; }
        .fields { margin-top: 20px; }
        .field { margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
        .field-name { font-weight: bold; color: #495057; }
        .field-value { color: #6c757d; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">${content.title}</div>
        <div class="description">${content.description}</div>
`;

    if (content.fields && content.fields.length > 0) {
      html += '<div class="fields">';
      for (const field of content.fields) {
        html += `
            <div class="field">
                <div class="field-name">${field.name}</div>
                <div class="field-value">${field.value}</div>
            </div>
        `;
      }
      html += '</div>';
    }

    html += `
        <div class="footer">
            Assistente de Regulação Médica<br>
            ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
`;

    return html;
  }

  // ===================================================================
  // WEBHOOK NOTIFICATIONS
  // ===================================================================

  async sendWebhookNotification(content, data) {
    const webhookUrl = process.env.CUSTOM_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Custom webhook URL not configured');
    }

    const payload = {
      type: data.type || 'notification',
      timestamp: new Date().toISOString(),
      content: content,
      data: data,
      source: 'assistente-regulacao-medica'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AssistenteRegulacao/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webhook notification failed: ${error}`);
    }

    this.log('✅ Webhook notification sent', 'success');
    return { provider: 'webhook', success: true };
  }

  // ===================================================================
  // NOTIFICATION TEMPLATES
  // ===================================================================

  async getBuildSuccessTemplate(data) {
    return {
      title: '🎉 Build Successful',
      description: `Build completed successfully for version ${data.version || 'unknown'}`,
      color: 3066993, // Verde
      fields: [
        {
          name: 'Version',
          value: data.version || 'unknown',
          inline: true
        },
        {
          name: 'Branch',
          value: data.branch || 'unknown',
          inline: true
        },
        {
          name: 'Duration',
          value: data.duration || 'unknown',
          inline: true
        },
        {
          name: 'Targets',
          value: (data.targets || []).join(', ') || 'unknown',
          inline: false
        }
      ],
      actions: data.releaseUrl ? [{
        label: 'View Release',
        url: data.releaseUrl
      }] : undefined
    };
  }

  async getBuildFailureTemplate(data) {
    return {
      title: '❌ Build Failed',
      description: `Build failed for version ${data.version || 'unknown'}`,
      color: 15158332, // Vermelho
      fields: [
        {
          name: 'Version',
          value: data.version || 'unknown',
          inline: true
        },
        {
          name: 'Branch',
          value: data.branch || 'unknown',
          inline: true
        },
        {
          name: 'Error',
          value: data.error || 'Unknown error',
          inline: false
        },
        {
          name: 'Failed Stage',
          value: data.stage || 'unknown',
          inline: true
        }
      ],
      actions: data.logsUrl ? [{
        label: 'View Logs',
        url: data.logsUrl
      }] : undefined
    };
  }

  async getDeploymentSuccessTemplate(data) {
    return {
      title: '🚀 Deployment Successful',
      description: `Version ${data.version || 'unknown'} deployed successfully to ${(data.stores || []).join(', ')}`,
      color: 3066993, // Verde
      fields: [
        {
          name: 'Version',
          value: data.version || 'unknown',
          inline: true
        },
        {
          name: 'Environment',
          value: data.environment || 'production',
          inline: true
        },
        {
          name: 'Stores',
          value: (data.stores || []).join(', ') || 'unknown',
          inline: false
        },
        {
          name: 'Duration',
          value: data.duration || 'unknown',
          inline: true
        }
      ],
      actions: data.releaseUrl ? [{
        label: 'View Release',
        url: data.releaseUrl
      }] : undefined
    };
  }

  async getDeploymentFailureTemplate(data) {
    return {
      title: '💥 Deployment Failed',
      description: `Deployment failed for version ${data.version || 'unknown'}`,
      color: 15158332, // Vermelho
      fields: [
        {
          name: 'Version',
          value: data.version || 'unknown',
          inline: true
        },
        {
          name: 'Environment',
          value: data.environment || 'production',
          inline: true
        },
        {
          name: 'Failed Store',
          value: data.failedStore || 'unknown',
          inline: true
        },
        {
          name: 'Error',
          value: data.error || 'Unknown error',
          inline: false
        }
      ]
    };
  }

  async getSecurityAlertTemplate(data) {
    return {
      title: '🚨 Security Alert',
      description: `Security issue detected: ${data.issue || 'Unknown issue'}`,
      color: 15158332, // Vermelho
      fields: [
        {
          name: 'Severity',
          value: data.severity || 'unknown',
          inline: true
        },
        {
          name: 'Component',
          value: data.component || 'unknown',
          inline: true
        },
        {
          name: 'Description',
          value: data.description || 'No description available',
          inline: false
        },
        {
          name: 'Recommendation',
          value: data.recommendation || 'Review security documentation',
          inline: false
        }
      ]
    };
  }

  async getPerformanceAlertTemplate(data) {
    return {
      title: '⚡ Performance Alert',
      description: `Performance issue detected: ${data.issue || 'Unknown issue'}`,
      color: 15105570, // Amarelo
      fields: [
        {
          name: 'Metric',
          value: data.metric || 'unknown',
          inline: true
        },
        {
          name: 'Current Value',
          value: data.currentValue || 'unknown',
          inline: true
        },
        {
          name: 'Threshold',
          value: data.threshold || 'unknown',
          inline: true
        },
        {
          name: 'Impact',
          value: data.impact || 'Performance degradation',
          inline: false
        }
      ]
    };
  }

  async getReleaseNotificationTemplate(data) {
    return {
      title: '📦 New Release Available',
      description: `Version ${data.version || 'unknown'} has been released!`,
      color: 3066993, // Verde
      fields: [
        {
          name: 'Version',
          value: data.version || 'unknown',
          inline: true
        },
        {
          name: 'Release Type',
          value: data.releaseType || 'stable',
          inline: true
        },
        {
          name: 'Changes',
          value: data.changes || 'See release notes for details',
          inline: false
        },
        {
          name: 'Download',
          value: 'Available on Chrome Web Store and Firefox Add-ons',
          inline: false
        }
      ],
      actions: data.releaseUrl ? [{
        label: 'View Release Notes',
        url: data.releaseUrl
      }] : undefined
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node notification-system.js <type> <data-json> [providers]');
    console.log('Types: buildSuccess, buildFailure, deploymentSuccess, deploymentFailure, securityAlert, performanceAlert, releaseNotification');
    console.log('Providers: discord, slack, teams, email, webhook (comma-separated, optional)');
    process.exit(1);
  }

  const type = args[0];
  const dataJson = args[1];
  const providers = args[2] ? args[2].split(',') : null;

  try {
    const data = JSON.parse(dataJson);
    const notificationSystem = new NotificationSystem({ verbose: true });

    const result = await notificationSystem.sendNotification(type, data, providers);

    if (result.success) {
      console.log('✅ Notification sent successfully');
      process.exit(0);
    } else {
      console.log('❌ Notification failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default NotificationSystem;
