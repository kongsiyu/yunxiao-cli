// src/output.js - Centralized output functions for --json mode support

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
