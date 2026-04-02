// test/wi-update.test.js
// Tests for Story 2-5: wi update command (API layer)
// Covers: updateWorkitem request body fields, sprint field name contract, getWorkitem for JSON output

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makeWorkitem } from './setup.js';

describe('wi update: updateWorkitem API layer', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('sprint 字段使用 "sprint" 键（非 sprintId）', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: makeWorkitem() }));

    // 命令层已修复：fields.sprint = opts.sprint（非 fields.sprintId）
    await api.updateWorkitem(client, 'org1', 'wi-1', { sprint: 'sprint-abc' });

    const body = client.put.mock.calls[0].arguments[1];
    assert.ok('sprint' in body, 'body 应含 sprint 键');
    assert.equal(body.sprint, 'sprint-abc');
    assert.ok(!('sprintId' in body), 'body 不应含 sprintId 键');
  });

  test('status 字段正确传入请求体', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: makeWorkitem() }));

    await api.updateWorkitem(client, 'org1', 'wi-1', { status: 'status-done' });

    const body = client.put.mock.calls[0].arguments[1];
    assert.equal(body.status, 'status-done');
  });

  test('assignedTo 字段正确传入请求体', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: makeWorkitem() }));

    await api.updateWorkitem(client, 'org1', 'wi-1', { assignedTo: 'user-xyz' });

    const body = client.put.mock.calls[0].arguments[1];
    assert.equal(body.assignedTo, 'user-xyz');
  });

  test('PUT 请求使用正确的 URL（含 orgId 和 workitemId）', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: makeWorkitem() }));

    await api.updateWorkitem(client, 'myOrg', 'wi-update-uuid', { status: 'closed' });

    const url = client.put.mock.calls[0].arguments[0];
    assert.ok(url.includes('myOrg'), 'URL 应含 orgId');
    assert.ok(url.includes('wi-update-uuid'), 'URL 应含 workitemId');
    assert.ok(url.includes('/workitems/'), 'URL 应匹配 workitems 端点');
  });
});

describe('wi update: getWorkitem（JSON 模式返回完整工作项）', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('更新后调用 getWorkitem 获取最新工作项数据', async () => {
    const updatedItem = makeWorkitem({ id: 'wi-2', status: 'done', subject: 'Updated Title' });
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: {} }));    // updateWorkitem 无返回
    mock.method(client, 'get', async () => ({ data: updatedItem }));

    // 模拟 JSON 模式流程：先 update，再 getWorkitem
    await api.updateWorkitem(client, 'org1', 'wi-2', { status: 'done' });
    const result = await api.getWorkitem(client, 'org1', 'wi-2');

    assert.equal(result.id, 'wi-2');
    assert.equal(result.status, 'done');
    assert.equal(result.subject, 'Updated Title');
    assert.equal(client.put.mock.calls.length, 1, 'updateWorkitem 被调用一次');
    assert.equal(client.get.mock.calls.length, 1, 'getWorkitem 被调用一次');
  });

  test('getWorkitem GET URL 正确（与 updateWorkitem 使用相同的 workitemId）', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: {} }));
    mock.method(client, 'get', async () => ({ data: makeWorkitem({ id: 'wi-3' }) }));

    await api.updateWorkitem(client, 'org1', 'wi-3', { assignedTo: 'user-1' });
    await api.getWorkitem(client, 'org1', 'wi-3');

    const getUrl = client.get.mock.calls[0].arguments[0];
    assert.ok(getUrl.includes('wi-3'), 'GET URL 应含更新的 workitemId');
  });
});

describe('wi update: resolveWorkitemId（序列号支持，AC #2）', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('序列号格式（GJBL-1）通过 searchWorkitems 解析为 UUID', async () => {
    const fakeItem = makeWorkitem({ id: 'resolved-wi-uuid', serialNumber: 'GJBL-1' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: [fakeItem] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1');
    assert.equal(result, 'resolved-wi-uuid');
    assert.equal(client.post.mock.calls.length, 1, '应调用 searchWorkitems 一次');
  });

  test('UUID 格式直接返回，不调用 API', async () => {
    const client = createMockClient();
    const spy = mock.method(client, 'post', async () => { throw new Error('should not call'); });

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'wi-uuid-direct');
    assert.equal(result, 'wi-uuid-direct');
    assert.equal(spy.mock.calls.length, 0);
  });
});
