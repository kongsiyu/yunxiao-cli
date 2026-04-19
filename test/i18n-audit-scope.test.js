import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Story 11.1 i18n audit rollout scope guardrails', () => {
  test('audit artifact locks the required v1.2.0 rollout commands', () => {
    const story = read('_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md');

    for (const command of [
      '`auth`',
      '`whoami`',
      '`project list`',
      '`wi list/view/update`',
      '`sprint list/view`',
    ]) {
      assert.match(story, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('audit artifact preserves machine-contract guardrails', () => {
    const story = read('_bmad-output/implementation-artifacts/11-1-i18n-audit-rollout-scope.md');

    for (const required of [
      '字段名保持英文',
      'stdout 纯 JSON',
      'stderr',
      'ERROR_CODE',
      '不翻译',
      'machine contract',
    ]) {
      assert.match(story, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
