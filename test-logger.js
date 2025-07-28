/**
 * Sistema de testes para o sistema de logging
 * Verifica se todas as funcionalidades do logger estão funcionando corretamente
 */

import { createComponentLogger, getLogger, setLogLevel, exportLogs, clearLogs, getLogStats, LOG_LEVELS } from './logger.js';

/**
 * Executa uma bateria completa de testes no sistema de logging
 * @returns {Promise<Object>} Resultado dos testes com propriedade success
 */
export async function testLoggingSystem() {
  const testResults = {
    success: false,
    tests: [],
    errors: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    // Teste 1: Verificar se o logger principal está disponível
    testResults.tests.push(await testLoggerAvailability());

    // Teste 2: Verificar criação de logger de componente
    testResults.tests.push(await testComponentLoggerCreation());

    // Teste 3: Verificar diferentes níveis de log
    testResults.tests.push(await testLogLevels());

    // Teste 4: Verificar configuração de nível de log
    testResults.tests.push(await testLogLevelConfiguration());

    // Teste 5: Verificar estatísticas de logs
    testResults.tests.push(await testLogStats());

    // Teste 6: Verificar exportação de logs
    testResults.tests.push(await testLogExport());

    // Calcular estatísticas finais
    testResults.summary.total = testResults.tests.length;
    testResults.summary.passed = testResults.tests.filter(test => test.passed).length;
    testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
    testResults.success = testResults.summary.failed === 0;

    // Log do resultado final
    const logger = createComponentLogger('TestLogger');
    if (testResults.success) {
      logger.info('Todos os testes do sistema de logging passaram', testResults.summary);
    } else {
      logger.error('Alguns testes do sistema de logging falharam', {
        summary: testResults.summary,
        failures: testResults.tests.filter(test => !test.passed)
      });
    }

  } catch (error) {
    testResults.errors.push({
      test: 'Sistema de Testes',
      error: error.message,
      stack: error.stack
    });
    testResults.success = false;
  }

  return testResults;
}

/**
 * Testa se o logger principal está disponível
 */
async function testLoggerAvailability() {
  const test = {
    name: 'Logger Principal Disponível',
    passed: false,
    error: null
  };

  try {
    const logger = getLogger();
    if (logger && typeof logger.info === 'function') {
      test.passed = true;
    } else {
      test.error = 'Logger principal não está disponível ou não tem método info';
    }
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Testa criação de logger de componente
 */
async function testComponentLoggerCreation() {
  const test = {
    name: 'Criação de Logger de Componente',
    passed: false,
    error: null
  };

  try {
    const componentLogger = createComponentLogger('TestComponent');
    if (componentLogger &&
        typeof componentLogger.debug === 'function' &&
        typeof componentLogger.info === 'function' &&
        typeof componentLogger.warn === 'function' &&
        typeof componentLogger.error === 'function') {
      test.passed = true;
    } else {
      test.error = 'Logger de componente não foi criado corretamente ou não tem todos os métodos';
    }
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Testa diferentes níveis de log
 */
async function testLogLevels() {
  const test = {
    name: 'Níveis de Log',
    passed: false,
    error: null
  };

  try {
    const logger = createComponentLogger('TestLevels');

    // Testa cada nível de log
    logger.debug('Teste de debug', { level: 'DEBUG' });
    logger.info('Teste de info', { level: 'INFO' });
    logger.warn('Teste de warning', { level: 'WARN' });
    logger.error('Teste de error', { level: 'ERROR' });

    // Verifica se LOG_LEVELS está disponível
    if (LOG_LEVELS &&
        LOG_LEVELS.DEBUG !== undefined &&
        LOG_LEVELS.INFO !== undefined &&
        LOG_LEVELS.WARN !== undefined &&
        LOG_LEVELS.ERROR !== undefined) {
      test.passed = true;
    } else {
      test.error = 'LOG_LEVELS não está definido corretamente';
    }
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Testa configuração de nível de log
 */
async function testLogLevelConfiguration() {
  const test = {
    name: 'Configuração de Nível de Log',
    passed: false,
    error: null
  };

  try {
    const originalLevel = getLogger().config?.logLevel;

    // Testa mudança de nível
    setLogLevel('DEBUG');
    setLogLevel('INFO');
    setLogLevel('WARN');
    setLogLevel('ERROR');

    // Restaura nível original se existir
    if (originalLevel) {
      setLogLevel(originalLevel);
    }

    test.passed = true;
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Testa estatísticas de logs
 */
async function testLogStats() {
  const test = {
    name: 'Estatísticas de Logs',
    passed: false,
    error: null
  };

  try {
    const stats = await getLogStats();

    if (stats &&
        typeof stats.total === 'number' &&
        stats.byLevel &&
        typeof stats.byLevel === 'object') {
      test.passed = true;
    } else {
      test.error = 'Estatísticas de logs não retornaram formato esperado';
    }
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Testa exportação de logs
 */
async function testLogExport() {
  const test = {
    name: 'Exportação de Logs',
    passed: false,
    error: null
  };

  try {
    const exportedLogs = await exportLogs('json');

    if (typeof exportedLogs === 'string') {
      // Tenta fazer parse do JSON para verificar se é válido
      try {
        JSON.parse(exportedLogs);
        test.passed = true;
      } catch (parseError) {
        test.error = 'Logs exportados não são JSON válido';
      }
    } else {
      test.error = 'Exportação de logs não retornou string';
    }
  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Executa teste básico de performance do sistema de logging
 * @returns {Promise<Object>} Resultado do teste de performance
 */
export async function testLoggingPerformance() {
  const test = {
    name: 'Performance do Sistema de Logging',
    passed: false,
    error: null,
    metrics: {
      logsPerSecond: 0,
      averageTime: 0,
      totalTime: 0
    }
  };

  try {
    const logger = createComponentLogger('PerformanceTest');
    const iterations = 100;
    const startTime = performance.now();

    // Executa múltiplos logs para testar performance
    for (let i = 0; i < iterations; i++) {
      logger.info(`Teste de performance ${i}`, { iteration: i, timestamp: Date.now() });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    test.metrics.totalTime = totalTime;
    test.metrics.averageTime = totalTime / iterations;
    test.metrics.logsPerSecond = (iterations / totalTime) * 1000;

    // Considera bem-sucedido se conseguir processar pelo menos 100 logs por segundo
    test.passed = test.metrics.logsPerSecond >= 100;

    if (!test.passed) {
      test.error = `Performance insuficiente: ${test.metrics.logsPerSecond.toFixed(2)} logs/segundo (mínimo: 100)`;
    }

  } catch (error) {
    test.error = error.message;
  }

  return test;
}

/**
 * Executa teste de stress no sistema de logging
 * @returns {Promise<Object>} Resultado do teste de stress
 */
export async function testLoggingStress() {
  const test = {
    name: 'Teste de Stress do Sistema de Logging',
    passed: false,
    error: null,
    metrics: {
      totalLogs: 0,
      errors: 0,
      successRate: 0
    }
  };

  try {
    const logger = createComponentLogger('StressTest');
    const iterations = 1000;
    let errors = 0;

    // Executa muitos logs rapidamente para testar estabilidade
    for (let i = 0; i < iterations; i++) {
      try {
        logger.info(`Stress test ${i}`, {
          iteration: i,
          timestamp: Date.now(),
          randomData: Math.random().toString(36).substring(7)
        });
      } catch (error) {
        errors++;
      }
    }

    test.metrics.totalLogs = iterations;
    test.metrics.errors = errors;
    test.metrics.successRate = ((iterations - errors) / iterations) * 100;

    // Considera bem-sucedido se tiver pelo menos 95% de sucesso
    test.passed = test.metrics.successRate >= 95;

    if (!test.passed) {
      test.error = `Taxa de sucesso insuficiente: ${test.metrics.successRate.toFixed(2)}% (mínimo: 95%)`;
    }

  } catch (error) {
    test.error = error.message;
  }

  return test;
}
