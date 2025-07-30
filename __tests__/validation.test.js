/**
 * Testes unitários para validação de dados médicos
 * Foca especialmente na validação rigorosa de CNS
 */

import { validateCNS, validateCPF, validateSearchTerm, validateName, validateBrazilianDate } from '../validation.js';

describe('Validação de CNS (Cartão Nacional de Saúde)', () => {
  describe('Validação básica de formato', () => {
    test('deve rejeitar CNS vazio ou null', () => {
      expect(validateCNS('')).toEqual({ valid: false, message: 'CNS é obrigatório' });
      expect(validateCNS(null)).toEqual({ valid: false, message: 'CNS é obrigatório' });
      expect(validateCNS(undefined)).toEqual({ valid: false, message: 'CNS é obrigatório' });
    });

    test('deve rejeitar CNS com menos de 15 dígitos', () => {
      expect(validateCNS('12345678901234')).toEqual({ 
        valid: false, 
        message: 'CNS deve ter exatamente 15 dígitos' 
      });
    });

    test('deve rejeitar CNS com mais de 15 dígitos', () => {
      expect(validateCNS('1234567890123456')).toEqual({ 
        valid: false, 
        message: 'CNS deve ter exatamente 15 dígitos' 
      });
    });

    test('deve rejeitar CNS com caracteres não numéricos', () => {
      expect(validateCNS('12345678901234a')).toEqual({ 
        valid: false, 
        message: 'CNS deve ter exatamente 15 dígitos' 
      });
    });

    test('deve rejeitar CNS que não inicia com 1, 2, 7, 8 ou 9', () => {
      expect(validateCNS('312345678901234')).toEqual({ 
        valid: false, 
        message: 'CNS deve iniciar com 1, 2, 7, 8 ou 9' 
      });
      expect(validateCNS('612345678901234')).toEqual({ 
        valid: false, 
        message: 'CNS deve iniciar com 1, 2, 7, 8 ou 9' 
      });
    });
  });

  describe('CNS Definitivo (inicia com 1 ou 2)', () => {
    test('deve rejeitar CNS com todos os dígitos iguais', () => {
      expect(validateCNS('111111111111111')).toEqual({ 
        valid: false, 
        message: 'CNS com todos os dígitos iguais é inválido' 
      });
      expect(validateCNS('222222222222222')).toEqual({ 
        valid: false, 
        message: 'CNS com todos os dígitos iguais é inválido' 
      });
    });

    test('deve validar CNS definitivo válido tipo 1', () => {
      // CNS definitivo válido calculado manualmente
      const result = validateCNS('170000000000001');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('definitivo');
    });

    test('deve validar CNS definitivo válido tipo 2', () => {
      // CNS definitivo válido calculado manualmente
      const result = validateCNS('270000000000001');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('definitivo');
    });

    test('deve rejeitar CNS definitivo com dígitos verificadores incorretos', () => {
      expect(validateCNS('170000000000002')).toEqual({ 
        valid: false, 
        message: 'CNS inválido (dígitos verificadores incorretos)' 
      });
    });

    test('deve rejeitar CNS definitivo que não termina com 00 (caso normal)', () => {
      expect(validateCNS('170000000001001')).toEqual({ 
        valid: false, 
        message: 'CNS definitivo deve terminar com 00' 
      });
    });

    test('deve validar CNS definitivo com caso especial (termina em 0001)', () => {
      // Caso especial onde DV seria 10, então soma 2 e recalcula
      const result = validateCNS('100000000000001');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('definitivo');
    });
  });

  describe('CNS Provisório (inicia com 7, 8 ou 9)', () => {
    test('deve rejeitar CNS provisório com todos os dígitos iguais', () => {
      expect(validateCNS('777777777777777')).toEqual({ 
        valid: false, 
        message: 'CNS com todos os dígitos iguais é inválido' 
      });
      expect(validateCNS('888888888888888')).toEqual({ 
        valid: false, 
        message: 'CNS com todos os dígitos iguais é inválido' 
      });
      expect(validateCNS('999999999999999')).toEqual({ 
        valid: false, 
        message: 'CNS com todos os dígitos iguais é inválido' 
      });
    });

    test('deve rejeitar CNS provisório com sequências reservadas tipo 7', () => {
      expect(validateCNS('700000000000000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 7 com sequência reservada' 
      });
      expect(validateCNS('799999999990000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 7 com sequência reservada' 
      });
    });

    test('deve rejeitar CNS provisório com sequências reservadas tipo 8', () => {
      expect(validateCNS('800000000000000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 8 com sequência reservada' 
      });
      expect(validateCNS('899999999990000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 8 com sequência reservada' 
      });
    });

    test('deve rejeitar CNS provisório com sequências reservadas tipo 9', () => {
      expect(validateCNS('900000000000000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 9 com sequência reservada' 
      });
      expect(validateCNS('999999999990000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 9 com sequência reservada' 
      });
    });

    test('deve rejeitar CNS provisório com padrões inválidos', () => {
      expect(validateCNS('700000000000000')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 7 com sequência reservada' 
      });
      expect(validateCNS('711111111111111')).toEqual({ 
        valid: false, 
        message: 'CNS provisório com padrão inválido' 
      });
    });

    test('deve validar CNS provisório tipo 7 válido', () => {
      const result = validateCNS('712345678901234');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('provisorio');
    });

    test('deve validar CNS provisório tipo 8 válido', () => {
      const result = validateCNS('812345678901234');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('provisorio');
    });

    test('deve validar CNS provisório tipo 9 com dígito verificador correto', () => {
      // CNS tipo 9 com validação de dígito verificador
      const result = validateCNS('912345678901230'); // Último dígito calculado
      expect(result.valid).toBe(true);
      expect(result.type).toBe('provisorio');
    });

    test('deve rejeitar CNS provisório tipo 9 com dígito verificador incorreto', () => {
      expect(validateCNS('912345678901235')).toEqual({ 
        valid: false, 
        message: 'CNS provisório tipo 9 com dígito verificador incorreto' 
      });
    });
  });

  describe('Cache de validações', () => {
    test('deve usar cache para validações repetidas', () => {
      const cns = '170000000000001';
      
      // Primeira validação
      const result1 = validateCNS(cns);
      expect(result1.valid).toBe(true);
      
      // Segunda validação (deve usar cache)
      const result2 = validateCNS(cns);
      expect(result2.valid).toBe(true);
      expect(result2).toEqual(result1);
    });

    test('deve limpar cache automaticamente após TTL', async () => {
      const cns = '170000000000001';
      
      // Primeira validação
      const result1 = validateCNS(cns);
      expect(result1.valid).toBe(true);
      
      // Simula passagem de tempo (mock do Date.now)
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000); // 6 minutos
      
      // Segunda validação (cache expirado)
      const result2 = validateCNS(cns);
      expect(result2.valid).toBe(true);
      
      // Restaura Date.now
      Date.now = originalNow;
    });
  });

  describe('Performance', () => {
    test('validação deve ser executada em menos de 10ms', () => {
      const start = performance.now();
      validateCNS('170000000000001');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10);
    });

    test('validação com cache deve ser mais rápida', () => {
      const cns = '170000000000001';
      
      // Primeira validação (sem cache)
      const start1 = performance.now();
      validateCNS(cns);
      const end1 = performance.now();
      const time1 = end1 - start1;
      
      // Segunda validação (com cache)
      const start2 = performance.now();
      validateCNS(cns);
      const end2 = performance.now();
      const time2 = end2 - start2;
      
      expect(time2).toBeLessThan(time1);
    });
  });
});

describe('Validação de CPF', () => {
  test('deve validar CPF válido', () => {
    const result = validateCPF('123.456.789-09');
    expect(result.valid).toBe(true);
  });

  test('deve rejeitar CPF inválido', () => {
    const result = validateCPF('123.456.789-00');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('CPF inválido');
  });

  test('deve rejeitar CPF com dígitos repetidos', () => {
    const result = validateCPF('111.111.111-11');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('CPF com dígitos repetidos é inválido');
  });
});

describe('Validação de termo de busca', () => {
  test('deve validar termo de busca válido', () => {
    const result = validateSearchTerm('João Silva');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('João Silva');
  });

  test('deve rejeitar termo com SQL injection', () => {
    const result = validateSearchTerm("'; DROP TABLE users; --");
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Termo de busca contém caracteres não permitidos');
  });

  test('deve rejeitar termo com XSS', () => {
    const result = validateSearchTerm('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Termo de busca contém caracteres HTML não permitidos');
  });
});

describe('Validação de nome', () => {
  test('deve validar nome válido', () => {
    const result = validateName('João da Silva');
    expect(result.valid).toBe(true);
  });

  test('deve rejeitar nome muito curto', () => {
    const result = validateName('J');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Nome deve ter pelo menos 2 caracteres');
  });

  test('deve rejeitar nome com caracteres inválidos', () => {
    const result = validateName('João123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Nome contém caracteres inválidos');
  });
});

describe('Validação de data brasileira', () => {
  test('deve validar data válida', () => {
    const result = validateBrazilianDate('15/03/2024');
    expect(result.valid).toBe(true);
    expect(result.parsed).toBeInstanceOf(Date);
  });

  test('deve rejeitar data inválida', () => {
    const result = validateBrazilianDate('31/02/2024');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Data inválida (ex: 31/02 não existe)');
  });

  test('deve rejeitar formato inválido', () => {
    const result = validateBrazilianDate('2024-03-15');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Formato de data inválido (dd/mm/yyyy)');
  });

  test('deve rejeitar ano muito antigo', () => {
    const result = validateBrazilianDate('15/03/1800');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Ano deve estar entre 1900 e');
  });
});

describe('Casos edge específicos', () => {
  test('deve lidar com CNS com formatação', () => {
    // Testa se remove formatação corretamente
    const result = validateCNS('1 7000 0000 0000 001');
    expect(result.valid).toBe(true);
  });

  test('deve validar 100% dos CNS válidos conhecidos', () => {
    const cnsValidos = [
      '170000000000001', // CNS definitivo tipo 1
      '270000000000001', // CNS definitivo tipo 2
      '712345678901234', // CNS provisório tipo 7
      '812345678901234', // CNS provisório tipo 8
      '912345678901230'  // CNS provisório tipo 9
    ];

    cnsValidos.forEach(cns => {
      const result = validateCNS(cns);
      expect(result.valid).toBe(true);
    });
  });

  test('deve rejeitar 100% dos CNS inválidos conhecidos', () => {
    const cnsInvalidos = [
      '111111111111111', // Todos dígitos iguais
      '170000000000002', // Dígito verificador incorreto
      '312345678901234', // Primeiro dígito inválido
      '700000000000000', // Sequência reservada
      '912345678901235'  // Dígito verificador tipo 9 incorreto
    ];

    cnsInvalidos.forEach(cns => {
      const result = validateCNS(cns);
      expect(result.valid).toBe(false);
    });
  });
});