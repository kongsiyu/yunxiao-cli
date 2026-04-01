// test/user.test.js - Tests for listProjectMembers API and user commands
import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient } from './setup.js';

function makeMember(overrides = {}) {
  return {
    userId: 'user-001',
    userName: '张三',
    roleId: 'role-001',
    roleName: 'Developer',
    ...overrides,
  };
}

describe('listProjectMembers API (Strategy A: mock client.get)', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns member list on success', async () => {
    const fakeMember = makeMember();
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [fakeMember] }));

    const result = await api.listProjectMembers(client, 'org1', 'proj1', {});

    assert.ok(Array.isArray(result), 'result should be an array');
    assert.equal(result.length, 1);
    assert.equal(result[0].userId, 'user-001');
    assert.equal(result[0].userName, '张三');
  });

  test('passes name filter as query param', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listProjectMembers(client, 'org1', 'proj1', { name: '张三' });

    const call = client.get.mock.calls[0];
    assert.equal(call.arguments[1].params.name, '张三', 'name param should be passed');
  });

  test('returns empty array when no members match', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    const result = await api.listProjectMembers(client, 'org1', 'proj1', { name: '不存在的人' });

    assert.ok(Array.isArray(result));
    assert.equal(result.length, 0);
  });

  test('uses correct API path with orgId and projectId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listProjectMembers(client, 'myOrg', 'myProject', {});

    const call = client.get.mock.calls[0];
    const url = call.arguments[0];
    assert.ok(url.includes('myOrg'), 'URL should contain orgId');
    assert.ok(url.includes('myProject'), 'URL should contain projectId');
    assert.ok(url.includes('members'), 'URL should end with members');
  });

  test('does not pass name param when not provided', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listProjectMembers(client, 'org1', 'proj1', {});

    const call = client.get.mock.calls[0];
    assert.equal(call.arguments[1].params.name, undefined, 'name param should be absent');
  });
});

describe('user list/search JSON output shape', () => {
  test('normalized member has userId and name fields', () => {
    const raw = makeMember({ userId: 'u1', userName: '张三' });
    const normalized = { userId: raw.userId || raw.id, name: raw.userName || raw.name, roleName: raw.roleName };
    assert.equal(normalized.userId, 'u1');
    assert.equal(normalized.name, '张三');
    assert.ok(!('userName' in normalized), 'normalized output should not have userName key');
  });

  test('user list json output has members array and total', () => {
    const members = [
      { userId: 'u1', name: '张三', roleName: 'Dev' },
      { userId: 'u2', name: '李四', roleName: 'PM' },
    ];
    const output = { members, total: members.length };
    assert.ok(Array.isArray(output.members));
    assert.equal(output.total, 2);
    assert.equal(output.members[0].userId, 'u1');
    assert.equal(output.members[0].name, '张三');
  });

  test('user search empty result has members=[] and total=0', () => {
    const output = { members: [], total: 0 };
    assert.deepEqual(output.members, []);
    assert.equal(output.total, 0);
  });
});
