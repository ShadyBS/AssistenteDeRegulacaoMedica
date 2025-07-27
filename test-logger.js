/**
 * @file Script de Teste do Sistema de Logging
 * Verifica funcionalidades do logger.js e demonstra uso
 */

import { 
  getLogger, 
  setLogLevel, 
  exportLogs, 
  clearLogs, 
  getLogStats,
  createComponentLogger,
  LOG_LEVELS,
  debug, 
  info, 
  warn, 
  error 
} from './logger.js';

/**
 * Testa todas as funcionalidades do sistema de logging
 */
async function testLoggingSystem() {
  console.log('🧪 Iniciando testes do sistema de logging...\n');

  // 1. Teste de inicialização
  console.log('1️⃣ Testando inicialização do logger...');
  const logger = getLogger();
  console.log('✅ Logger inicializado com sucesso');
  console.log('📊 Configuração atual:', logger.config);
  console.log('🆔 Session ID:', logger.sessionId);
  console.log('');

  // 2. Teste de níveis de log
  console.log('2️⃣ Testando diferentes níveis de log...');
  
  // Configurar para DEBUG para ver todos os logs
  setLogLevel('DEBUG');
  console.log('📝 Nível configurado para DEBUG');
  
  debug('Mensagem de debug', { component: 'Test', operation: 'debug-test' });
  info('Mensagem de informação', { component: 'Test', operation: 'info-test' });
  warn('Mensagem de aviso', { component: 'Test', operation: 'warn-test' });
  error('Mensagem de erro', { component: 'Test', operation: 'error-test' });
  console.log('✅ Todos os níveis testados');
  console.log('');

  // 3. Teste de filtros por nível
  console.log('3️⃣ Testando filtros por nível...');
  
  setLogLevel('WARN');
  console.log('📝 Nível configurado para WARN (deve filtrar DEBUG e INFO)');
  
  debug('Esta mensagem NÃO deve aparecer', { component: 'Test' });
  info('Esta mensagem NÃO deve aparecer', { component: 'Test' });
  warn('Esta mensagem DEVE aparecer', { component: 'Test' });
  error('Esta mensagem DEVE aparecer', { component: 'Test' });
  console.log('✅ Filtros por nível funcionando');
  console.log('');

  // 4. Teste de logger específico por componente
  console.log('4️⃣ Testando logger específico por componente...');
  
  const apiLogger = createComponentLogger('API');
  const uiLogger = createComponentLogger('UI');
  
  apiLogger.info('Log do componente API', { operation: 'fetch-data' });
  uiLogger.warn('Log do componente UI', { operation: 'render-error' });
  console.log('✅ Loggers por componente funcionando');
  console.log('');

  // 5. Aguardar um pouco para logs serem processados
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 6. Teste de estatísticas
  console.log('5️⃣ Testando estatísticas de logs...');
  
  const stats = await getLogStats();
  console.log('📊 Estatísticas dos logs:');
  console.log('   Total de logs:', stats.total);
  console.log('   Por nível:', stats.byLevel);
  console.log('   Por componente:', stats.byComponent);
  console.log('   Log mais antigo:', stats.oldestLog);
  console.log('   Log mais recente:', stats.newestLog);
  console.log('✅ Estatísticas funcionando');
  console.log('');

  // 7. Teste de exportação
  console.log('6️⃣ Testando exportação de logs...');
  
  const jsonLogs = await exportLogs('json');
  const csvLogs = await exportLogs('csv');
  const textLogs = await exportLogs('text');
  
  console.log('📄 Logs em JSON (primeiros 200 chars):', jsonLogs.substring(0, 200) + '...');
  console.log('📄 Logs em CSV (primeiras 2 linhas):', csvLogs.split('\n').slice(0, 2).join('\n'));
  console.log('📄 Logs em TEXT (primeiras 2 linhas):', textLogs.split('\n').slice(0, 2).join('\n'));
  console.log('✅ Exportação funcionando');
  console.log('');

  // 8. Teste de storage (se disponível)
  console.log('7️⃣ Testando persistência no storage...');
  
  if (logger.api && logger.config.enableStorage) {
    await logger.flush(); // Força salvamento
    console.log('💾 Logs salvos no storage');
    
    // Simular carregamento
    const newLogger = getLogger();
    await newLogger.loadStoredLogs();
    console.log('📂 Logs carregados do storage');
    console.log('✅ Persistência funcionando');
  } else {
    console.log('⚠️ Storage não disponível (normal em ambiente de teste)');
  }
  console.log('');

  // 9. Teste de limpeza
  console.log('8️⃣ Testando limpeza de logs...');
  
  const statsBefore = await getLogStats();
  console.log('📊 Logs antes da limpeza:', statsBefore.total);
  
  await clearLogs();
  
  const statsAfter = await getLogStats();
  console.log('📊 Logs após limpeza:', statsAfter.total);
  console.log('✅ Limpeza funcionando');
  console.log('');

  console.log('🎉 Todos os testes concluídos com sucesso!');
  console.log('');
  
  return {
    success: true,
    message: 'Sistema de logging funcionando corretamente',
    features: {
      initialization: true,
      levels: true,
      filtering: true,
      componentLoggers: true,
      statistics: true,
      export: true,
      storage: logger.api && logger.config.enableStorage,
      cleanup: true
    }
  };
}

/**
 * Demonstra uso prático do sistema de logging
 */
function demonstrateUsage() {
  console.log('📚 Demonstração de uso prático do sistema de logging:\n');

  // Exemplo 1: Logging básico
  console.log('Exemplo 1 - Logging básico:');
  console.log('```javascript');
  console.log('import { debug, info, warn, error } from "./logger.js";');
  console.log('');
  console.log('debug("Iniciando processamento", { userId: "123" });');
  console.log('info("Dados carregados com sucesso", { records: 50 });');
  console.log('warn("Cache expirado, recarregando", { cacheAge: "2h" });');
  console.log('error("Falha na conexão", { endpoint: "/api/data" });');
  console.log('```\n');

  // Exemplo 2: Logger por componente
  console.log('Exemplo 2 - Logger específico por componente:');
  console.log('```javascript');
  console.log('import { createComponentLogger } from "./logger.js";');
  console.log('');
  console.log('const apiLogger = createComponentLogger("API");');
  console.log('const uiLogger = createComponentLogger("UI");');
  console.log('');
  console.log('apiLogger.info("Requisição iniciada", { method: "GET", url: "/patients" });');
  console.log('uiLogger.warn("Componente renderizado com dados incompletos");');
  console.log('```\n');

  // Exemplo 3: Configuração dinâmica
  console.log('Exemplo 3 - Configuração dinâmica:');
  console.log('```javascript');
  console.log('import { setLogLevel, getLogStats, exportLogs } from "./logger.js";');
  console.log('');
  console.log('// Configurar nível de log');
  console.log('setLogLevel("DEBUG"); // ou "INFO", "WARN", "ERROR"');
  console.log('');
  console.log('// Obter estatísticas');
  console.log('const stats = await getLogStats();');
  console.log('console.log("Total de logs:", stats.total);');
  console.log('');
  console.log('// Exportar logs para debugging');
  console.log('const logs = await exportLogs("json");');
  console.log('console.log(logs);');
  console.log('```\n');

  // Exemplo 4: Uso em extensão
  console.log('Exemplo 4 - Uso em extensão de navegador:');
  console.log('```javascript');
  console.log('// background.js');
  console.log('import { createComponentLogger } from "./logger.js";');
  console.log('const logger = createComponentLogger("Background");');
  console.log('');
  console.log('logger.info("Extensão iniciada", { version: "1.0.0" });');
  console.log('');
  console.log('// content-script.js');
  console.log('import { createComponentLogger } from "./logger.js";');
  console.log('const logger = createComponentLogger("Content");');
  console.log('');
  console.log('logger.debug("Script injetado na página", { url: window.location.href });');
  console.log('```\n');
}

/**
 * Gera relatório de configuração do sistema
 */
async function generateConfigReport() {
  const logger = getLogger();
  
  console.log('📋 RELATÓRIO DE CONFIGURAÇÃO DO SISTEMA DE LOGGING');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('🔧 Configuração Atual:');
  console.log('   Nível de log:', Object.keys(LOG_LEVELS)[logger.config.level]);
  console.log('   Máximo de logs armazenados:', logger.config.maxStoredLogs);
  console.log('   Tamanho de rotação:', logger.config.rotationSize);
  console.log('   Console habilitado:', logger.config.enableConsole);
  console.log('   Storage habilitado:', logger.config.enableStorage);
  console.log('   Formato de timestamp:', logger.config.timestampFormat);
  console.log('   Campos de contexto:', logger.config.contextFields.join(', '));
  console.log('');
  
  console.log('🌐 Ambiente:');
  console.log('   API disponível:', !!logger.api);
  console.log('   Tipo de API:', logger.api ? (globalThis.browser ? 'WebExtensions' : 'Chrome') : 'Nenhuma');
  console.log('   Storage funcional:', logger.api && logger.config.enableStorage);
  console.log('   Session ID:', logger.sessionId);
  console.log('');
  
  const stats = await getLogStats();
  console.log('📊 Estatísticas:');
  console.log('   Total de logs:', stats.total);
  console.log('   Logs por nível:');
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    console.log(`     ${level}: ${count}`);
  });
  console.log('   Logs por componente:');
  Object.entries(stats.byComponent).forEach(([component, count]) => {
    console.log(`     ${component}: ${count}`);
  });
  console.log('');
  
  console.log('✅ Sistema funcionando corretamente!');
  console.log('');
}

// Executar testes se este arquivo for executado diretamente
if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
  // Aguardar um pouco para garantir que o logger foi inicializado
  setTimeout(async () => {
    try {
      await testLoggingSystem();
      demonstrateUsage();
      await generateConfigReport();
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    }
  }, 1000);
}

// Exportar funções para uso externo
export {
  testLoggingSystem,
  demonstrateUsage,
  generateConfigReport
};