import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function findSection(content, marker) {
  const start = content.indexOf(`### ${marker}`);
  assert.notEqual(start, -1, `Missing ledger section for ${marker}`);

  const rest = content.slice(start + 4);
  const nextHeading = rest.search(/\n#{2,3} /);
  return content.slice(start, nextHeading === -1 ? undefined : start + 4 + nextHeading);
}

describe('Codeup evidence ledger', () => {
  test('ledger defines mandatory evidence fields and evidence levels', () => {
    const ledger = read('_bmad-output/research/codeup-evidence-ledger.md');

    for (const required of [
      'endpoint',
      'auth',
      '必填字段',
      '返回关键字段',
      '验证方法',
      'evidence level',
      '风险等级',
      '后续 story 影响',
      'document-only',
      'script-ready',
      'live-tested',
    ]) {
      assert.match(ledger, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('known shipped Codeup APIs are represented with implementation-backed evidence', () => {
    const ledger = read('_bmad-output/research/codeup-evidence-ledger.md');

    for (const marker of [
      'repo list',
      'repo view',
      'mr list',
      'mr view',
      'mr create',
    ]) {
      const section = findSection(ledger, marker);
      assert.match(section, /script-ready/);
      assert.match(section, /src\/codeup-api\.js/);
      assert.match(section, /test\/repo\.test\.js|test\/codeup-api\.test\.js/);
    }
  });

  test('future v1.3.0 candidates are present but not treated as development-ready', () => {
    const ledger = read('_bmad-output/research/codeup-evidence-ledger.md');

    for (const marker of [
      'mr merge',
      'mr comment',
      'mr approval',
      'mr diff',
      'mr commits',
      'mr discussions',
    ]) {
      const section = findSection(ledger, marker);
      assert.match(section, /document-only|script-ready/);
      assert.doesNotMatch(section, /live-tested/);
      assert.match(section, /spike|live verification/);
      assert.doesNotMatch(section, /ready-for-dev/i);
    }
  });
});
