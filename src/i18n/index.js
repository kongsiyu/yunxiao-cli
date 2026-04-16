import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { detectLanguage } from './detector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let currentLanguage = 'en';
let translations = {};

/**
 * Initialize i18n with detected language
 * @param {string} configLanguage - Language from config (if set)
 */
export function initI18n(configLanguage) {
  currentLanguage = detectLanguage(configLanguage);
  loadTranslations(currentLanguage);
}

/**
 * Load translation file for specified language
 */
function loadTranslations(lang) {
  if (lang === 'en') {
    translations = {};
    return;
  }

  try {
    const translationPath = join(__dirname, '...', 'translations', `${lang}.json`);
    const content = readFileSync(translationPath, 'utf-8');
    translations = JSON.parse(content);
  } catch (error) {
    // Fallback to English if translation file not found
    translations = {};
  }
}

/**
 * Get translated string or fallback to English key
 * @param {string} key - Translation key (e.g., 'output.header.workitems')
 * @param {string} fallback - English fallback text
 * @returns {string} Translated or fallback text
 */
export function t(key, fallback = '') {
  if (currentLanguage === 'en' || !translations[key]) {
    return fallback || key;
  }
  return translations[key];
}

/**
 * Get current language
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Set language (for testing)
 */
export function setLanguage(lang) {
  currentLanguage = lang;
  loadTranslations(lang);
}
