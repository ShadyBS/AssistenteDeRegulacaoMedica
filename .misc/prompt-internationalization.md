# Prompt para Internacionalização de Extensões de Navegador

## 🌐 MISSÃO: IMPLEMENTAÇÃO COMPLETA DE SUPORTE MULTI-IDIOMA

Você é um **Senior Browser Extension Internationalization Engineer** especializado em **localização avançada** para extensões **Manifest V3**. Implemente **suporte completo a múltiplos idiomas**, **adaptações culturais** e **gerenciamento de traduções** para criar extensões **globalmente acessíveis**.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE IMPLEMENTAR I18N:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise mercados-alvo** - Identifique idiomas e regiões prioritárias
3. **Audite strings existentes** - Catalogue todo texto da extensão
4. **Configure estrutura i18n** - Setup de arquivos e sistema
5. **Implemente detecção de idioma** - Auto-detecção e seleção manual
6. **Adapte layouts** - RTL, comprimento de texto, formatação
7. **Configure pipeline de tradução** - Workflow para tradutores

---

## 🌍 SISTEMA DE INTERNACIONALIZAÇÃO ABRANGENTE

### **🗣️ IDIOMAS E REGIÕES SUPORTADAS**

#### **Tier 1 - Idiomas Prioritários**
```typescript
interface PrimaryLanguages {
  'en': {
    name: 'English',
    region: 'US',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'es': {
    name: 'Español',
    region: 'ES',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'fr': {
    name: 'Français',
    region: 'FR',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'de': {
    name: 'Deutsch',
    region: 'DE',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'pt': {
    name: 'Português',
    region: 'BR',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'zh': {
    name: '中文',
    region: 'CN',
    direction: 'ltr',
    marketSize: 'large',
    priority: 1
  };
  'ja': {
    name: '日本語',
    region: 'JP',
    direction: 'ltr',
    marketSize: 'medium',
    priority: 1
  };
  'ko': {
    name: '한국어',
    region: 'KR',
    direction: 'ltr',
    marketSize: 'medium',
    priority: 1
  };
}
```

#### **Tier 2 - Idiomas Secundários**
```typescript
interface SecondaryLanguages {
  'ru': { name: 'Русский', region: 'RU', direction: 'ltr' };
  'it': { name: 'Italiano', region: 'IT', direction: 'ltr' };
  'nl': { name: 'Nederlands', region: 'NL', direction: 'ltr' };
  'pl': { name: 'Polski', region: 'PL', direction: 'ltr' };
  'tr': { name: 'Türkçe', region: 'TR', direction: 'ltr' };
  'ar': { name: 'العربية', region: 'SA', direction: 'rtl' };
  'he': { name: 'עברית', region: 'IL', direction: 'rtl' };
  'hi': { name: 'हिन्दी', region: 'IN', direction: 'ltr' };
  'th': { name: 'ไทย', region: 'TH', direction: 'ltr' };
  'vi': { name: 'Tiếng Việt', region: 'VN', direction: 'ltr' };
}
```

### **📁 Estrutura de Arquivos i18n**

```
_locales/
├── en/
│   ├── messages.json              # Mensagens principais
│   ├── ui.json                    # Textos de interface
│   ├── errors.json                # Mensagens de erro
│   ├── help.json                  # Textos de ajuda
│   └── store.json                 # Descrições para store
├── es/
│   ├── messages.json
│   ├── ui.json
│   ├── errors.json
│   ├── help.json
│   └── store.json
├── fr/
│   └── ... (mesma estrutura)
├── de/
│   └── ... (mesma estrutura)
├── pt/
│   └── ... (mesma estrutura)
├── zh/
│   └── ... (mesma estrutura)
├── ja/
│   └── ... (mesma estrutura)
├── ko/
│   └── ... (mesma estrutura)
└── config/
    ├── languages.json             # Configuração de idiomas
    ├── regions.json               # Configuração de regiões
    ├── formats.json               # Formatos por região
    └── fallbacks.json             # Idiomas de fallback
```

### **🔧 Sistema de Internacionalização**

#### **Core i18n Manager**
```javascript
// Advanced Internationalization Manager
class InternationalizationManager {
  constructor() {
    this.currentLocale = null;
    this.fallbackLocale = 'en';
    this.messages = new Map();
    this.formatters = new Map();
    this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    this.loadedLocales = new Set();
    
    this.initialize();
  }

  async initialize() {
    // Detect user's preferred language
    this.currentLocale = await this.detectUserLanguage();
    
    // Load messages for current locale
    await this.loadLocale(this.currentLocale);
    
    // Load fallback locale if different
    if (this.currentLocale !== this.fallbackLocale) {
      await this.loadLocale(this.fallbackLocale);
    }
    
    // Setup formatters
    this.setupFormatters();
    
    // Apply locale to DOM
    this.applyLocaleToDOM();
    
    console.log(`🌐 i18n initialized with locale: ${this.currentLocale}`);
  }

  async detectUserLanguage() {
    // Try to get from storage first
    const stored = await chrome.storage.sync.get('user_language');
    if (stored.user_language) {
      return stored.user_language;
    }

    // Get browser language
    const browserLang = chrome.i18n.getUILanguage();
    const primaryLang = browserLang.split('-')[0];

    // Check if we support this language
    const supportedLanguages = await this.getSupportedLanguages();
    
    if (supportedLanguages.includes(browserLang)) {
      return browserLang;
    } else if (supportedLanguages.includes(primaryLang)) {
      return primaryLang;
    }

    // Fallback to English
    return this.fallbackLocale;
  }

  async getSupportedLanguages() {
    try {
      const response = await fetch(chrome.runtime.getURL('_locales/config/languages.json'));
      const config = await response.json();
      return Object.keys(config.supported);
    } catch (error) {
      console.error('Failed to load language config:', error);
      return ['en'];
    }
  }

  async loadLocale(locale) {
    if (this.loadedLocales.has(locale)) return;

    try {
      // Load all message files for this locale
      const messageFiles = ['messages', 'ui', 'errors', 'help', 'store'];
      const messages = {};

      for (const file of messageFiles) {
        try {
          const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/${file}.json`));
          const fileMessages = await response.json();
          Object.assign(messages, fileMessages);
        } catch (error) {
          console.warn(`Failed to load ${file}.json for ${locale}:`, error);
        }
      }

      this.messages.set(locale, messages);
      this.loadedLocales.add(locale);
      
      console.log(`📄 Loaded ${Object.keys(messages).length} messages for ${locale}`);
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
    }
  }

  getMessage(key, substitutions = [], locale = null) {
    const targetLocale = locale || this.currentLocale;
    
    // Try current locale first
    let messages = this.messages.get(targetLocale);
    let message = messages?.[key];

    // Fallback to default locale
    if (!message && targetLocale !== this.fallbackLocale) {
      messages = this.messages.get(this.fallbackLocale);
      message = messages?.[key];
    }

    // If still no message, return key
    if (!message) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }

    // Handle Chrome i18n format
    if (typeof message === 'object' && message.message) {
      message = message.message;
    }

    // Substitute placeholders
    if (substitutions.length > 0) {
      message = this.substitutePlaceholders(message, substitutions);
    }

    return message;
  }

  substitutePlaceholders(message, substitutions) {
    // Handle Chrome i18n placeholders ($1, $2, etc.)
    return message.replace(/\$(\d+)/g, (match, index) => {
      const subIndex = parseInt(index) - 1;
      return substitutions[subIndex] || match;
    });
  }

  // Shorthand method
  t(key, substitutions = []) {
    return this.getMessage(key, substitutions);
  }

  async setLocale(locale) {
    if (locale === this.currentLocale) return;

    // Load new locale if not already loaded
    await this.loadLocale(locale);

    // Update current locale
    this.currentLocale = locale;

    // Save to storage
    await chrome.storage.sync.set({ user_language: locale });

    // Update formatters
    this.setupFormatters();

    // Apply to DOM
    this.applyLocaleToDOM();

    // Notify listeners
    this.notifyLocaleChange(locale);

    console.log(`🌐 Locale changed to: ${locale}`);
  }

  setupFormatters() {
    const locale = this.currentLocale;

    // Number formatter
    this.formatters.set('number', new Intl.NumberFormat(locale));

    // Currency formatter
    this.formatters.set('currency', new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.getCurrencyForLocale(locale)
    }));

    // Date formatters
    this.formatters.set('date', new Intl.DateTimeFormat(locale));
    this.formatters.set('datetime', new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));
    this.formatters.set('time', new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }));

    // Relative time formatter
    if (Intl.RelativeTimeFormat) {
      this.formatters.set('relative', new Intl.RelativeTimeFormat(locale));
    }
  }

  getCurrencyForLocale(locale) {
    const currencyMap = {
      'en': 'USD',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-CA': 'CAD',
      'en-AU': 'AUD',
      'es': 'EUR',
      'es-ES': 'EUR',
      'es-MX': 'MXN',
      'fr': 'EUR',
      'de': 'EUR',
      'pt': 'EUR',
      'pt-BR': 'BRL',
      'zh': 'CNY',
      'zh-CN': 'CNY',
      'ja': 'JPY',
      'ko': 'KRW'
    };

    return currencyMap[locale] || currencyMap[locale.split('-')[0]] || 'USD';
  }

  formatNumber(number, options = {}) {
    const formatter = this.formatters.get('number');
    return formatter.format(number);
  }

  formatCurrency(amount, currency = null) {
    if (currency) {
      const formatter = new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency
      });
      return formatter.format(amount);
    }
    
    const formatter = this.formatters.get('currency');
    return formatter.format(amount);
  }

  formatDate(date, style = 'date') {
    const formatter = this.formatters.get(style);
    return formatter.format(date);
  }

  formatRelativeTime(value, unit) {
    const formatter = this.formatters.get('relative');
    return formatter ? formatter.format(value, unit) : `${value} ${unit}`;
  }

  applyLocaleToDOM() {
    if (typeof document === 'undefined') return;

    // Set document language and direction
    document.documentElement.lang = this.currentLocale;
    document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';

    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = this.getMessage(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = message;
      } else {
        element.textContent = message;
      }
    });

    // Update elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getMessage(key);
    });

    // Apply RTL/LTR specific styles
    this.applyDirectionalStyles();
  }

  isRTL() {
    return this.rtlLanguages.includes(this.currentLocale.split('-')[0]);
  }

  applyDirectionalStyles() {
    if (typeof document === 'undefined') return;

    const isRTL = this.isRTL();
    
    // Add/remove RTL class
    document.body.classList.toggle('rtl', isRTL);
    document.body.classList.toggle('ltr', !isRTL);

    // Update CSS custom properties for direction-aware styling
    document.documentElement.style.setProperty('--text-direction', isRTL ? 'rtl' : 'ltr');
    document.documentElement.style.setProperty('--start-direction', isRTL ? 'right' : 'left');
    document.documentElement.style.setProperty('--end-direction', isRTL ? 'left' : 'right');
  }

  notifyLocaleChange(locale) {
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localechange', {
        detail: { locale, isRTL: this.isRTL() }
      }));
    }

    // Notify other parts of extension
    chrome.runtime.sendMessage({
      type: 'LOCALE_CHANGED',
      locale,
      isRTL: this.isRTL()
    });
  }

  // Pluralization support
  getPlural(key, count, substitutions = []) {
    const pluralKey = this.getPluralKey(key, count);
    return this.getMessage(pluralKey, [count, ...substitutions]);
  }

  getPluralKey(key, count) {
    // Simple English pluralization rules
    if (this.currentLocale.startsWith('en')) {
      return count === 1 ? `${key}_one` : `${key}_other`;
    }

    // Add more complex pluralization rules for other languages
    // This is a simplified version - real implementation would use
    // proper pluralization libraries like Intl.PluralRules
    
    return count === 1 ? `${key}_one` : `${key}_other`;
  }

  // Gender support for languages that need it
  getGenderedMessage(key, gender = 'neutral', substitutions = []) {
    const genderedKey = `${key}_${gender}`;
    const message = this.getMessage(genderedKey, substitutions);
    
    // Fallback to neutral if gendered version doesn't exist
    if (message === genderedKey) {
      return this.getMessage(key, substitutions);
    }
    
    return message;
  }
}

// Initialize global i18n instance
const i18n = new InternationalizationManager();

// Global helper functions
window.t = (key, substitutions) => i18n.getMessage(key, substitutions);
window.tPlural = (key, count, substitutions) => i18n.getPlural(key, count, substitutions);
window.formatNumber = (number) => i18n.formatNumber(number);
window.formatCurrency = (amount, currency) => i18n.formatCurrency(amount, currency);
window.formatDate = (date, style) => i18n.formatDate(date, style);
```

#### **Translation Management System**
```javascript
// Translation Management and Validation
class TranslationManager {
  constructor() {
    this.sourceLocale = 'en';
    this.translations = new Map();
    this.validationRules = new Map();
    this.setupValidationRules();
  }

  setupValidationRules() {
    // Length validation
    this.validationRules.set('length', (source, translation, locale) => {
      const sourceLength = source.length;
      const translationLength = translation.length;
      
      // Allow 50% variance in length
      const maxLength = sourceLength * 1.5;
      const minLength = sourceLength * 0.5;
      
      if (translationLength > maxLength || translationLength < minLength) {
        return {
          valid: false,
          message: `Translation length (${translationLength}) is outside acceptable range (${minLength}-${maxLength})`
        };
      }
      
      return { valid: true };
    });

    // Placeholder validation
    this.validationRules.set('placeholders', (source, translation, locale) => {
      const sourcePlaceholders = source.match(/\$\d+/g) || [];
      const translationPlaceholders = translation.match(/\$\d+/g) || [];
      
      if (sourcePlaceholders.length !== translationPlaceholders.length) {
        return {
          valid: false,
          message: `Placeholder count mismatch. Source: ${sourcePlaceholders.length}, Translation: ${translationPlaceholders.length}`
        };
      }
      
      // Check if all placeholders are present
      for (const placeholder of sourcePlaceholders) {
        if (!translationPlaceholders.includes(placeholder)) {
          return {
            valid: false,
            message: `Missing placeholder: ${placeholder}`
          };
        }
      }
      
      return { valid: true };
    });

    // HTML tag validation
    this.validationRules.set('html', (source, translation, locale) => {
      const sourceTags = source.match(/<[^>]+>/g) || [];
      const translationTags = translation.match(/<[^>]+>/g) || [];
      
      if (sourceTags.length !== translationTags.length) {
        return {
          valid: false,
          message: `HTML tag count mismatch. Source: ${sourceTags.length}, Translation: ${translationTags.length}`
        };
      }
      
      return { valid: true };
    });

    // Character encoding validation
    this.validationRules.set('encoding', (source, translation, locale) => {
      // Check for proper Unicode encoding
      try {
        const encoded = encodeURIComponent(translation);
        const decoded = decodeURIComponent(encoded);
        
        if (decoded !== translation) {
          return {
            valid: false,
            message: 'Translation contains invalid Unicode characters'
          };
        }
      } catch (error) {
        return {
          valid: false,
          message: 'Translation encoding validation failed'
        };
      }
      
      return { valid: true };
    });
  }

  async loadTranslations(locale) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
      const translations = await response.json();
      this.translations.set(locale, translations);
      return translations;
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error);
      return {};
    }
  }

  validateTranslation(key, sourceText, translatedText, locale) {
    const results = [];
    
    for (const [ruleName, rule] of this.validationRules) {
      const result = rule(sourceText, translatedText, locale);
      
      if (!result.valid) {
        results.push({
          rule: ruleName,
          key,
          locale,
          message: result.message,
          severity: result.severity || 'warning'
        });
      }
    }
    
    return results;
  }

  async validateAllTranslations(locale) {
    const sourceTranslations = await this.loadTranslations(this.sourceLocale);
    const targetTranslations = await this.loadTranslations(locale);
    
    const validationResults = [];
    
    for (const [key, sourceMessage] of Object.entries(sourceTranslations)) {
      const targetMessage = targetTranslations[key];
      
      if (!targetMessage) {
        validationResults.push({
          rule: 'missing',
          key,
          locale,
          message: 'Translation missing',
          severity: 'error'
        });
        continue;
      }
      
      const sourceText = typeof sourceMessage === 'object' ? sourceMessage.message : sourceMessage;
      const targetText = typeof targetMessage === 'object' ? targetMessage.message : targetMessage;
      
      const results = this.validateTranslation(key, sourceText, targetText, locale);
      validationResults.push(...results);
    }
    
    return validationResults;
  }

  generateTranslationReport(locale) {
    return this.validateAllTranslations(locale).then(results => {
      const report = {
        locale,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.length,
          errors: results.filter(r => r.severity === 'error').length,
          warnings: results.filter(r => r.severity === 'warning').length
        },
        issues: results
      };
      
      return report;
    });
  }

  async exportTranslationsForTranslator(locale) {
    const sourceTranslations = await this.loadTranslations(this.sourceLocale);
    const targetTranslations = await this.loadTranslations(locale);
    
    const exportData = {
      metadata: {
        sourceLocale: this.sourceLocale,
        targetLocale: locale,
        exportDate: new Date().toISOString(),
        totalStrings: Object.keys(sourceTranslations).length
      },
      translations: []
    };
    
    for (const [key, sourceMessage] of Object.entries(sourceTranslations)) {
      const sourceText = typeof sourceMessage === 'object' ? sourceMessage.message : sourceMessage;
      const targetMessage = targetTranslations[key];
      const targetText = targetMessage ? 
        (typeof targetMessage === 'object' ? targetMessage.message : targetMessage) : '';
      
      exportData.translations.push({
        key,
        source: sourceText,
        target: targetText,
        description: typeof sourceMessage === 'object' ? sourceMessage.description : '',
        context: this.getTranslationContext(key),
        status: targetText ? 'translated' : 'pending'
      });
    }
    
    return exportData;
  }

  getTranslationContext(key) {
    // Provide context based on key naming patterns
    if (key.startsWith('error_')) return 'Error message';
    if (key.startsWith('button_')) return 'Button text';
    if (key.startsWith('menu_')) return 'Menu item';
    if (key.startsWith('tooltip_')) return 'Tooltip text';
    if (key.startsWith('title_')) return 'Page/section title';
    if (key.startsWith('description_')) return 'Description text';
    
    return 'General text';
  }
}

// Initialize translation manager
const translationManager = new TranslationManager();
```

#### **Language Switcher Component**
```javascript
// Language Switcher UI Component
class LanguageSwitcher {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentLocale = i18n.currentLocale;
    this.availableLanguages = [];
    
    this.initialize();
  }

  async initialize() {
    await this.loadAvailableLanguages();
    this.render();
    this.setupEventListeners();
  }

  async loadAvailableLanguages() {
    try {
      const response = await fetch(chrome.runtime.getURL('_locales/config/languages.json'));
      const config = await response.json();
      this.availableLanguages = Object.entries(config.supported).map(([code, info]) => ({
        code,
        ...info
      }));
    } catch (error) {
      console.error('Failed to load available languages:', error);
      this.availableLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' }
      ];
    }
  }

  render() {
    const currentLang = this.availableLanguages.find(lang => lang.code === this.currentLocale);
    
    this.container.innerHTML = `
      <div class="language-switcher">
        <button class="language-switcher-button" id="languageButton">
          <span class="language-flag">${this.getFlagEmoji(this.currentLocale)}</span>
          <span class="language-name">${currentLang?.nativeName || currentLang?.name || this.currentLocale}</span>
          <span class="language-arrow">▼</span>
        </button>
        <div class="language-dropdown" id="languageDropdown">
          ${this.availableLanguages.map(lang => `
            <div class="language-option ${lang.code === this.currentLocale ? 'active' : ''}" 
                 data-locale="${lang.code}">
              <span class="language-flag">${this.getFlagEmoji(lang.code)}</span>
              <span class="language-name">${lang.nativeName || lang.name}</span>
              ${lang.code === this.currentLocale ? '<span class="checkmark">✓</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const button = this.container.querySelector('#languageButton');
    const dropdown = this.container.querySelector('#languageDropdown');
    const options = this.container.querySelectorAll('.language-option');

    // Toggle dropdown
    button.addEventListener('click', () => {
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.container.contains(event.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', async () => {
        const locale = option.dataset.locale;
        
        if (locale !== this.currentLocale) {
          // Show loading state
          option.classList.add('loading');
          
          try {
            await i18n.setLocale(locale);
            this.currentLocale = locale;
            this.render();
            
            // Notify parent components
            this.onLanguageChange(locale);
          } catch (error) {
            console.error('Failed to change language:', error);
            // Show error message
            this.showError(i18n.t('error_language_change_failed'));
          } finally {
            option.classList.remove('loading');
          }
        }
        
        dropdown.classList.remove('open');
      });
    });

    // Listen for external locale changes
    window.addEventListener('localechange', (event) => {
      this.currentLocale = event.detail.locale;
      this.render();
    });
  }

  getFlagEmoji(locale) {
    const flagMap = {
      'en': '🇺🇸',
      'en-US': '🇺🇸',
      'en-GB': '🇬🇧',
      'en-CA': '🇨🇦',
      'en-AU': '🇦🇺',
      'es': '🇪🇸',
      'es-ES': '🇪🇸',
      'es-MX': '🇲🇽',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'pt': '🇵🇹',
      'pt-BR': '🇧🇷',
      'zh': '🇨🇳',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ru': '🇷🇺',
      'it': '🇮🇹',
      'nl': '🇳����',
      'pl': '🇵🇱',
      'tr': '🇹🇷',
      'ar': '🇸🇦',
      'he': '🇮🇱',
      'hi': '🇮🇳',
      'th': '🇹🇭',
      'vi': '🇻🇳'
    };

    return flagMap[locale] || flagMap[locale.split('-')[0]] || '🌐';
  }

  onLanguageChange(locale) {
    // Override this method to handle language changes
    console.log(`Language changed to: ${locale}`);
  }

  showError(message) {
    // Simple error display - can be enhanced
    const errorDiv = document.createElement('div');
    errorDiv.className = 'language-error';
    errorDiv.textContent = message;
    this.container.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
}

// CSS for language switcher (to be included in your CSS file)
const languageSwitcherCSS = `
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-switcher-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.language-switcher-button:hover {
  background: #f5f5f5;
}

.language-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  display: none;
}

.language-dropdown.open {
  display: block;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}

.language-option:hover {
  background: #f5f5f5;
}

.language-option.active {
  background: #e3f2fd;
  font-weight: 500;
}

.language-flag {
  font-size: 16px;
}

.checkmark {
  margin-left: auto;
  color: #2196f3;
  font-weight: bold;
}

.language-error {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #f44336;
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
}

/* RTL support */
.rtl .language-dropdown {
  left: auto;
  right: 0;
}

.rtl .checkmark {
  margin-left: 0;
  margin-right: auto;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = languageSwitcherCSS;
  document.head.appendChild(style);
}
```

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO

### **OBJETIVO:** Implementar suporte completo a múltiplos idiomas

### **ESTRUTURA DE ENTREGA:**

```
📦 INTERNATIONALIZATION SYSTEM
├── 🌐 _locales/                    # Arquivos de localização
│   ├── en/                         # Inglês (base)
│   ├── es/                         # Espanhol
│   ├── fr/                         # Francês
│   ├── de/                         # Alemão
│   ├── pt/                         # Português
│   ├── zh/                         # Chinês
│   ├── ja/                         # Japonês
│   ├── ko/                         # Coreano
│   ├── ru/                         # Russo
│   ├── ar/                         # Árabe (RTL)
│   ├── he/                         # Hebraico (RTL)
│   └── config/                     # Configurações i18n
├── 🔧 i18n/                        # Sistema de internacionalização
│   ├── i18n-manager.js             # Gerenciador principal
│   ├── translation-manager.js      # Gerenciador de traduções
│   ├── language-detector.js        # Detector de idioma
│   ├── formatter.js                # Formatadores regionais
│   └── validator.js                # Validador de traduções
├── 🎨 components/                  # Componentes i18n
│   ├── language-switcher.js        # Seletor de idioma
│   ├── rtl-handler.js              # Handler RTL/LTR
│   ├── date-picker.js              # Date picker localizado
│   └── number-input.js             # Input de números localizado
├── 🛠️ tools/                       # Ferramentas de tradução
│   ├── translation-extractor.js    # Extrator de strings
│   ├── translation-validator.js    # Validador de traduções
│   ├── pseudo-localizer.js         # Pseudo-localização para testes
│   └── translation-exporter.js     # Exportador para tradutores
├── 📊 analytics/                   # Analytics de i18n
│   ├── language-usage.js           # Uso por idioma
│   ├── translation-coverage.js     # Cobertura de traduções
│   └── locale-performance.js       # Performance por locale
├── 🧪 testing/                     # Testes de i18n
│   ├── i18n-tests.js               # Testes do sistema i18n
│   ├── translation-tests.js        # Testes de traduções
│   ├── rtl-tests.js                # Testes RTL
│   └── locale-switching-tests.js   # Testes de troca de idioma
├── 📚 documentation/               # Documentação i18n
│   ├── translation-guide.md        # Guia para tradutores
│   ├── developer-guide.md          # Guia para desenvolvedores
│   ├── style-guide.md              # Guia de estilo
│   └── locale-support.md           # Suporte a locales
└── ⚙️ config/                      # Configurações
    ├── supported-languages.json    # Idiomas suportados
    ├── translation-workflow.json   # Workflow de tradução
    └── formatting-rules.json       # Regras de formatação
```

### **CADA IDIOMA DEVE CONTER:**

#### **📝 Arquivos de Tradução**
- messages.json - Mensagens principais
- ui.json - Textos de interface
- errors.json - Mensagens de erro
- help.json - Textos de ajuda
- store.json - Descrições para store

#### **🎨 Adaptações Culturais**
- Formatação de números
- Formatação de datas
- Formatação de moedas
- Direção de texto (RTL/LTR)
- Convenções culturais

#### **✅ Validação de Qualidade**
- Completude das traduções
- Consistência terminológica
- Validação de placeholders
- Verificação de encoding
- Testes de layout

---

## ✅ CHECKLIST DE INTERNACIONALIZAÇÃO COMPLETA

### **🌐 Setup Básico**
- [ ] **Estrutura de arquivos** _locales configurada
- [ ] **Sistema i18n** implementado e funcional
- [ ] **Detecção automática** de idioma do usuário
- [ ] **Fallback para inglês** configurado
- [ ] **Seletor de idioma** implementado na UI
- [ ] **Persistência** da escolha do usuário
- [ ] **Notificação** de mudanças de idioma
- [ ] **Recarregamento** automático da interface

### **📝 Traduções**
- [ ] **Idiomas Tier 1** traduzidos (EN, ES, FR, DE, PT, ZH, JA, KO)
- [ ] **Idiomas Tier 2** traduzidos conforme necessário
- [ ] **Todas as strings** extraídas e traduzidas
- [ ] **Pluralização** implementada onde necessário
- [ ] **Gênero** suportado para idiomas que precisam
- [ ] **Contexto** fornecido para tradutores
- [ ] **Validação** de traduções implementada
- [ ] **Workflow** de tradu��ão estabelecido

### **🎨 Adaptações Visuais**
- [ ] **Suporte RTL** implementado (árabe, hebraico)
- [ ] **Layouts responsivos** a diferentes comprimentos de texto
- [ ] **Fontes** apropriadas para cada idioma
- [ ] **Formatação** de números, datas e moedas
- [ ] **Ícones e imagens** culturalmente apropriados
- [ ] **Cores** culturalmente sensíveis
- [ ] **Espaçamento** ajustado para diferentes scripts
- [ ] **Quebras de linha** apropriadas

### **🧪 Testing e Qualidade**
- [ ] **Testes automatizados** para i18n
- [ ] **Pseudo-localização** para detectar problemas
- [ ] **Testes de layout** em todos os idiomas
- [ ] **Testes de performance** com diferentes locales
- [ ] **Validação** de completude das traduções
- [ ] **Testes de troca** de idioma em runtime
- [ ] **Testes cross-browser** para i18n
- [ ] **Testes de acessibilidade** em diferentes idiomas

### **📊 Monitoramento**
- [ ] **Analytics** de uso por idioma
- [ ] **Métricas** de performance por locale
- [ ] **Tracking** de problemas de tradução
- [ ] **Feedback** de usuários sobre traduções
- [ ] **Cobertura** de traduções monitorada
- [ ] **Qualidade** das traduções avaliada
- [ ] **Atualizações** de tradução automatizadas
- [ ] **Relatórios** regulares de i18n

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverable Final**
Uma **extensão completamente internacionalizada** que:

✅ **Suporta múltiplos idiomas** nativamente  
✅ **Detecta automaticamente** o idioma do usuário  
✅ **Permite troca** de idioma em runtime  
✅ **Adapta layouts** para RTL e diferentes comprimentos  
✅ **Formata dados** apropriadamente por região  
✅ **Mantém qualidade** das traduções  
✅ **Facilita adição** de novos idiomas  

### **🌍 Benefícios da Internacionalização**
- **📈 Expansão de 300%** no mercado potencial
- **👥 Melhor experiência** para usuários globais
- **⭐ Ratings mais altos** em diferentes regiões
- **💰 Maior receita** de mercados internacionais
- **🚀 Crescimento acelerado** em novos mercados
- **🏆 Vantagem competitiva** global

**A internacionalização deve tornar a extensão verdadeiramente global, proporcionando uma experiência nativa e culturalmente apropriada para usuários de diferentes idiomas e regiões.**