/**
 * Testes unitários para ErrorHandler
 */

import {
  ERROR_CATEGORIES,
  ERROR_LEVELS,
  ErrorHandler,
  getErrorHandler,
  logError,
  logInfo,
  sanitizeForLog,
} from '../../ErrorHandler.js';

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('getErrorHandler retorna sempre a mesma instância', () => {
      const instance1 = getErrorHandler();
      const instance2 = getErrorHandler();
      expect(instance1).toBe(instance2);
    });

    test('ErrorHandler exportado é a mesma instância', () => {
      const directInstance = ErrorHandler;
      const getterInstance = getErrorHandler();
      expect(directInstance).toBe(getterInstance);
    });
  });

  describe('Sanitização de Dados Médicos', () => {
    test('sanitiza campos médicos sensíveis', () => {
      const sensitiveData = {
        id: 'REGU_123',
        cpf: '123.456.789-01',
        nome: 'João Silva',
        cns: '12345678901234',
        telefone: '(11) 99999-9999',
        reguId: 'REG_456',
      };

      const sanitized = sanitizeForLog(sensitiveData);

      expect(sanitized.id).toBe('REGU_123'); // Technical ID - OK
      expect(sanitized.reguId).toBe('REG_456'); // Technical ID - OK
      expect(sanitized.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.cns).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.telefone).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('preserva IDs técnicos necessários para debug', () => {
      const technicalData = {
        reguId: 'REG_123',
        reguIdp: 'REGP_456',
        isenPK: 'ISEN_789',
        isenFullPKCrypto: 'CRYPTO_ABC',
        sessionId: 'SESS_DEF',
        requestId: 'REQ_GHI',
      };

      const sanitized = sanitizeForLog(technicalData);

      // Todos esses IDs técnicos devem ser preservados
      Object.keys(technicalData).forEach((key) => {
        expect(sanitized[key]).toBe(technicalData[key]);
      });
    });

    test('sanitiza arrays recursivamente', () => {
      const arrayData = [
        { id: 'PAT_1', nome: 'João', cpf: '123.456.789-01' },
        { id: 'PAT_2', nome: 'Maria', cpf: '987.654.321-00' },
      ];

      const sanitized = sanitizeForLog(arrayData);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].id).toBe('PAT_1');
      expect(sanitized[0].nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized[0].cpf).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('limita tamanho de arrays grandes', () => {
      const largeArray = new Array(10).fill({ id: 'TEST' });
      const sanitized = sanitizeForLog(largeArray);

      expect(sanitized).toHaveLength(6); // 5 items + "...X more items"
      expect(sanitized[5]).toContain('more items');
    });

    test('trunca strings muito longas', () => {
      const longString = 'A'.repeat(200);
      const sanitized = sanitizeForLog(longString);

      expect(sanitized).toHaveLength(103); // 100 chars + "..."
      expect(sanitized).toMatch(/\.\.\.$/);
    });

    test('lida com nested objects', () => {
      const nestedData = {
        patient: {
          id: 'PAT_123',
          personalInfo: {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            medical: {
              diagnostico: 'Diabetes',
              cid: 'E11',
            },
          },
        },
        reguId: 'REG_456',
      };

      const sanitized = sanitizeForLog(nestedData);

      expect(sanitized.reguId).toBe('REG_456');
      expect(sanitized.patient.id).toBe('PAT_123');
      expect(sanitized.patient.personalInfo.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.medical.diagnostico).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.medical.cid).toBe('[SANITIZED_MEDICAL_DATA]');
    });
  });

  describe('Logging Functionality', () => {
    test('logInfo funciona corretamente', () => {
      logInfo('Test info message', { test: 'data' }, ERROR_CATEGORIES.SIGSS_API);

      expect(console.info).toHaveBeenCalledWith('[Assistente Médico sigss_api] Test info message', {
        test: 'data',
      });
    });

    test('logError funciona corretamente', () => {
      logError('Test error message', { error: 'details' }, ERROR_CATEGORIES.MEDICAL_DATA);

      expect(console.error).toHaveBeenCalledWith(
        '[Assistente Médico medical_data] Test error message',
        { error: 'details' }
      );
    });

    test('sanitiza dados automaticamente no log', () => {
      const sensitiveData = {
        reguId: 'REG_123',
        cpf: '123.456.789-01',
        nome: 'João Silva',
      };

      logError('Erro com dados sensíveis', sensitiveData);

      const loggedData = console.error.mock.calls[0][1];
      expect(loggedData.reguId).toBe('REG_123');
      expect(loggedData.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(loggedData.nome).toBe('[SANITIZED_MEDICAL_DATA]');
    });
  });

  describe('Error Categories', () => {
    test('categorias médicas estão definidas', () => {
      expect(ERROR_CATEGORIES.SIGSS_API).toBeDefined();
      expect(ERROR_CATEGORIES.CADSUS_API).toBeDefined();
      expect(ERROR_CATEGORIES.MEDICAL_DATA).toBeDefined();
      expect(ERROR_CATEGORIES.SECURITY).toBeDefined();
      expect(ERROR_CATEGORIES.SECTION_FILTER_RENDER).toBeDefined();
      expect(ERROR_CATEGORIES.TIMELINE_NORMALIZATION).toBeDefined();
    });

    test('níveis de erro estão definidos', () => {
      expect(ERROR_LEVELS.DEBUG).toBe(1);
      expect(ERROR_LEVELS.INFO).toBe(2);
      expect(ERROR_LEVELS.WARN).toBe(3);
      expect(ERROR_LEVELS.ERROR).toBe(4);
      expect(ERROR_LEVELS.FATAL).toBe(5);
    });
  });

  describe('Performance Tracking', () => {
    test('performance marks funcionam', (done) => {
      const handler = getErrorHandler();

      handler.startPerformanceMark('test_operation');

      // Simular operação
      setTimeout(() => {
        handler.endPerformanceMark('test_operation');

        expect(console.info).toHaveBeenCalledWith(
          expect.stringContaining('Performance: test_operation took'),
          expect.objectContaining({ duration: expect.any(Number) })
        );
        done();
      }, 10);
    });
  });

  describe('Error Storage', () => {
    test('armazena errors críticos', async () => {
      const handler = getErrorHandler();

      await handler.logError('Erro crítico teste', { severity: 'high' });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalErrors: expect.arrayContaining([
            expect.objectContaining({
              message: 'Erro crítico teste',
              level: 'ERROR',
            }),
          ]),
        })
      );
    });

    test('recupera errors armazenados', async () => {
      const mockErrors = [
        { message: 'Erro 1', level: 'ERROR', timestamp: '2024-01-01T00:00:00.000Z' },
        { message: 'Erro 2', level: 'FATAL', timestamp: '2024-01-01T01:00:00.000Z' },
      ];

      chrome.storage.local.get.mockResolvedValue({ medicalErrors: mockErrors });

      const handler = getErrorHandler();
      const storedErrors = await handler.getStoredErrors();

      expect(storedErrors).toEqual(mockErrors);
    });
  });

  describe('Observer Pattern', () => {
    test('observers são notificados de novos logs', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          level: 'INFO',
        })
      );
    });

    test('unsubscribe remove observer', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.unsubscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Medical Compliance', () => {
    test('nunca loga campos médicos sensíveis', () => {
      const testCases = [
        { cpf: '123.456.789-01' },
        { cns: '12345678901234' },
        { nome_completo: 'João da Silva' },
        { data_nascimento: '1990-01-01' },
        { endereco: 'Rua das Flores, 123' },
        { telefone: '(11) 99999-9999' },
        { diagnostico: 'Diabetes Type 2' },
        { medicamento: 'Metformina 500mg' },
      ];

      testCases.forEach((testCase) => {
        const sanitized = sanitizeForLog(testCase);
        Object.values(sanitized).forEach((value) => {
          expect(value).toBe('[SANITIZED_MEDICAL_DATA]');
        });
      });
    });

    test('preserva IDs técnicos necessários para debugging médico', () => {
      const medicalTechnicalData = {
        reguId: 'REG_2024_001',
        reguIdp: 'REGP_2024_001',
        reguIds: 'REGS_2024_001',
        isenPK: 'ISEN_ABC123',
        isenFullPKCrypto: 'CRYPTO_DEF456',
        sessionId: 'SESS_GHI789',
        requestId: 'REQ_JKL012',
        transactionId: 'TXN_MNO345',
      };

      const sanitized = sanitizeForLog(medicalTechnicalData);

      Object.entries(medicalTechnicalData).forEach(([key, value]) => {
        expect(sanitized[key]).toBe(value);
      });
    });
  });
});
