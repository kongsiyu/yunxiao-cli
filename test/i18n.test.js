import { test } from 'node:test';
import assert from 'node:assert';
import { detectLanguage } from '../src/i18n/detector.js';
import { initI18n, t, getLanguage, setLanguage } from '../src/i18n/index.js';

test('i18n - Language Detection', async (suite) => {
  await suite.test('should use config language when set to zh', () => {
    const lang = detectLanguage('zh');
    assert.strictEqual(lang, 'zh');
  });

  await suite.test('should default to en when config language is not zh', () => {
    const lang = detectLanguage('en');
    assert.strictEqual(lang, 'en');
  });

  await suite.test('should default to en when config language is undefined', () => {
    const lang = detectLanguage(undefined);
    assert.strictEqual(lang, 'en');
  });

  await suite.test('should detect zh from LANG environment variable', () => {
    const originalLang = process.env.LANG;
    try {
      process.env.LANG = 'zh_CN.UTF-8';
      const lang = detectLanguage(undefined);
      assert.strictEqual(lang, 'zh');
    } finally {
      process.env.LANG = originalLang;
    }
  });

  await suite.test('should detect zh from LC_ALL environment variable', () => {
    const originalLang = process.env.LANG;
    const originalLC = process.env.LC_ALL;
    try {
      delete process.env.LANG;
      process.env.LC_ALL = 'zh_CN.UTF-8';
      const lang = detectLanguage(undefined);
      assert.strictEqual(lang, 'zh');
    } finally {
      process.env.LANG = originalLang;
      process.env.LC_ALL = originalLC;
    }
  });

  await suite.test('should default to en when locale is not zh', () => {
    const originalLang = process.env.LANG;
    const originalLC = process.env.LC_ALL;
    try {
      process.env.LANG = 'en_US.UTF-8';
      delete process.env.LC_ALL;
      const lang = detectLanguage(undefined);
      assert.strictEqual(lang, 'en');
    } finally {
      process.env.LANG = originalLang;
      process.env.LC_ALL = originalLC;
    }
  });

  await suite.test('config language should take precedence over locale', () => {
    const originalLang = process.env.LANG;
    try {
      process.env.LANG = 'en_US.UTF-8';
      const lang = detectLanguage('zh');
      assert.strictEqual(lang, 'zh');
    } finally {
      process.env.LANG = originalLang;
    }
  });
});

test('i18n - Translation System', async (suite) => {
  await suite.test('should initialize with detected language', () => {
    initI18n('zh');
    assert.strictEqual(getLanguage(), 'zh');
  });

  await suite.test('should initialize with en when no config', () => {
    initI18n(undefined);
    assert.strictEqual(getLanguage(), 'en');
  });

  await suite.test('should return fallback text in English mode', () => {
    initI18n(undefined);
    const result = t('output.header.workitems', 'Work Items');
    assert.strictEqual(result, 'Work Items');
  });

  await suite.test('should return translated text in Chinese mode', () => {
    initI18n('zh');
    const result = t('output.header.workitems', 'Work Items');
    assert.strictEqual(result, '工作项');
  });

  await suite.test('should return fallback when translation key not found', () => {
    initI18n('zh');
    const result = t('nonexistent.key', 'Fallback Text');
    assert.strictEqual(result, 'Fallback Text');
  });

  await suite.test('should allow language switching', () => {
    setLanguage('zh');
    assert.strictEqual(getLanguage(), 'zh');
    let result = t('output.header.workitems', 'Work Items');
    assert.strictEqual(result, '工作项');

    setLanguage('en');
    assert.strictEqual(getLanguage(), 'en');
    result = t('output.header.workitems', 'Work Items');
    assert.strictEqual(result, 'Work Items');
  });

  await suite.test('should handle multiple translation keys', () => {
    initI18n('zh');
    assert.strictEqual(t('output.header.id', 'ID'), 'ID');
    assert.strictEqual(t('output.header.title', 'Title'), '标题');
    assert.strictEqual(t('output.header.status', 'Status'), '状态');
  });

  await suite.test('should handle error messages in Chinese', () => {
    initI18n('zh');
    const result = t('errors.auth.notLoggedIn', 'Not logged in');
    assert.strictEqual(result, '未登录。请先运行 \'yunxiao auth login\' 命令。');
  });

  await suite.test('should handle command prompts in Chinese', () => {
    initI18n('zh');
    const result = t('commands.auth.login.success', 'Login successful');
    assert.strictEqual(result, '登录成功！');
  });
});

test('i18n - Backward Compatibility', async (suite) => {
  await suite.test('should maintain English output when i18n not initialized', () => {
    // Reset to English
    initI18n(undefined);
    const result = t('output.header.workitems', 'Work Items');
    assert.strictEqual(result, 'Work Items');
  });

  await suite.test('should not break existing code that uses fallback text', () => {
    initI18n(undefined);
    const result = t('any.key', 'Default English Text');
    assert.strictEqual(result, 'Default English Text');
  });
});
