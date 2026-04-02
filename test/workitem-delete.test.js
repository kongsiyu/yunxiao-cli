// test/workitem-delete.test.js
// Unit tests for deleteWorkitem API function and resolveWorkitemId NOT_FOUND case.
// Uses Strategy A: mock at the HTTP client layer (see test/setup.js).

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage, makeWorkitem } from './setup.js';

describe('deleteWorkitem API', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('calls DELETE on the correct URL', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => ({ data: {} }));

    await api.deleteWorkitem(client, 'org1', 'wi-abc123');

    assert.equal(client.delete.mock.calls.length, 1);
    const url = client.delete.mock.calls[0].arguments[0];
    assert.ok(url.includes('org1'), 'URL should contain orgId');
    assert.ok(url.includes('wi-abc123'), 'URL should contain workitemId');
    assert.ok(url.includes('workitems'), 'URL should reference workitems resource');
  });

  test('resolves without error on successful deletion', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => ({ data: {} }));

    await assert.doesNotReject(() => api.deleteWorkitem(client, 'org1', 'wi-xyz'));
  });

  test('propagates HTTP error from client.delete', async () => {
    const client = createMockClient();
    mock.method(client, 'delete', async () => { throw new Error('HTTP 403 Forbidden'); });

    await assert.rejects(
      () => api.deleteWorkitem(client, 'org1', 'wi-xyz'),
      /403 Forbidden/
    );
  });
});

describe('resolveWorkitemId — NOT_FOUND for wi delete scenario', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('throws NOT_FOUND AppError when serial number has no match', async () => {
    const client = createMockClient();
    // Real API returns an array directly; res.data = []
    mock.method(client, 'post', async () => ({ data: [] }));

    const err = await api.resolveWorkitemId(client, 'org1', 'space1', 'GJBL-999')
      .then(() => null)
      .catch(e => e);

    assert.ok(err !== null, 'Should reject');
    assert.ok(err.message.includes('GJBL-999'), 'Error message should contain the identifier');
    assert.equal(err.code, 'NOT_FOUND', 'Should be a NOT_FOUND AppError');
  });

  test('returns UUID directly without API call', async () => {
    const client = createMockClient();
    const spy = mock.method(client, 'post', async () => ({ data: [] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'abc123-uuid-no-prefix');

    assert.equal(result, 'abc123-uuid-no-prefix');
    assert.equal(spy.mock.calls.length, 0, 'Should not call API for UUID format');
  });

  test('resolves serial number when match is found', async () => {
    const client = createMockClient();
    const fakeItem = makeWorkitem({ id: 'wi-resolved-id', serialNumber: 'GJBL-42' });
    // Real API returns array directly
    mock.method(client, 'post', async () => ({ data: [fakeItem] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'GJBL-42');

    assert.equal(result, 'wi-resolved-id');
  });
});
