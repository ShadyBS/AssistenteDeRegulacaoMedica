/**
 * @file Test script para verificar a implementação de limpeza automática de lock
 * Este arquivo pode ser usado para testar manualmente a funcionalidade de limpeza de lock
 */

// Função de teste para verificar se a limpeza de lock está funcionando
async function testLockCleanup() {
  console.log('🧪 Iniciando teste de limpeza de lock...');

  try {
    // Importar as funções necessárias
    const { fetchRegulationDetails, clearRegulationLock } = await import('./api.js');

    // IDs de teste (substitua por IDs reais do seu sistema)
    const testIds = {
      reguIdp: '818',
      reguIds: '1'
    };

    console.log(`📋 Testando com IDs: ${testIds.reguIdp}-${testIds.reguIds}`);

    // Teste 1: Verificar se a função de limpeza existe e funciona
    console.log('🔧 Teste 1: Testando clearRegulationLock diretamente...');
    const lockCleared = await clearRegulationLock(testIds);
    console.log(`✅ Resultado da limpeza direta: ${lockCleared}`);

    // Teste 2: Verificar se fetchRegulationDetails chama a limpeza automaticamente
    console.log('🔧 Teste 2: Testando fetchRegulationDetails com limpeza automática...');

    // Interceptar logs para verificar se a limpeza foi executada
    const originalLog = console.log;
    const originalError = console.error;
    let lockCleanupCalled = false;

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('[Lock Cleanup]')) {
        lockCleanupCalled = true;
        originalLog('🎯 DETECTADO: Limpeza de lock executada!', ...args);
      } else {
        originalLog(...args);
      }
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('[Regulation Details]') && message.includes('lock')) {
        lockCleanupCalled = true;
        originalError('🎯 DETECTADO: Log de limpeza de lock!', ...args);
      } else {
        originalError(...args);
      }
    };

    // Executar fetchRegulationDetails
    const regulationData = await fetchRegulationDetails(testIds);

    // Aguardar um pouco para a limpeza assíncrona
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Restaurar logs originais
    console.log = originalLog;
    console.error = originalError;

    console.log(`✅ Dados da regulação obtidos: ${regulationData ? 'Sim' : 'Não'}`);
    console.log(`✅ Limpeza automática detectada: ${lockCleanupCalled ? 'Sim' : 'Não'}`);

    // Resultado final
    if (lockCleanupCalled) {
      console.log('🎉 SUCESSO: A limpeza automática de lock está funcionando!');
    } else {
      console.log('⚠️  ATENÇÃO: A limpeza automática pode não ter sido executada (verifique os logs)');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);

    // Verificar se é erro de configuração
    if (error.message.includes('URL_BASE_NOT_CONFIGURED')) {
      console.log('💡 DICA: Configure a URL base da extensão antes de executar o teste');
    }
  }
}

// Função para testar apenas a validação de parâmetros
async function testParameterValidation() {
  console.log('🧪 Testando validação de parâmetros...');

  try {
    const { clearRegulationLock } = await import('./api.js');

    // Teste com parâmetros inválidos
    const testCases = [
      { reguIdp: null, reguIds: null, expected: false },
      { reguIdp: '', reguIds: '', expected: false },
      { reguIdp: '123', reguIds: null, expected: false },
      { reguIdp: null, reguIds: '456', expected: false },
      { reguIdp: '123', reguIds: '456', expected: true }
    ];

    for (const testCase of testCases) {
      const result = await clearRegulationLock(testCase);
      const passed = (result === testCase.expected);
      console.log(`${passed ? '✅' : '❌'} Teste ${JSON.stringify(testCase)}: ${result} (esperado: ${testCase.expected})`);
    }

  } catch (error) {
    console.error('❌ Erro durante teste de validação:', error);
  }
}

// Função para verificar se os endpoints estão configurados corretamente
async function testEndpointConfiguration() {
  console.log('🧪 Verificando configuração de endpoints...');

  try {
    const { API_ENDPOINTS } = await import('./api-constants.js');

    const requiredEndpoints = [
      'REGULATION_DETAILS',
      'REGULATION_CLEAR_LOCK'
    ];

    for (const endpoint of requiredEndpoints) {
      if (API_ENDPOINTS[endpoint]) {
        console.log(`✅ ${endpoint}: ${API_ENDPOINTS[endpoint]}`);
      } else {
        console.log(`❌ ${endpoint}: NÃO CONFIGURADO`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar endpoints:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes de limpeza de lock...\n');

  await testEndpointConfiguration();
  console.log('\n' + '='.repeat(50) + '\n');

  await testParameterValidation();
  console.log('\n' + '='.repeat(50) + '\n');

  await testLockCleanup();

  console.log('\n🏁 Testes concluídos!');
}

// Exportar funções para uso manual
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testLockCleanup,
    testParameterValidation,
    testEndpointConfiguration,
    runAllTests
  };
}

// Executar automaticamente se chamado diretamente
if (typeof window !== 'undefined') {
  // No browser - adicionar ao window para acesso manual
  window.lockCleanupTests = {
    testLockCleanup,
    testParameterValidation,
    testEndpointConfiguration,
    runAllTests
  };

  console.log('🔧 Testes de limpeza de lock carregados!');
  console.log('💡 Execute: lockCleanupTests.runAllTests() para testar tudo');
  console.log('💡 Ou execute testes individuais: lockCleanupTests.testLockCleanup()');
}
