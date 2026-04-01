// test/api.test.js - Unit tests for src/api.js
// Mock strategy: Strategy A — mock client.post/get/put/delete on createMockClient()
// This exercises real api.js code paths with controlled HTTP stubs.
// See test/mock-example.test.js and test/setup.js for full strategy documentation.

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage, makeWorkitem, makeProject, makeSprint } from './setup.js';

// Helper: create a fake 401 axios error
function make401() {
  const err = new Error('Unauthorized');
  err.response = { status: 401 };
  return err;
}

// ---------------------------------------------------------------------------
// searchProjects
// ---------------------------------------------------------------------------
describe('searchProjects', () => {
  afterEach(() => mock.restoreAll());

  test('返回分页结果', async () => {
    const proj = makeProject({ id: 'p1', name: 'My Project' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([proj]) }));

    const result = await api.searchProjects(client, 'org1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'p1');
  });

  test('name 过滤器写入 body.conditions', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await api.searchProjects(client, 'org1', { name: 'test' });

    const body = client.post.mock.calls[0].arguments[1];
    assert.ok(body.conditions, 'conditions 字段应存在');
    assert.ok(body.conditions.includes('test'), 'conditions 应包含 name 关键词');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw make401(); });

    await assert.rejects(
      () => api.searchProjects(client, 'org1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });

  test('函数返回 res.data（解包 axios wrapper）', async () => {
    const fakeData = makePage([makeProject()]);
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: fakeData, status: 200, headers: {} }));

    const result = await api.searchProjects(client, 'org1', {});

    assert.deepEqual(result, fakeData);
    assert.equal(result.status, undefined, '不应包含 axios response 的 status 字段');
  });
});

// ---------------------------------------------------------------------------
// getProject
// ---------------------------------------------------------------------------
describe('getProject', () => {
  afterEach(() => mock.restoreAll());

  test('返回项目对象', async () => {
    const proj = makeProject({ id: 'p2', name: 'Project B' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: proj }));

    const result = await api.getProject(client, 'org1', 'p2');

    assert.equal(result.id, 'p2');
    assert.equal(result.name, 'Project B');
  });

  test('URL 包含 orgId 和 projectId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makeProject() }));

    await api.getProject(client, 'myOrg', 'myProj');

    const url = client.get.mock.calls[0].arguments[0];
    assert.ok(url.includes('myOrg'), 'URL 应包含 orgId');
    assert.ok(url.includes('myProj'), 'URL 应包含 projectId');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.getProject(client, 'org1', 'p1'),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// searchWorkitems
// ---------------------------------------------------------------------------
describe('searchWorkitems', () => {
  afterEach(() => mock.restoreAll());

  test('返回分页结果（无过滤条件）', async () => {
    const item = makeWorkitem({ id: 'wi-1', subject: 'Test' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([item]) }));

    const result = await api.searchWorkitems(client, 'org1', 'sp1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'wi-1');
  });

  test('body 包含 spaceId 和默认字段', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await api.searchWorkitems(client, 'org1', 'mySpace', {});

    const body = client.post.mock.calls[0].arguments[1];
    assert.equal(body.spaceId, 'mySpace');
    assert.ok(body.category, 'category 应有默认值');
    assert.ok(body.page, 'page 应有默认值');
    assert.ok(body.perPage, 'perPage 应有默认值');
  });

  test('status 过滤器写入 body.conditions', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await api.searchWorkitems(client, 'org1', 'sp1', { status: 'open' });

    const body = client.post.mock.calls[0].arguments[1];
    assert.ok(body.conditions, 'conditions 应存在');
    assert.ok(body.conditions.includes('open'), 'conditions 应包含 status 值');
  });

  test('subject 过滤器写入 body.conditions', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await api.searchWorkitems(client, 'org1', 'sp1', { subject: '登录' });

    const body = client.post.mock.calls[0].arguments[1];
    assert.ok(body.conditions.includes('登录'), '应包含 subject 值');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw make401(); });

    await assert.rejects(
      () => api.searchWorkitems(client, 'org1', 'sp1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// getWorkitem
// ---------------------------------------------------------------------------
describe('getWorkitem', () => {
  afterEach(() => mock.restoreAll());

  test('返回工作项对象', async () => {
    const item = makeWorkitem({ id: 'wi-42', subject: '修复 BUG' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: item }));

    const result = await api.getWorkitem(client, 'org1', 'wi-42');

    assert.equal(result.id, 'wi-42');
    assert.equal(result.subject, '修复 BUG');
  });

  test('URL 包含 workitemId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makeWorkitem() }));

    await api.getWorkitem(client, 'org1', 'target-id');

    const url = client.get.mock.calls[0].arguments[0];
    assert.ok(url.includes('target-id'), 'URL 应包含 workitemId');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.getWorkitem(client, 'org1', 'wi-1'),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// createWorkitem
// ---------------------------------------------------------------------------
describe('createWorkitem', () => {
  afterEach(() => mock.restoreAll());

  test('返回新建工作项', async () => {
    const created = makeWorkitem({ id: 'wi-new', subject: '新需求' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: created }));

    const result = await api.createWorkitem(client, 'org1', { subject: '新需求' });

    assert.equal(result.id, 'wi-new');
    assert.equal(result.subject, '新需求');
  });

  test('data 作为请求体发送', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makeWorkitem() }));
    const payload = { subject: 'Test', category: 'Req' };

    await api.createWorkitem(client, 'org1', payload);

    const body = client.post.mock.calls[0].arguments[1];
    assert.deepEqual(body, payload);
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw make401(); });

    await assert.rejects(
      () => api.createWorkitem(client, 'org1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// updateWorkitem
// ---------------------------------------------------------------------------
describe('updateWorkitem', () => {
  afterEach(() => mock.restoreAll());

  test('返回更新后的工作项', async () => {
    const updated = makeWorkitem({ id: 'wi-1', status: 'closed' });
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: updated }));

    const result = await api.updateWorkitem(client, 'org1', 'wi-1', { status: 'closed' });

    assert.equal(result.status, 'closed');
  });

  test('fields 作为请求体发送', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => ({ data: makeWorkitem() }));
    const fields = { subject: 'Updated title', priority: 'high' };

    await api.updateWorkitem(client, 'org1', 'wi-1', fields);

    const body = client.put.mock.calls[0].arguments[1];
    assert.deepEqual(body, fields);
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'put', async () => { throw make401(); });

    await assert.rejects(
      () => api.updateWorkitem(client, 'org1', 'wi-1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------
describe('addComment', () => {
  afterEach(() => mock.restoreAll());

  test('返回新建评论', async () => {
    const comment = { id: 'c-1', content: 'LGTM' };
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: comment }));

    const result = await api.addComment(client, 'org1', 'wi-1', 'LGTM');

    assert.equal(result.id, 'c-1');
    assert.equal(result.content, 'LGTM');
  });

  test('content 包装为 { content } 发送', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: {} }));

    await api.addComment(client, 'org1', 'wi-1', 'Hello World');

    const body = client.post.mock.calls[0].arguments[1];
    assert.deepEqual(body, { content: 'Hello World' });
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw make401(); });

    await assert.rejects(
      () => api.addComment(client, 'org1', 'wi-1', 'text'),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// listComments
// ---------------------------------------------------------------------------
describe('listComments', () => {
  afterEach(() => mock.restoreAll());

  test('返回评论分页列表', async () => {
    const comments = makePage([{ id: 'c-1', content: '已确认' }]);
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: comments }));

    const result = await api.listComments(client, 'org1', 'wi-1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'c-1');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.listComments(client, 'org1', 'wi-1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// deleteWorkitem
// ---------------------------------------------------------------------------
describe('deleteWorkitem', () => {
  afterEach(() => mock.restoreAll());

  test('成功删除时不抛出异常', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => ({ data: {} }));

    await assert.doesNotReject(() => api.deleteWorkitem(client, 'org1', 'wi-1'));
    assert.equal(client.delete.mock.calls.length, 1);
  });

  test('URL 包含 workitemId', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => ({}));

    await api.deleteWorkitem(client, 'org1', 'target-wi');

    const url = client.delete.mock.calls[0].arguments[0];
    assert.ok(url.includes('target-wi'), 'URL 应包含 workitemId');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => { throw make401(); });

    await assert.rejects(
      () => api.deleteWorkitem(client, 'org1', 'wi-1'),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// getWorkitemTypes
// ---------------------------------------------------------------------------
describe('getWorkitemTypes', () => {
  afterEach(() => mock.restoreAll());

  test('返回工作项类型列表', async () => {
    const types = [{ id: 't-1', name: '需求' }, { id: 't-2', name: '缺陷' }];
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: types }));

    const result = await api.getWorkitemTypes(client, 'org1', 'proj1');

    assert.equal(result.length, 2);
    assert.equal(result[0].name, '需求');
  });

  test('默认 category 为 Req', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.getWorkitemTypes(client, 'org1', 'proj1');

    const params = client.get.mock.calls[0].arguments[1]?.params;
    assert.equal(params?.category, 'Req');
  });

  test('可传入自定义 category', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.getWorkitemTypes(client, 'org1', 'proj1', 'Bug');

    const params = client.get.mock.calls[0].arguments[1]?.params;
    assert.equal(params?.category, 'Bug');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.getWorkitemTypes(client, 'org1', 'proj1'),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// listSprints
// ---------------------------------------------------------------------------
describe('listSprints', () => {
  afterEach(() => mock.restoreAll());

  test('返回 Sprint 分页列表', async () => {
    const sprint = makeSprint({ id: 's-1', name: 'Sprint 2026-Q1' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([sprint]) }));

    const result = await api.listSprints(client, 'org1', 'proj1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].name, 'Sprint 2026-Q1');
  });

  test('params 包含 spaceId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePage([]) }));

    await api.listSprints(client, 'org1', 'myProj', {});

    const params = client.get.mock.calls[0].arguments[1]?.params;
    assert.equal(params?.spaceId, 'myProj');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.listSprints(client, 'org1', 'proj1', {}),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------
describe('getCurrentUser', () => {
  afterEach(() => mock.restoreAll());

  test('返回当前用户信息', async () => {
    const user = { id: 'u-1', name: 'Sue', email: 'sue@example.com' };
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: user }));

    const result = await api.getCurrentUser(client);

    assert.equal(result.id, 'u-1');
    assert.equal(result.name, 'Sue');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.getCurrentUser(client),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// getOrganizations
// ---------------------------------------------------------------------------
describe('getOrganizations', () => {
  afterEach(() => mock.restoreAll());

  test('返回组织列表', async () => {
    const orgs = [{ id: 'o-1', name: 'Org One' }, { id: 'o-2', name: 'Org Two' }];
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: orgs }));

    const result = await api.getOrganizations(client);

    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'Org One');
  });

  test('401 抛出 AUTH_FAILED', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => { throw make401(); });

    await assert.rejects(
      () => api.getOrganizations(client),
      (err) => { assert.equal(err.code, 'AUTH_FAILED'); return true; }
    );
  });
});

// ---------------------------------------------------------------------------
// resolveWorkitemId
// ---------------------------------------------------------------------------
describe('resolveWorkitemId', () => {
  afterEach(() => mock.restoreAll());

  test('序列号路径：找到匹配项返回 UUID', async () => {
    const item = makeWorkitem({ id: 'uuid-target', serialNumber: 'GJBL-42' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([item]) }));

    const id = await api.resolveWorkitemId(client, 'org1', 'sp1', 'GJBL-42');

    assert.equal(id, 'uuid-target');
  });

  test('序列号大小写不敏感', async () => {
    const item = makeWorkitem({ id: 'uuid-lower', serialNumber: 'GJBL-1' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([item]) }));

    const id = await api.resolveWorkitemId(client, 'org1', 'sp1', 'gjbl-1');

    assert.equal(id, 'uuid-lower');
  });

  test('UUID 路径：直接返回，不发起 HTTP 请求', async () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const client = createMockClient();
    // post 不应被调用；createMockClient 默认 stub 返回 { data: {} }

    const id = await api.resolveWorkitemId(client, 'org1', 'sp1', uuid);

    assert.equal(id, uuid);
    assert.equal(client.post.mock?.calls?.length ?? 0, 0);
  });

  test('null/undefined 输入返回 null', async () => {
    const client = createMockClient();

    assert.equal(await api.resolveWorkitemId(client, 'org1', 'sp1', null), null);
    assert.equal(await api.resolveWorkitemId(client, 'org1', 'sp1', undefined), null);
  });

  test('序列号未找到：抛出 NOT_FOUND', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await assert.rejects(
      () => api.resolveWorkitemId(client, 'org1', 'sp1', 'GJBL-999'),
      (err) => { assert.equal(err.code, 'NOT_FOUND'); return true; }
    );
  });

  test('searchWorkitems 结果正确解包（response.data 而非 response）', async () => {
    // 验证 resolveWorkitemId 从 response.data 中查找，而非直接对 response 调用 .find()
    const item = makeWorkitem({ id: 'uuid-wrap', serialNumber: 'TEST-1' });
    // makePage 返回 { data: [item], total: 1 }，searchWorkitems 返回此对象
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([item]) }));

    // 若解包有误会抛出 TypeError，此处应正常返回
    const id = await api.resolveWorkitemId(client, 'org1', 'sp1', 'TEST-1');
    assert.equal(id, 'uuid-wrap');
  });
});
