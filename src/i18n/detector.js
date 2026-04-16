/**
 * Language detection and resolution
 * Priority: config language > system locale > default (en)
 */

export function detectLanguage(configLanguage) {
  // 1. User config takes precedence
  if (configLanguage === 'zh') {
    return 'zh';
  }

  // 2. System locale
  const locale = process.env.LANG || process.env.LC_ALL || '';
  if (locale.startsWith('zh')) {
    return 'zh';
  }

  // 3. Default to English
  return 'en';
}
