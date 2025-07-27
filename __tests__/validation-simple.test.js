/**
 * Testes unitários simples para validação de CNS
 * Teste básico para verificar se a implementação funciona
 */

// Mock do config.js para evitar problemas de importação
jest.mock('../config.js', () => ({
  CONFIG: {
    TIMEOUTS: {
      DEBOUNCE_SEARCH: 300
    }
  }
}));

describe('Validação de CNS - Testes Básicos', () => {
  let validateCNS;

  beforeAll(async () => {
    // Importa a função após o mock
    const validationModule = await import('../validation.js');
    validateCNS = validationModule.validateCNS;
  });

  test('deve rejeitar CNS vazio', () => {
    const result = validateCNS('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CNS é obrigatório');
  });

  test('deve rejeitar CNS com menos de 15 dígitos', () => {
    const result = validateCNS('12345678901234');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CNS deve ter exatamente 15 dígitos');
  });

  test('deve rejeitar CNS que não inicia com 1, 2, 7, 8 ou 9', () => {
    const result = validateCNS('312345678901234');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CNS deve iniciar com 1, 2, 7, 8 ou 9');
  });

  test('deve rejeitar CNS com todos os dígitos iguais', () => {
    const result = validateCNS('111111111111111');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CNS com todos os dígitos iguais é inválido');
  });

  test('deve validar CNS definitivo válido', () => {
    const result = validateCNS('170000000000001');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('definitivo');
  });

  test('deve validar CNS provisório tipo 7', () => {
    const result = validateCNS('712345678901234');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('provisorio');
  });

  test('deve validar CNS provisório tipo 8', () => {
    const result = validateCNS('812345678901234');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('provisorio');
  });

  test('deve validar CNS provisório tipo 9 com dígito verificador correto', () => {
    const result = validateCNS('912345678901230');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('provisorio');
  });

  test('deve rejeitar CNS provisório tipo 9 com dígito verificador incorreto', () => {
    const result = validateCNS('912345678901235');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CNS provisório tipo 9 com dígito verificador incorreto');
  });

  test('validação deve ser executada em menos de 10ms', () => {
    const start = performance.now();
    validateCNS('170000000000001');
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10);
  });
});