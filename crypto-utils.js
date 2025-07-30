/**
};
import { createComponentLogger } from "./logger.js";

// Logger específico para Cryptoutils
const logger = createComponentLogger('Cryptoutils');

/**
 * @file Utilitários de criptografia para dados médicos sensíveis
 * ✅ SEGURANÇA: Implementa criptografia AES-GCM para proteger dados médicos no storage
 */

// ✅ SEGURANÇA: Configurações de criptografia seguras
const CRYPTO_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12, // 96 bits para GCM
  TAG_LENGTH: 16, // 128 bits para GCM
  SALT_LENGTH: 16,
  ITERATIONS: 100000, // PBKDF2 iterations
};

/**
 * Gera uma chave de criptografia derivada de uma senha
 * @param {string} password - Senha base (pode ser ID da extensão + timestamp)
 * @param {Uint8Array} salt - Salt para derivação da chave
 * @returns {Promise<CryptoKey>} Chave de criptografia
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: CRYPTO_CONFIG.ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: CRYPTO_CONFIG.ALGORITHM, length: CRYPTO_CONFIG.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gera uma senha base para a sessão atual
 * @returns {string} Senha base única para a sessão
 */
function generateSessionPassword() {
  // Combina ID da extensão com timestamp para criar senha única por sessão
  const extensionId = globalThis.chrome?.runtime?.id || 'assistente-regulacao';
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');

  return `${extensionId}-${timestamp}-${randomHex}`;
}

/**
 * Criptografa dados médicos sensíveis
 * @param {any} data - Dados a serem criptografados
 * @param {string} [customPassword] - Senha customizada (opcional)
 * @returns {Promise<string>} Dados criptografados em base64
 */
export async function encryptMedicalData(data, customPassword = null) {
  try {
    // Serializa os dados
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    // Gera salt e IV aleatórios
    const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));

    // Deriva a chave
    const password = customPassword || generateSessionPassword();
    const key = await deriveKey(password, salt);

    // Criptografa os dados
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Combina salt + iv + dados criptografados
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedArray, salt.length + iv.length);

    // Converte para base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    logger.error('[Crypto] Erro ao criptografar dados médicos:', error);
    throw new Error('Falha na criptografia de dados médicos');
  }
}

/**
 * Descriptografa dados médicos sensíveis
 * @param {string} encryptedData - Dados criptografados em base64
 * @param {string} [customPassword] - Senha customizada (opcional)
 * @returns {Promise<any>} Dados descriptografados
 */
export async function decryptMedicalData(encryptedData, customPassword = null) {
  try {
    // Converte de base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Extrai salt, IV e dados criptografados
    const salt = combined.slice(0, CRYPTO_CONFIG.SALT_LENGTH);
    const iv = combined.slice(CRYPTO_CONFIG.SALT_LENGTH, CRYPTO_CONFIG.SALT_LENGTH + CRYPTO_CONFIG.IV_LENGTH);
    const encryptedBuffer = combined.slice(CRYPTO_CONFIG.SALT_LENGTH + CRYPTO_CONFIG.IV_LENGTH);

    // Deriva a chave
    const password = customPassword || generateSessionPassword();
    const key = await deriveKey(password, salt);

    // Descriptografa os dados
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv: iv,
      },
      key,
      encryptedBuffer
    );

    // Converte de volta para string e parseia JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('[Crypto] Erro ao descriptografar dados médicos:', error);
    throw new Error('Falha na descriptografia de dados médicos');
  }
}

/**
 * Verifica se os dados estão criptografados
 * @param {any} data - Dados a serem verificados
 * @returns {boolean} True se os dados parecem estar criptografados
 */
export function isEncrypted(data) {
  if (typeof data !== 'string') return false;

  try {
    // Tenta decodificar base64
    const decoded = atob(data);
    // Verifica se tem o tamanho mínimo esperado (salt + iv + dados)
    return decoded.length >= (CRYPTO_CONFIG.SALT_LENGTH + CRYPTO_CONFIG.IV_LENGTH + 16);
  } catch {
    return false;
  }
}

/**
 * Criptografa dados para storage com TTL
 * @param {any} data - Dados a serem armazenados
 * @param {number} [ttlMinutes=60] - TTL em minutos (padrão: 1 hora)
 * @returns {Promise<string>} Dados criptografados com metadados
 */
export async function encryptForStorage(data, ttlMinutes = 60) {
  const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
  const dataWithTTL = {
    data: data,
    expiresAt: expiresAt,
    encrypted: true,
    version: '1.0'
  };

  return await encryptMedicalData(dataWithTTL);
}

/**
 * Descriptografa dados do storage e verifica TTL
 * @param {string} encryptedData - Dados criptografados
 * @returns {Promise<any|null>} Dados descriptografados ou null se expirado
 */
export async function decryptFromStorage(encryptedData) {
  try {
    const dataWithTTL = await decryptMedicalData(encryptedData);

    // Verifica se os dados expiraram
    if (dataWithTTL.expiresAt && Date.now() > dataWithTTL.expiresAt) {
      logger.info('[Crypto] Dados médicos expiraram, removendo do cache');
      return null;
    }

    return dataWithTTL.data;
  } catch (error) {
    logger.error('[Crypto] Erro ao descriptografar dados do storage:', error);
    return null;
  }
}

/**
 * Limpa dados expirados do storage
 * @param {object} api - Instância da API do browser
 * @param {string[]} keys - Chaves para verificar
 */
export async function cleanupExpiredData(api, keys = []) {
  try {
    const storage = await api.storage.local.get(keys.length > 0 ? keys : null);
    const keysToRemove = [];

    for (const [key, value] of Object.entries(storage)) {
      if (typeof value === 'string' && isEncrypted(value)) {
        try {
          const decrypted = await decryptFromStorage(value);
          if (decrypted === null) {
            keysToRemove.push(key);
          }
        } catch {
          // Se não conseguir descriptografar, remove também
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await api.storage.local.remove(keysToRemove);
      logger.info(`[Crypto] Removidos ${keysToRemove.length} itens expirados do storage`);
    }
  } catch (error) {
    logger.error('[Crypto] Erro ao limpar dados expirados:', error);
  }
}

/**
 * Utilitário para hash de dados (para verificação de integridade)
 * @param {any} data - Dados para gerar hash
 * @returns {Promise<string>} Hash SHA-256 em hexadecimal
 */
export async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ✅ SEGURANÇA: Configurações exportadas para uso em outros módulos
export const MEDICAL_DATA_CONFIG = {
  DEFAULT_TTL_MINUTES: 60, // 1 hora
  SENSITIVE_TTL_MINUTES: 30, // 30 minutos para dados mais sensíveis
  MAX_TTL_MINUTES: 240, // 4 horas máximo
};

