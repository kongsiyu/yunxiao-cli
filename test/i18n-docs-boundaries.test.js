import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Story 11.3 README and SKILL i18n boundary guardrails', () => {
  test('README states the exact v1.2.0 localized command scope and deferred commands', () => {
    const readme = read('README.md');

    for (const required of [
      '`auth`、`whoami`、`project list`、`wi list/view/update`、`sprint list/view`',
      '`project view`、`wi create/delete/comment/comments/types`、`user list/search`、`status list`、`pipeline*`、`repo*`、`mr*`',
      '不表示全 CLI 已完成中文化',
    ]) {
      assert.match(readme, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('README preserves machine-contract documentation', () => {
    const readme = read('README.md');

    for (const required of [
      'stdout 只输出纯 JSON',
      'stderr',
      'ERROR_CODE',
      'JSON key',
      'schema 保持英文',
      '只有本文明确列出 `--json` schema 的命令才承诺稳定 JSON contract',
    ]) {
      assert.match(readme, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('SKILL aligns documented json schemas with current implementation boundaries', () => {
    const skill = read('SKILL.md');

    for (const required of [
      '"projects"',
      '"projectId"',
      '"typeId"',
      '"displayName"',
      '`whoami`、`auth status`、`auth logout` 当前没有稳定的 `--json` contract',
      '只有下文明确给出 schema 的命令才承诺稳定 JSON contract',
    ]) {
      assert.match(skill, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
