# Guia de Codificação de Caracteres - Assistente de Regulação Médica

## 🎯 Objetivo

Este documento estabelece diretrizes obrigatórias para prevenir problemas de codificação de caracteres no projeto, garantindo compatibilidade cross-platform e integridade dos dados médicos.

## ⚠️ PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### Problemas Comuns de Codificação

1. **BOM (Byte Order Mark)** em arquivos UTF-8
2. **Codificação inconsistente** entre arquivos
3. **Caracteres especiais** mal codificados
4. **Diferenças entre Windows/Linux/macOS**
5. **Problemas em builds automatizados**

### Impacto no Projeto Médico

- **Dados médicos corrompidos** (nomes, endereços)
- **Falhas na comunicação** com sistema SIGSS
- **Problemas de compatibilidade** entre navegadores
- **Erros em builds** de produção

## 📋 DIRETRIZES OBRIGATÓRIAS

### 1. Configuração do Ambiente

#### VSCode Settings (OBRIGATÓRIO)
```json
{
  "files.encoding": "utf8",
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.trimTrailingWhitespace": true,
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "files.associations": {
    "*.js": "javascript",
    "*.json": "jsonc",
    "*.html": "html"
  }
}
```

#### Git Configuration (OBRIGATÓRIO)
```bash
# Configurar line endings para o projeto
git config core.autocrlf false
git config core.eol lf

# Configurar encoding
git config core.quotepath false
git config gui.encoding utf-8
```

#### .gitattributes (OBRIGATÓRIO)
```gitattributes
# Definir comportamento de line endings
* text=auto eol=lf

# Arquivos específicos
*.js text eol=lf
*.json text eol=lf
*.html text eol=lf
*.css text eol=lf
*.md text eol=lf

# Arquivos binários
*.png binary
*.jpg binary
*.ico binary
*.zip binary
```

### 2. Padrões de Codificação de Arquivos

#### Todos os Arquivos de Texto (OBRIGATÓRIO)
- **Encoding**: UTF-8 **SEM BOM**
- **Line Endings**: LF (`\n`) - Unix style
- **Final Newline**: Sempre presente
- **Trailing Whitespace**: Removido

#### Arquivos HTML (OBRIGATÓRIO)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Resto do conteúdo -->
</head>
```

#### Arquivos JavaScript (OBRIGATÓRIO)
```javascript
// ✅ SEMPRE especificar encoding em operações de arquivo
const fs = require('fs-extra');

// Leitura de arquivos
const content = await fs.readFile(filePath, 'utf8');

// Escrita de arquivos
await fs.writeFile(filePath, content, 'utf8');

// Remoção de BOM se presente
const cleanContent = content.replace(/^\uFEFF/, '');
```

#### Arquivos JSON (OBRIGATÓRIO)
```javascript
// ✅ SEMPRE usar fs-extra com encoding explícito
await fs.writeJson(filePath, data, {
  spaces: 2,
  encoding: 'utf8'
});

const data = await fs.readJson(filePath, { encoding: 'utf8' });
```

### 3. Práticas de Desenvolvimento

#### Leitura de Arquivos (OBRIGATÓRIO)
```javascript
// ✅ CORRETO - Com encoding explícito e remoção de BOM
async function readFileSecure(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    // Remove BOM se presente
    return content.replace(/^\uFEFF/, '');
  } catch (error) {
    throw new Error(`Erro ao ler arquivo ${filePath}: ${error.message}`);
  }
}

// ❌ INCORRETO - Sem encoding explícito
const content = await fs.readFile(filePath); // PERIGOSO
```

#### Escrita de Arquivos (OBRIGATÓRIO)
```javascript
// ✅ CORRETO - Com encoding explícito
async function writeFileSecure(filePath, content) {
  try {
    // Garante que não há BOM
    const cleanContent = content.replace(/^\uFEFF/, '');
    await fs.writeFile(filePath, cleanContent, 'utf8');
  } catch (error) {
    throw new Error(`Erro ao escrever arquivo ${filePath}: ${error.message}`);
  }
}

// ❌ INCORRETO - Sem encoding explícito
await fs.writeFile(filePath, content); // PERIGOSO
```

#### Manipulação de JSON (OBRIGATÓRIO)
```javascript
// ✅ CORRETO - Processamento seguro de JSON
async function processManifestSecure(manifestPath) {
  const content = await fs.readFile(manifestPath, 'utf8');
  const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM

  try {
    const manifest = JSON.parse(cleanContent);

    // Processa manifest...

    // Salva com encoding correto
    const newContent = JSON.stringify(manifest, null, 2) + '\n';
    await fs.writeFile(manifestPath, newContent, 'utf8');

    return manifest;
  } catch (error) {
    throw new Error(`JSON inválido em ${manifestPath}: ${error.message}`);
  }
}
```

#### Streams e Archives (OBRIGATÓRIO)
```javascript
// ✅ CORRETO - Streams com encoding
const output = fs.createWriteStream(zipPath, { encoding: 'binary' });
const archive = archiver('zip', {
  zlib: { level: 9 },
  // Especifica encoding para metadados
  comment: Buffer.from(comment, 'utf8').toString()
});
```

### 4. Validações Automatizadas

#### Script de Validação de Encoding
```javascript
// scripts/validate-encoding.js
const fs = require('fs-extra');
const path = require('path');

async function validateFileEncoding(filePath) {
  const bytes = await fs.readFile(filePath);

  // Verifica BOM UTF-8
  if (bytes.length >= 3 &&
      bytes[0] === 0xEF &&
      bytes[1] === 0xBB &&
      bytes[2] === 0xBF) {
    return { hasBOM: true, encoding: 'utf8-bom' };
  }

  // Verifica se é UTF-8 válido
  try {
    const content = bytes.toString('utf8');
    // Tenta re-codificar para verificar validade
    Buffer.from(content, 'utf8');
    return { hasBOM: false, encoding: 'utf8', valid: true };
  } catch (error) {
    return { hasBOM: false, encoding: 'unknown', valid: false, error };
  }
}

async function validateProjectEncoding() {
  const files = await getProjectFiles();
  const issues = [];

  for (const file of files) {
    const result = await validateFileEncoding(file);

    if (result.hasBOM) {
      issues.push({
        file,
        issue: 'BOM_DETECTED',
        message: 'Arquivo contém BOM UTF-8 desnecessário'
      });
    }

    if (!result.valid) {
      issues.push({
        file,
        issue: 'INVALID_ENCODING',
        message: 'Encoding inválido ou corrompido'
      });
    }
  }

  return issues;
}
```

#### Integração com NPM Scripts
```json
{
  "scripts": {
    "validate:encoding": "node scripts/validate-encoding.js",
    "fix:encoding": "node scripts/fix-encoding.js",
    "pre:commit": "npm run validate:encoding && npm run validate && npm run build"
  }
}
```

### 5. Configurações de Build

#### Webpack Configuration
```javascript
// webpack.config.js
module.exports = {
  // ... outras configurações

  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            // Garante encoding correto
            inputSourceMap: false,
            sourceMaps: false
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'css-loader',
            options: {
              // Especifica encoding para CSS
              charset: false // Evita @charset automático
            }
          }
        ]
      }
    ]
  },

  // Configurações de output
  output: {
    // Garante encoding correto nos bundles
    charset: true
  }
};
```

#### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  // ... outras configurações

  // Garante que o CSS gerado use encoding correto
  corePlugins: {
    // Remove charset automático que pode causar problemas
    charset: false
  }
};
```

### 6. Tratamento de Dados Médicos

#### Sanitização de Entrada (OBRIGATÓRIO)
```javascript
// validation.js - Extensão das funções existentes
function sanitizeTextInput(text) {
  if (typeof text !== 'string') return '';

  // Remove BOM se presente
  let clean = text.replace(/^\uFEFF/, '');

  // Normaliza caracteres Unicode (NFD -> NFC)
  clean = clean.normalize('NFC');

  // Remove caracteres de controle perigosos
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Preserva caracteres médicos importantes (acentos, etc.)
  return clean.trim();
}

function sanitizePatientName(name) {
  const sanitized = sanitizeTextInput(name);

  // Valida caracteres permitidos para nomes
  const validNameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]+$/;

  if (!validNameRegex.test(sanitized)) {
    throw new Error('Nome contém caracteres inválidos');
  }

  return sanitized;
}
```

#### API Communication (OBRIGATÓRIO)
```javascript
// api.js - Extensão das funções existentes
async function sendToSIGSS(data) {
  // Garante encoding correto antes de enviar
  const sanitizedData = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeTextInput(value);
    } else {
      sanitizedData[key] = value;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/plain, */*; charset=UTF-8'
    },
    body: new URLSearchParams(sanitizedData).toString()
  });

  // Verifica encoding da resposta
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('charset=UTF-8')) {
    console.warn('Resposta do SIGSS sem charset UTF-8:', contentType);
  }

  return response;
}
```

### 7. Debugging e Monitoramento

#### Detecção de Problemas de Encoding
```javascript
// logger.js - Extensão do sistema existente
function detectEncodingIssues(text) {
  const issues = [];

  // Detecta caracteres de replacement ()
  if (text.includes('')) {
    issues.push('REPLACEMENT_CHARACTERS');
  }

  // Detecta sequências UTF-8 mal decodificadas
  if (/[À-ÿ]{2,}/.test(text) && !/\s/.test(text)) {
    issues.push('POSSIBLE_DOUBLE_ENCODING');
  }

  // Detecta BOM no meio do texto
  if (text.includes('\uFEFF')) {
    issues.push('EMBEDDED_BOM');
  }

  return issues;
}

function logWithEncodingCheck(component, message, data) {
  const logger = createComponentLogger(component);

  // Verifica problemas de encoding nos dados
  if (typeof data === 'string') {
    const issues = detectEncodingIssues(data);
    if (issues.length > 0) {
      logger.warn('Problemas de encoding detectados', {
        issues,
        data: data.substring(0, 100) + '...'
      });
    }
  }

  logger.info(message, data);
}
```

### 8. Scripts de Correção Automática

#### Fix Encoding Script
```javascript
// scripts/fix-encoding.js
const fs = require('fs-extra');
const path = require('path');

async function fixFileEncoding(filePath) {
  const bytes = await fs.readFile(filePath);

  // Remove BOM se presente
  let content;
  if (bytes.length >= 3 &&
      bytes[0] === 0xEF &&
      bytes[1] === 0xBB &&
      bytes[2] === 0xBF) {
    content = bytes.slice(3).toString('utf8');
    console.log(`BOM removido de: ${filePath}`);
  } else {
    content = bytes.toString('utf8');
  }

  // Normaliza line endings para LF
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove trailing whitespace
  content = content.replace(/[ \t]+$/gm, '');

  // Garante final newline
  if (content.length > 0 && !content.endsWith('\n')) {
    content += '\n';
  }

  // Salva com encoding correto
  await fs.writeFile(filePath, content, 'utf8');
}

async function fixProjectEncoding() {
  const files = await getProjectFiles();
  let fixedCount = 0;

  for (const file of files) {
    try {
      await fixFileEncoding(file);
      fixedCount++;
    } catch (error) {
      console.error(`Erro ao corrigir ${file}:`, error.message);
    }
  }

  console.log(`✅ ${fixedCount} arquivos corrigidos`);
}
```

## 🔧 IMPLEMENTAÇÃO IMEDIATA

### 1. Atualizar Scripts Existentes

Todos os scripts em `scripts/` já implementam algumas dessas práticas, mas devem ser auditados para garantir:

- ✅ **Uso consistente de `'utf8'`** em todas as operações de arquivo
- ✅ **Remoção de BOM** com `content.replace(/^\uFEFF/, '')`
- ✅ **Tratamento de erros** de encoding

### 2. Adicionar Validações ao Pipeline

```json
{
  "scripts": {
    "validate": "npm run validate:encoding && node scripts/validate.js",
    "validate:encoding": "node scripts/validate-encoding.js",
    "fix:encoding": "node scripts/fix-encoding.js",
    "pre:commit": "npm run validate && npm run build"
  }
}
```

### 3. Configurar VSCode Workspace

Criar `.vscode/settings.json` com configurações obrigatórias de encoding.

### 4. Atualizar .gitattributes

Garantir que todos os arquivos de texto usem LF line endings.

## 📋 CHECKLIST DE VERIFICAÇÃO

### Antes de Cada Commit
- [ ] **Arquivos salvos com UTF-8 sem BOM**
- [ ] **Line endings consistentes (LF)**
- [ ] **Trailing whitespace removido**
- [ ] **Final newline presente**
- [ ] **Validação de encoding executada**

### Antes de Cada Release
- [ ] **Build completo sem erros de encoding**
- [ ] **ZIPs gerados corretamente**
- [ ] **Manifests com encoding correto**
- [ ] **CSS compilado sem problemas**

### Monitoramento Contínuo
- [ ] **Logs verificados para caracteres de replacement**
- [ ] **Dados médicos validados**
- [ ] **Comunicação com SIGSS funcionando**
- [ ] **Compatibilidade cross-browser mantida**

## 🚨 PROBLEMAS CRÍTICOS A EVITAR

### NUNCA FAÇA:
- ❌ **Salvar arquivos com BOM UTF-8**
- ❌ **Misturar line endings (CRLF/LF)**
- ❌ **Usar encoding padrão do sistema**
- ❌ **Ignorar erros de encoding**
- ❌ **Copiar/colar texto de fontes externas sem validação**

### SEMPRE FAÇA:
- ✅ **Especificar encoding explicitamente**
- ✅ **Validar dados médicos antes de processar**
- ✅ **Usar ferramentas de validação automática**
- ✅ **Testar em múltiplos ambientes**
- ✅ **Monitorar logs para problemas de encoding**

## 📞 SUPORTE E TROUBLESHOOTING

### Comandos de Diagnóstico PowerShell

```powershell
# Verificar arquivos com BOM
Get-ChildItem -Include "*.js", "*.json", "*.html" -Recurse |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
      Write-Host "BOM encontrado: $($_.Name)"
    }
  }

# Verificar line endings
Get-ChildItem -Include "*.js", "*.json" -Recurse |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "`r`n") {
      Write-Host "CRLF encontrado: $($_.Name)"
    }
  }
```

### Ferramentas Recomendadas

1. **VSCode Extensions:**
   - "EditorConfig for VS Code"
   - "Trailing Spaces"
   - "Line Endings Unify"

2. **Git Hooks:**
   - Pre-commit para validação de encoding
   - Pre-push para validação completa

3. **CI/CD Checks:**
   - Validação automática em GitHub Actions
   - Falha de build em problemas de encoding

---

**Este documento é parte integrante do `agents.md` e deve ser seguido rigorosamente por todos os agentes de IA trabalhando no projeto.**

**Última atualização:** 2025-01-27 - Versão 1.0.0
