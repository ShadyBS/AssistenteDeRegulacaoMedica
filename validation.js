/**
 * Utilitários de validação e sanitização de inputs
 * Fornece validação client-side para CPF, CNS, termos de busca e outros inputs do usuário
 */

import { CONFIG } from './config.js';

// ✅ TASK-M-002: Padrões de validação fortalecidos com detecção avançada
const PATTERNS = {
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  CNS: /^\d{15}$/,
  SEARCH_TERM: /^[a-zA-ZÀ-ÿ0-9\s\.\-\_]{1,100}$/,

  // ✅ TASK-M-002: SQL Injection expandido com mais padrões
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|DECLARE|CAST|CONVERT|SUBSTRING|CHAR|ASCII|WAITFOR|DELAY|BENCHMARK|SLEEP|LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b|[';\"\\]|--|\*\/|\*\*|\/\*|0x[0-9a-f]+|@@|INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,

  // ✅ TASK-M-002: XSS expandido com mais vetores de ataque
  XSS: /[<>\"'&]|javascript:|data:|vbscript:|on\w+\s*=|expression\s*\(|@import|<\s*script|<\s*iframe|<\s*object|<\s*embed|<\s*link|<\s*meta|<\s*style/i,

  // ✅ TASK-M-002: Detecção de Path Traversal
  PATH_TRAVERSAL: /(\.\.[\/\\]|\.\.%2f|\.\.%5c|%2e%2e[\/\\]|%252e%252e)/i,

  // ✅ TASK-M-002: Detecção de Command Injection
  COMMAND_INJECTION: /[;&|`$(){}[\]\\]|(\b(cat|ls|dir|type|copy|move|del|rm|chmod|chown|ps|kill|wget|curl|nc|netcat|ping|nslookup|whoami|id|uname|pwd|cd|echo|eval|exec|system|shell_exec|passthru|proc_open)\b)/i,

  // ✅ TASK-M-002: Detecção de LDAP Injection
  LDAP_INJECTION: /[()=*!&|]|(\b(objectClass|cn|uid|ou|dc|mail|sn|givenName)\b)/i,

  NUMERIC_ONLY: /^\d+$/,
  DATE_BR: /^\d{2}\/\d{2}\/\d{4}$/,

  // ✅ TASK-M-002: Validação de nome mais rigorosa
  NAME: /^[a-zA-ZÀ-ÿ\s\.\-']{2,100}$/,

  // ✅ TASK-M-002: Novos padrões para validações específicas
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_BR: /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
  CEP: /^\d{5}-?\d{3}$/,

  // ✅ TASK-M-002: Detecção de caracteres de controle maliciosos
  CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,

  // ✅ TASK-M-002: Detecção de encoding malicioso
  MALICIOUS_ENCODING: /%[0-2][0-9a-f]|%[3-9a-f][0-9a-f]|&#x?[0-9a-f]+;/i
};

// ✅ TASK-M-002: Lista de palavras-chave suspeitas expandida
const SUSPICIOUS_KEYWORDS = [
  // SQL Keywords
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION', 'SCRIPT',
  'DECLARE', 'CAST', 'CONVERT', 'SUBSTRING', 'CHAR', 'ASCII', 'WAITFOR', 'DELAY', 'BENCHMARK',
  'SLEEP', 'LOAD_FILE', 'INTO OUTFILE', 'INTO DUMPFILE', 'INFORMATION_SCHEMA', 'SYSOBJECTS',

  // XSS Keywords
  'javascript:', 'data:', 'vbscript:', 'expression(', '@import', 'eval(', 'setTimeout(',
  'setInterval(', 'Function(', 'constructor', 'prototype',

  // Command Injection
  'cat', 'ls', 'dir', 'type', 'copy', 'move', 'del', 'rm', 'chmod', 'chown', 'ps', 'kill',
  'wget', 'curl', 'nc', 'netcat', 'ping', 'nslookup', 'whoami', 'id', 'uname', 'pwd',

  // Path Traversal
  '../', '..\\', '%2e%2e', '%252e%252e'
];

// ✅ TASK-M-002: Configurações de segurança
const SECURITY_CONFIG = {
  MAX_INPUT_LENGTH: 1000,
  MAX_SEARCH_LENGTH: 100,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_VALIDATION_ATTEMPTS: 5,
  VALIDATION_COOLDOWN: 60000, // 1 minuto
  SUSPICIOUS_THRESHOLD: 3 // Número de tentativas suspeitas antes de bloquear
};

// ✅ TASK-M-002: Rate limiting para validações
const validationAttempts = new Map();
const suspiciousAttempts = new Map();

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

// ✅ TASK-M-002: Funções de validação avançada

/**
 * Verifica rate limiting para validações
 * @param {string} identifier - Identificador único (IP, session, etc.)
 * @returns {object} { allowed: boolean, remaining: number, resetTime: number }
 */
function checkValidationRateLimit(identifier) {
  const now = Date.now();
  const key = identifier || 'anonymous';

  // Limpa entradas expiradas
  for (const [id, data] of validationAttempts.entries()) {
    if (now - data.firstAttempt > SECURITY_CONFIG.VALIDATION_COOLDOWN) {
      validationAttempts.delete(id);
    }
  }

  const attempts = validationAttempts.get(key);

  if (!attempts) {
    validationAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    });
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.MAX_VALIDATION_ATTEMPTS - 1,
      resetTime: now + SECURITY_CONFIG.VALIDATION_COOLDOWN
    };
  }

  if (attempts.count >= SECURITY_CONFIG.MAX_VALIDATION_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: attempts.firstAttempt + SECURITY_CONFIG.VALIDATION_COOLDOWN
    };
  }

  attempts.count++;
  attempts.lastAttempt = now;

  return {
    allowed: true,
    remaining: SECURITY_CONFIG.MAX_VALIDATION_ATTEMPTS - attempts.count,
    resetTime: attempts.firstAttempt + SECURITY_CONFIG.VALIDATION_COOLDOWN
  };
}

/**
 * Detecta tentativas suspeitas de validação
 * @param {string} input - Input a ser analisado
 * @param {string} identifier - Identificador único
 * @returns {object} { suspicious: boolean, reasons: string[], severity: string }
 */
function detectSuspiciousInput(input, identifier = 'anonymous') {
  if (!input || typeof input !== 'string') {
    return { suspicious: false, reasons: [], severity: 'low' };
  }

  const reasons = [];
  let severity = 'low';

  // Verifica padrões maliciosos
  if (PATTERNS.SQL_INJECTION.test(input)) {
    reasons.push('Possível SQL Injection detectada');
    severity = 'high';
  }

  if (PATTERNS.XSS.test(input)) {
    reasons.push('Possível XSS detectado');
    severity = 'high';
  }

  if (PATTERNS.PATH_TRAVERSAL.test(input)) {
    reasons.push('Possível Path Traversal detectado');
    severity = 'medium';
  }

  if (PATTERNS.COMMAND_INJECTION.test(input)) {
    reasons.push('Possível Command Injection detectado');
    severity = 'high';
  }

  if (PATTERNS.LDAP_INJECTION.test(input)) {
    reasons.push('Possível LDAP Injection detectado');
    severity = 'medium';
  }

  if (PATTERNS.CONTROL_CHARS.test(input)) {
    reasons.push('Caracteres de controle maliciosos detectados');
    severity = 'medium';
  }

  if (PATTERNS.MALICIOUS_ENCODING.test(input)) {
    reasons.push('Encoding malicioso detectado');
    severity = 'medium';
  }

  // Verifica palavras-chave suspeitas
  const upperInput = input.toUpperCase();
  const suspiciousKeywords = SUSPICIOUS_KEYWORDS.filter(keyword =>
    upperInput.includes(keyword.toUpperCase())
  );

  if (suspiciousKeywords.length > 0) {
    reasons.push(`Palavras-chave suspeitas: ${suspiciousKeywords.join(', ')}`);
    if (severity === 'low') severity = 'medium';
  }

  // Verifica tamanho excessivo
  if (input.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
    reasons.push('Input excessivamente longo');
    if (severity === 'low') severity = 'medium';
  }

  // Registra tentativas suspeitas
  if (reasons.length > 0) {
    const now = Date.now();
    const suspiciousData = suspiciousAttempts.get(identifier) || { count: 0, firstAttempt: now };

    suspiciousData.count++;
    suspiciousData.lastAttempt = now;
    suspiciousData.lastInput = input.substring(0, 100); // Armazena apenas os primeiros 100 chars

    suspiciousAttempts.set(identifier, suspiciousData);

    // Aumenta severidade se há múltiplas tentativas suspeitas
    if (suspiciousData.count >= SECURITY_CONFIG.SUSPICIOUS_THRESHOLD) {
      severity = 'critical';
      reasons.push('Múltiplas tentativas suspeitas detectadas');
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    severity
  };
}

/**
 * Validação avançada com detecção de ameaças
 * @param {string} input - Input a ser validado
 * @param {string} type - Tipo de validação ('search', 'name', 'general')
 * @param {string} identifier - Identificador único para rate limiting
 * @returns {object} Resultado da validação com informações de segurança
 */
export function validateInputAdvanced(input, type = 'general', identifier = 'anonymous') {
  // Verifica rate limiting
  const rateLimit = checkValidationRateLimit(identifier);
  if (!rateLimit.allowed) {
    return {
      valid: false,
      message: 'Muitas tentativas de validação. Tente novamente mais tarde.',
      security: {
        rateLimited: true,
        resetTime: rateLimit.resetTime
      }
    };
  }

  // Detecta tentativas suspeitas
  const suspiciousAnalysis = detectSuspiciousInput(input, identifier);

  if (suspiciousAnalysis.suspicious && suspiciousAnalysis.severity === 'critical') {
    return {
      valid: false,
      message: 'Input rejeitado por motivos de segurança.',
      security: {
        suspicious: true,
        severity: suspiciousAnalysis.severity,
        reasons: suspiciousAnalysis.reasons,
        blocked: true
      }
    };
  }

  // Validação básica por tipo
  let basicValidation;
  switch (type) {
    case 'search':
      basicValidation = validateSearchTerm(input);
      break;
    case 'name':
      basicValidation = validateName(input);
      break;
    case 'cpf':
      basicValidation = validateCPF(input);
      break;
    case 'cns':
      basicValidation = validateCNS(input);
      break;
    case 'date':
      basicValidation = validateBrazilianDate(input);
      break;
    default:
      basicValidation = validateGeneral(input);
  }

  // Combina resultado da validação básica com análise de segurança
  return {
    ...basicValidation,
    security: {
      suspicious: suspiciousAnalysis.suspicious,
      severity: suspiciousAnalysis.severity,
      reasons: suspiciousAnalysis.reasons,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime
      }
    }
  };
}

/**
 * Validação geral para inputs não específicos
 * @param {string} input - Input a ser validado
 * @returns {object} { valid: boolean, message?: string, sanitized?: string }
 */
export function validateGeneral(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, message: 'Input é obrigatório' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Input não pode estar vazio' };
  }

  if (trimmed.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
    return { valid: false, message: `Input muito longo (máximo ${SECURITY_CONFIG.MAX_INPUT_LENGTH} caracteres)` };
  }

  // Verifica caracteres de controle
  if (PATTERNS.CONTROL_CHARS.test(trimmed)) {
    return { valid: false, message: 'Input contém caracteres de controle inválidos' };
  }

  return {
    valid: true,
    sanitized: sanitizeInput(trimmed)
  };
}

/**
 * Validação de email
 * @param {string} email - Email a ser validado
 * @returns {object} { valid: boolean, message?: string }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email é obrigatório' };
  }

  const trimmed = email.trim().toLowerCase();

  if (!PATTERNS.EMAIL.test(trimmed)) {
    return { valid: false, message: 'Formato de email inválido' };
  }

  if (trimmed.length > 254) { // RFC 5321 limit
    return { valid: false, message: 'Email muito longo' };
  }

  return { valid: true };
}

/**
 * Validação de telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {object} { valid: boolean, message?: string }
 */
export function validatePhoneBR(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Telefone é obrigatório' };
  }

  const cleaned = phone.replace(/\D/g, '');

  if (!PATTERNS.PHONE_BR.test(phone)) {
    return { valid: false, message: 'Formato de telefone inválido' };
  }

  // Verifica se tem o número correto de dígitos
  if (cleaned.length < 10 || cleaned.length > 13) {
    return { valid: false, message: 'Número de telefone deve ter entre 10 e 13 dígitos' };
  }

  return { valid: true };
}

/**
 * Validação de CEP
 * @param {string} cep - CEP a ser validado
 * @returns {object} { valid: boolean, message?: string }
 */
export function validateCEP(cep) {
  if (!cep || typeof cep !== 'string') {
    return { valid: false, message: 'CEP é obrigatório' };
  }

  const cleaned = cep.replace(/\D/g, '');

  if (!PATTERNS.CEP.test(cep)) {
    return { valid: false, message: 'Formato de CEP inválido (xxxxx-xxx)' };
  }

  if (cleaned.length !== 8) {
    return { valid: false, message: 'CEP deve ter 8 dígitos' };
  }

  // Verifica se não é um CEP obviamente inválido
  if (/^0{8}$/.test(cleaned) || /^(\d)\1{7}$/.test(cleaned)) {
    return { valid: false, message: 'CEP inválido' };
  }

  return { valid: true };
}

/**
 * Sanitização avançada com múltiplas camadas
 * @param {string} input - Input a ser sanitizado
 * @param {object} options - Opções de sanitização
 * @returns {string} Input sanitizado
 */
export function sanitizeAdvanced(input, options = {}) {
  if (!input || typeof input !== 'string') return '';

  const {
    allowHTML = false,
    allowScripts = false,
    maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH,
    preserveLineBreaks = false
  } = options;

  let sanitized = input.trim();

  // Remove caracteres de controle
  sanitized = sanitized.replace(PATTERNS.CONTROL_CHARS, '');

  // Remove encoding malicioso
  sanitized = sanitized.replace(PATTERNS.MALICIOUS_ENCODING, '');

  if (!allowHTML) {
    // Remove tags HTML
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Remove caracteres XSS
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
  }

  if (!allowScripts) {
    // Remove javascript: e outros protocolos perigosos
    sanitized = sanitized.replace(/javascript:|data:|vbscript:/gi, '');
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  if (!preserveLineBreaks) {
    // Substitui quebras de linha por espaços
    sanitized = sanitized.replace(/[\r\n\t]/g, ' ');
  }

  // Normaliza espaços múltiplos
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Limita tamanho
  if (maxLength > 0) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Obtém estatísticas de segurança
 * @returns {object} Estatísticas de tentativas suspeitas e rate limiting
 */
export function getSecurityStats() {
  const now = Date.now();

  // Limpa dados expirados
  for (const [id, data] of validationAttempts.entries()) {
    if (now - data.firstAttempt > SECURITY_CONFIG.VALIDATION_COOLDOWN) {
      validationAttempts.delete(id);
    }
  }

  for (const [id, data] of suspiciousAttempts.entries()) {
    if (now - data.firstAttempt > SECURITY_CONFIG.VALIDATION_COOLDOWN * 2) {
      suspiciousAttempts.delete(id);
    }
  }

  return {
    activeValidationSessions: validationAttempts.size,
    suspiciousAttempts: suspiciousAttempts.size,
    totalSuspiciousCount: Array.from(suspiciousAttempts.values())
      .reduce((sum, data) => sum + data.count, 0),
    criticalThreats: Array.from(suspiciousAttempts.values())
      .filter(data => data.count >= SECURITY_CONFIG.SUSPICIOUS_THRESHOLD).length
  };
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
      case 'email':
        result = validateEmail(value);
        break;
      case 'phone':
        result = validatePhoneBR(value);
        break;
      case 'cep':
        result = validateCEP(value);
        break;
      default:
        result = validateGeneral(value);
    }

    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
}
