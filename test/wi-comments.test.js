// test/wi-comments.test.js
// Unit tests for listComments API function and wi comments command behaviour.
// Uses Strategy A: mock at the HTTP client layer (see test/setup.js).

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage, makeWorkitem } from './setup.js';

// ---------------------------------------------------------------------------
// listComments API
// ---------------------------------------------------------------------------
describe('listComments API', () => {
  afterEach(() => mock.restoreAll());

  test('GET 正确 URL（含 orgId 和 workitemId）', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([]) }));

    await api.listComments(client, 'org1', 'wi-abc', {});

    assert.equal(client.get.mock.calls.length, 1);
    const url = client.get.mock.calls[0].arguments[0];
    assert.ok(url.includes('org1'), 'URL 应含 orgId');
    assert.ok(url.includes('wi-abc'), 'URL 应含 workitemId');
    assert.ok(url.includes('comments'), 'URL 应引用 comments 资源');
  });

  test('传递 page 和 perPage 查询参数', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([]) }));

    await api.listComments(client, 'org1', 'wi-1', { page: 2, perPage: 10 });

    const params = client.get.mock.calls[0].arguments[1]?.params;
    assert.equal(params?.page, 2);
    assert.equal(params?.perPage, 10);
  });

  test('返回分页对象（含 data 数组和 total）', async () => {
    const comments = [{ id: 'c-1', content: '评论内容' }];
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage(comments) }));

    const result = await api.listComments(client, 'org1', 'wi-1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'c-1');
  });

  test('无评论时返回 total=0 的空分页', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([]) }));

    const result = await api.listComments(client, 'org1', 'wi-1', {});

    assert.equal(result.total, 0);
    assert.deepEqual(result.data, []);
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => {
      const err = new Error('Unauthorized');
      err.response = { status: 401 };
      throw err;
    });

    await assert.rejects(
      () => api.listComments(client, 'org1', 'wi-1', {}),
      (err) => {
        assert.equal(err.code, 'AUTH_FAILED');
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// resolveWorkitemId — used by wi comments for serial number lookup
// ---------------------------------------------------------------------------
describe('resolveWorkitemId — wi comments 场景', () => {
  afterEach(() => mock.restoreAll());

  test('序列号解析成功时返回 workitem ID', async () => {
    const client = createMockClient();
    const item = makeWorkitem({ id: 'wi-resolved', serialNumber: 'PROJ-10' });
    mock.method(client, 'post', async () => ({ data: [item] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'PROJ-10');

    assert.equal(result, 'wi-resolved');
  });

  test('UUID 格式直接返回，不触发 API 调用', async () => {
    const client = createMockClient();
    const spy = mock.method(client, 'post', async () => ({ data: [] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'uuid-1234-no-prefix');

    assert.equal(result, 'uuid-1234-no-prefix');
    assert.equal(spy.mock.calls.length, 0);
  });

  test('序列号不存在时抛出 NOT_FOUND', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: [] }));

    const err = await api.resolveWorkitemId(client, 'org1', 'space1', 'PROJ-999')
      .then(() => null)
      .catch(e => e);

    assert.ok(err !== null);
    assert.equal(err.code, 'NOT_FOUND');
    assert.ok(err.message.includes('PROJ-999'));
  });
});

// ---------------------------------------------------------------------------
// wi comments command — response unpacking (listComments paged envelope)
// ---------------------------------------------------------------------------
describe('listComments 响应解包', () => {
  afterEach(() => mock.restoreAll());

  test('data 数组正确从分页对象中提取', async () => {
    const client = createMockClient();
    const items = [
      { id: 'c-1', content: '第一条评论', creator: { name: '张三' }, gmtCreate: 1700000000000 },
      { id: 'c-2', content: '第二条评论', creator: { name: '李四' }, gmtCreate: 1700000001000 },
    ];
    mock.method(client, 'get', async () => ({ data: makePage(items) }));

    const raw = await api.listComments(client, 'org1', 'wi-1', {});
    const comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const total = raw?.total ?? comments.length;

    assert.equal(comments.length, 2);
    assert.equal(total, 2);
    assert.equal(comments[0].id, 'c-1');
    assert.equal(comments[1].id, 'c-2');
  });

  test('空响应时 data 为空数组，total 为 0', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([]) }));

    const raw = await api.listComments(client, 'org1', 'wi-1', {});
    const comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const total = raw?.total ?? comments.length;

    assert.equal(comments.length, 0);
    assert.equal(total, 0);
  });

  test('若 API 直接返回数组（兼容性），仍能正确处理', async () => {
    const client = createMockClient();
    const items = [{ id: 'c-1', content: '直接数组' }];
    // 若 API 直接返回数组（非分页对象）
    mock.method(client, 'get', async () => ({ data: items }));

    const raw = await api.listComments(client, 'org1', 'wi-1', {});
    const comments = Array.isArray(raw) ? raw : (raw?.data ?? []);

    assert.equal(comments.length, 1);
    assert.equal(comments[0].id, 'c-1');
  });
});
