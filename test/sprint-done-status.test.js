import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isSprintWorkitemDone } from '../src/commands/sprint.js';

describe('isSprintWorkitemDone', () => {
  test('优先级为 done(boolean) > stage(enum) > nameEn(exact)', () => {
    assert.equal(isSprintWorkitemDone({ done: true, stage: 'DOING', nameEn: 'Doing' }), true);
    assert.equal(isSprintWorkitemDone({ done: false, stage: 'DONE', nameEn: 'Done' }), false);
    assert.equal(isSprintWorkitemDone({ stage: 'DONE', nameEn: 'Doing' }), true);
    assert.equal(isSprintWorkitemDone({ nameEn: 'Done' }), true);
  });

  test('不再使用 name 中文模糊匹配和字符串 status 降级', () => {
    assert.equal(isSprintWorkitemDone({ name: '已完成' }), false);
    assert.equal(isSprintWorkitemDone('DONE'), false);
    assert.equal(isSprintWorkitemDone({ nameEn: 'Undone' }), false);
    assert.equal(isSprintWorkitemDone({ nameEn: 'in-done' }), false);
    assert.equal(isSprintWorkitemDone({ nameEn: ' Done ' }), true);
  });

  test('相同输入多次调用结果一致', () => {
    const status = { done: false, stage: 'DOING', nameEn: 'Done' };
    const first = isSprintWorkitemDone(status);
    const second = isSprintWorkitemDone(status);
    assert.equal(first, second);
    assert.equal(first, false);
  });
});
