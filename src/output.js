// src/output.js - Centralized output functions for --json mode support

/**
 * Calculate visual (terminal column) width of a string.
 * CJK wide characters count as 2 columns; all others count as 1.
 * No external dependencies — uses Unicode range checks.
 * @param {string} str
 * @returns {number}
 */
export function visualWidth(str) {
  let width = 0;
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (
      (cp >= 0x1100 && cp <= 0x115F) ||   // Hangul Jamo
      (cp >= 0x2E80 && cp <= 0x303F) ||   // CJK Radicals / Kangxi
      (cp >= 0x3040 && cp <= 0x33FF) ||   // Hiragana, Katakana, Bopomofo
      (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK Extension A
      (cp >= 0x4E00 && cp <= 0x9FFF) ||   // CJK Unified Ideographs (main block)
      (cp >= 0xA000 && cp <= 0xA4CF) ||   // Yi
      (cp >= 0xAC00 && cp <= 0xD7AF) ||   // Hangul Syllables
      (cp >= 0xF900 && cp <= 0xFAFF) ||   // CJK Compatibility Ideographs
      (cp >= 0xFE10 && cp <= 0xFE19) ||   // Vertical Forms
      (cp >= 0xFE30 && cp <= 0xFE6F) ||   // CJK Compatibility Forms
      (cp >= 0xFF00 && cp <= 0xFF60) ||   // Fullwidth Latin / Katakana
      (cp >= 0xFFE0 && cp <= 0xFFE6) ||   // Fullwidth Signs
      (cp >= 0x20000 && cp <= 0x2A6DF) || // CJK Extension B
      (cp >= 0x2A700 && cp <= 0x2CEAF)    // CJK Extension C/D
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Pad string to visual width (terminal columns), like String.padEnd but CJK-aware.
 * If visualWidth(str) >= targetWidth, returns str unchanged (no truncation).
 * @param {string} str
 * @param {number} targetWidth
 * @returns {string}
 */
export function padEndVisual(str, targetWidth) {
  const current = visualWidth(str);
  if (current >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - current);
}

/**
 * Output data as JSON to stdout.
 * @param {*} data
 */
export function printJson(data) {
  process.stdout.write(JSON.stringify(data) + '\n');
}

/**
 * Output error to stderr.
 * In jsonMode: {"error":"message","code":"ERROR_CODE"}
 * In normal mode: "Error [CODE]: message"
 * @param {string} code - ERROR_CODE value
 * @param {string} message - human-readable description
 * @param {boolean} jsonMode
 */
export function printError(code, message, jsonMode) {
  if (jsonMode) {
    process.stderr.write(JSON.stringify({ error: message, code }) + '\n');
  } else {
    process.stderr.write(`Error [${code}]: ${message}\n`);
  }
}
