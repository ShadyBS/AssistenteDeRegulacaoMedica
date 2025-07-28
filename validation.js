/**
 * Utilitários de validação e sanitização de inputs
 * Fornece validação client-side para CPF, CNS, termos de busca e outros inputs do usuário
 */

import { CONFIG } from './config.js';

// Regex patterns para validação
const PATTERNS = {
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  CNS: /^\d{15}$/,
  SEARCH_TERM: /^[a-zA-ZÀ-ÿ0-9\s\.\-\_]{1,100}$/,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|[';\"\\])/i,
  XSS: /[<>\"'&]/,
  NUMERIC_ONLY: /^\d+$/,
  DATE_BR: /^\d{2}\/\d{2}\/\d{4}$/,
  NAME: /^[a-zA-ZÀ-ÿ\s\.\-']{2,100}$/
};

// Weights para validação de CPF (algoritmo oficial)
const CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Valida CPF usando algoritmo oficial brasileiro
 * @param {string} cpf - CPF a ser validado
 * @returns {object} { valid: boolean, message?: string }
 */
export function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, message: 'CPF é obrigatório' };
  }

  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verifica formato básico
  if (!PATTERNS.CPF.test(cpf)) {
    return { valid: false, message: 'Formato de CPF inválido (xxx.xxx.xxx-xx)' };
  }

  if (cleanCPF.length !== 11) {
    return { valid: false, message: 'CPF deve ter 11 dígitos' };
  }

  // Verifica sequências inválidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, message: 'CPF com dígitos repetidos é inválido' };
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * CPF_WEIGHTS_1[i];
  }
  let firstDigit = ((sum * 10) % 11) % 10;

  if (firstDigit !== parseInt(cleanCPF[9])) {
    return { valid: false, message: 'CPF inválido (primeiro dígito verificador)' };
  }

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * CPF_WEIGHTS_2[i];
  }
  let secondDigit = ((sum * 10) % 11) % 10;

  if (secondDigit !== parseInt(cleanCPF[10])) {
    return { valid: false, message: 'CPF inválido (segundo dígito verificador)' };
  }

  return { valid: true };
}

/**
 * Cache de validações CNS para otimização de performance
 * Armazena últimas 100 validações por 5 minutos
 */
const CNS_VALIDATION_CACHE = new Map();
const CNS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const CNS_CACHE_MAX_SIZE = 100;

/**
 * Limpa cache de validações CNS expiradas
 */
function cleanCNSCache() {
  const now = Date.now();
  for (const [key, value] of CNS_VALIDATION_CACHE.entries()) {
    if (now - value.timestamp > CNS_CACHE_TTL) {
      CNS_VALIDATION_CACHE.delete(key);
    }
  }

  // Limita tamanho do cache
  if (CNS_VALIDATION_CACHE.size > CNS_CACHE_MAX_SIZE) {
    const entries = Array.from(CNS_VALIDATION_CACHE.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - CNS_CACHE_MAX_SIZE);
    toDelete.forEach(([key]) => CNS_VALIDATION_CACHE.delete(key));
  }
}

/**
 * Valida CNS definitivo (inicia com 1 ou 2) com algoritmo completo
 * @param {string} cleanCNS - CNS limpo (apenas dígitos)
 * @returns {object} { valid: boolean, message?: string }
 */
function validateDefinitiveCNS(cleanCNS) {
  // Verifica sequências inválidas (todos os dígitos iguais)
  if (/^(\d)\1{14}$/.test(cleanCNS)) {
    return { valid: false, message: 'CNS com todos os dígitos iguais é inválido' };
  }

  // Algoritmo oficial do CNS definitivo
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(cleanCNS[i]) * (15 - i);
  }

  const remainder = sum % 11;
  let dv = 11 - remainder;

  if (dv === 11) {
    dv = 0;
  }

  if (dv === 10) {
    // Caso especial: quando DV seria 10, soma-se 2 e recalcula
    sum += 2;
    const newRemainder = sum % 11;
    dv = 11 - newRemainder;
    if (dv === 11) dv = 0;

    // Verifica se os últimos 4 dígitos são 0001
    const lastFourDigits = cleanCNS.substring(11);
    if (lastFourDigits !== '0001') {
      return { valid: false, message: 'CNS inválido (dígitos verificadores incorretos para caso especial)' };
    }
  } else {
    // Caso normal: verifica os dois primeiros dígitos verificadores
    const expectedDV = cleanCNS.substring(11, 13);
    const calculatedDV = dv.toString().padStart(2, '0');

    if (expectedDV !== calculatedDV) {
      return { valid: false, message: 'CNS inválido (dígitos verificadores incorretos)' };
    }

    // Os dois últimos dígitos devem ser 00 para CNS definitivo normal
    const lastTwoDigits = cleanCNS.substring(13);
    if (lastTwoDigits !== '00') {
      return { valid: false, message: 'CNS definitivo deve terminar com 00' };
    }
  }

  return { valid: true };
}

/**
 * Valida CNS provisório (inicia com 7, 8 ou 9) com validações específicas
 * @param {string} cleanCNS - CNS limpo (apenas dígitos)
 * @returns {object} { valid: boolean, message?: string }
 */
function validateProvisionalCNS(cleanCNS) {
  const firstDigit = cleanCNS[0];

  // Verifica sequências inválidas (todos os dígitos iguais)
  if (/^(\d)\1{14}$/.test(cleanCNS)) {
    return { valid: false, message: 'CNS com todos os dígitos iguais é inválido' };
  }

  // Validações específicas por tipo de CNS provisório
  switch (firstDigit) {
    case '7':
      // CNS provisório tipo 7: validação de formato específico
      // Segundo dígito deve estar entre 0-9
      const secondDigit7 = parseInt(cleanCNS[1]);
      if (isNaN(secondDigit7)) {
        return { valid: false, message: 'CNS provisório tipo 7 com formato inválido' };
      }

      // Validação adicional: não pode ter padrões específicos inválidos
      if (cleanCNS.startsWith('70000000000') || cleanCNS.startsWith('79999999999')) {
        return { valid: false, message: 'CNS provisório tipo 7 com sequência reservada' };
      }
      break;

    case '8':
      // CNS provisório tipo 8: validação de formato específico
      const secondDigit8 = parseInt(cleanCNS[1]);
      if (isNaN(secondDigit8)) {
        return { valid: false, message: 'CNS provisório tipo 8 com formato inválido' };
      }

      // Validação adicional: não pode ter padrões específicos inválidos
      if (cleanCNS.startsWith('80000000000') || cleanCNS.startsWith('89999999999')) {
        return { valid: false, message: 'CNS provisório tipo 8 com sequência reservada' };
      }
      break;

    case '9':
      // CNS provisório tipo 9: validação de formato específico
      const secondDigit9 = parseInt(cleanCNS[1]);
      if (isNaN(secondDigit9)) {
        return { valid: false, message: 'CNS provisório tipo 9 com formato inválido' };
      }

      // Validação adicional: não pode ter padrões específicos inválidos
      if (cleanCNS.startsWith('90000000000') || cleanCNS.startsWith('99999999999')) {
        return { valid: false, message: 'CNS provisório tipo 9 com sequência reservada' };
      }

      // CNS tipo 9 tem validação de dígito verificador simplificada
      let sum9 = 0;
      for (let i = 0; i < 14; i++) {
        sum9 += parseInt(cleanCNS[i]) * (15 - i);
      }

      const remainder9 = sum9 % 11;
      const expectedLastDigit = remainder9 < 2 ? 0 : 11 - remainder9;
      const actualLastDigit = parseInt(cleanCNS[14]);

      if (actualLastDigit !== expectedLastDigit) {
        return { valid: false, message: 'CNS provisório tipo 9 com dígito verificador incorreto' };
      }
      break;
  }

  // Validação adicional: verifica se não é uma sequência óbvia inválida
  const hasValidPattern = /^[789]\d{14}$/.test(cleanCNS) &&
                         !/^([789])\1{14}$/.test(cleanCNS) &&
                         !/^[789]0{14}$/.test(cleanCNS) &&
                         !/^[789]1{14}$/.test(cleanCNS);

  if (!hasValidPattern) {
    return { valid: false, message: 'CNS provisório com padrão inválido' };
  }

  return { valid: true };
}

/**
 * Valida CNS (Cartão Nacional de Saúde) com algoritmo completo
 * Suporta CNS definitivo (1, 2) e provisório (7, 8, 9) com validações específicas
 * @param {string} cns - CNS a ser validado
 * @returns {object} { valid: boolean, message?: string, type?: string }
 */
export function validateCNS(cns) {
  if (!cns || typeof cns !== 'string') {
    return { valid: false, message: 'CNS é obrigatório' };
  }

  const cleanCNS = cns.replace(/[^\d]/g, '');

  // Verifica formato básico
  if (!PATTERNS.CNS.test(cleanCNS)) {
    return { valid: false, message: 'CNS deve ter exatamente 15 dígitos' };
  }

  // Verifica cache primeiro para otimização
  cleanCNSCache();
  const cached = CNS_VALIDATION_CACHE.get(cleanCNS);
  if (cached && (Date.now() - cached.timestamp) < CNS_CACHE_TTL) {
    return cached.result;
  }

  const firstDigit = cleanCNS[0];
  let result;

  // CNS definitivo (inicia com 1 ou 2)
  if (firstDigit === '1' || firstDigit === '2') {
    result = validateDefinitiveCNS(cleanCNS);
    if (result.valid) {
      result.type = 'definitivo';
    }
  }
  // CNS provisório (inicia com 7, 8 ou 9)
  else if (['7', '8', '9'].includes(firstDigit)) {
    result = validateProvisionalCNS(cleanCNS);
    if (result.valid) {
      result.type = 'provisorio';
    }
  }
  // Primeiro dígito inválido
  else {
    result = { valid: false, message: 'CNS deve iniciar com 1, 2, 7, 8 ou 9' };
  }

  // Armazena no cache
  CNS_VALIDATION_CACHE.set(cleanCNS, {
    result: { ...result },
    timestamp: Date.now()
  });

  return result;
}

/**
 * Valida termo de busca
 * @param {string} searchTerm - Termo de busca
 * @returns {object} { valid: boolean, message?: string, sanitized?: string }
 */
export function validateSearchTerm(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return { valid: false, message: 'Termo de busca é obrigatório' };
  }

  const trimmed = searchTerm.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Termo de busca não pode estar vazio' };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'Termo de busca muito longo (máximo 100 caracteres)' };
  }

  // Verifica padrões de SQL injection
  if (PATTERNS.SQL_INJECTION.test(trimmed)) {
    return { valid: false, message: 'Termo de busca contém caracteres não permitidos' };
  }

  // Verifica XSS básico
  if (PATTERNS.XSS.test(trimmed)) {
    return { valid: false, message: 'Termo de busca contém caracteres HTML não permitidos' };
  }

  return {
    valid: true,
    sanitized: sanitizeSearchTerm(trimmed)
  };
}

/**
 * Valida nome de pessoa
 * @param {string} name - Nome a ser validado
 * @returns {object} { valid: boolean, message?: string }
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Nome é obrigatório' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
  }

  if (!PATTERNS.NAME.test(trimmed)) {
    return { valid: false, message: 'Nome contém caracteres inválidos' };
  }

  return { valid: true };
}

/**
 * Valida data no formato brasileiro (dd/mm/yyyy)
 * @param {string} dateStr - Data a ser validada
 * @returns {object} { valid: boolean, message?: string, parsed?: Date }
 */
export function validateBrazilianDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, message: 'Data é obrigatória' };
  }

  if (!PATTERNS.DATE_BR.test(dateStr)) {
    return { valid: false, message: 'Formato de data inválido (dd/mm/yyyy)' };
  }

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  // Verifica limites básicos antes de criar o objeto Date
  if (day < 1 || day > 31) {
    return { valid: false, message: 'Dia inválido (deve estar entre 1 e 31)' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, message: 'Mês inválido (deve estar entre 1 e 12)' };
  }

  // Verifica se a data é válida (JavaScript Date corrige automaticamente datas inválidas)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return { valid: false, message: 'Data inválida (ex: 31/02 não existe)' };
  }

  // Verifica se a data não é muito antiga ou futura
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) {
    return { valid: false, message: `Ano deve estar entre 1900 e ${currentYear + 1}` };
  }

  return { valid: true, parsed: date };
}

/**
 * Sanitiza termo de busca removendo caracteres perigosos
 * @param {string} term - Termo a ser sanitizado
 * @returns {string} Termo sanitizado
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') return '';

  return term
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove caracteres XSS básicos
    .replace(/[\r\n\t]/g, ' ') // Substitui quebras de linha por espaços
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .substring(0, 100); // Limita tamanho
}

/**
 * Sanitiza input genérico removendo caracteres perigosos
 * @param {string} input - Input a ser sanitizado
 * @returns {string} Input sanitizado
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove XSS
    .replace(/[\r\n]/g, '') // Remove quebras de linha
    .replace(/\s+/g, ' '); // Normaliza espaços
}

/**
 * Valida entrada genérica contra injeção SQL básica
 * @param {string} input - Input a ser validado
 * @returns {boolean} True se seguro, false se suspeito
 */
export function isSQLSafe(input) {
  if (!input || typeof input !== 'string') return true;
  return !PATTERNS.SQL_INJECTION.test(input);
}

/**
 * Aplica validação em tempo real a um elemento input
 * @param {HTMLInputElement} inputElement - Elemento de input
 * @param {Function} validator - Função de validação
 * @param {Function} onValid - Callback para estado válido
 * @param {Function} onInvalid - Callback para estado inválido
 */
export function applyRealtimeValidation(inputElement, validator, onValid, onInvalid) {
  if (!inputElement) return;

  const validate = () => {
    const result = validator(inputElement.value);

    if (result.valid) {
      inputElement.classList.remove('border-red-500', 'bg-red-50');
      inputElement.classList.add('border-green-500');
      inputElement.setCustomValidity('');
      if (onValid) onValid(result);
    } else {
      inputElement.classList.remove('border-green-500');
      inputElement.classList.add('border-red-500', 'bg-red-50');
      inputElement.setCustomValidity(result.message || 'Valor inválido');
      if (onInvalid) onInvalid(result);
    }
  };

  // Validação em tempo real com debounce
  let timeoutId;
  inputElement.addEventListener('input', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(validate, CONFIG.TIMEOUTS.DEBOUNCE_SEARCH);
  });

  // Validação imediata no blur
  inputElement.addEventListener('blur', validate);

  // Limpeza no focus
  inputElement.addEventListener('focus', () => {
    inputElement.classList.remove('border-red-500', 'border-green-500', 'bg-red-50');
  });
}

/**
 * Cria mensagem de erro de validação
 * @param {string} message - Mensagem de erro
 * @returns {HTMLElement} Elemento com a mensagem
 */
export function createValidationError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'validation-error text-sm text-red-600 mt-1';
  errorElement.textContent = message;
  return errorElement;
}

/**
 * Remove mensagens de erro de validação de um container
 * @param {HTMLElement} container - Container pai
 */
export function clearValidationErrors(container) {
  if (!container) return;
  const errors = container.querySelectorAll('.validation-error');
  errors.forEach(error => error.remove());
}

// Função utilitária para validação rápida de formulários
export function validateForm(formData, rules) {
  const errors = {};
  let isValid = true;

  for (const [field, value] of Object.entries(formData)) {
    const rule = rules[field];
    if (!rule) continue;

    let result;
    switch (rule.type) {
      case 'cpf':
        result = validateCPF(value);
        break;
      case 'cns':
        result = validateCNS(value);
        break;
      case 'search':
        result = validateSearchTerm(value);
        break;
      case 'name':
        result = validateName(value);
        break;
      case 'date':
        result = validateBrazilianDate(value);
        break;
      default:
        continue;
    }

    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
}
