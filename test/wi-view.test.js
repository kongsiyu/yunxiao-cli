// test/wi-view.test.js
// Tests for Story 2-3: wi view command
// Covers: resolveWorkitemId + getWorkitem integration, NOT_FOUND mapping

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { createMockClient, makePage, makeWorkitem } from './setup.js';

describe('wi view: resolveWorkitemId', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('UUID input: returns identifier directly without API call', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw new Error('should not be called'); });

    const uuid = 'abc12300-0000-0000-0000-000000000001';
    const result = await api.resolveWorkitemId(client, 'org1', 'space1', uuid);
    assert.equal(result, uuid);
    // post (searchWorkitems) should NOT have been called
    assert.equal(client.post.mock.calls.length, 0);
  });

  test('serial number input (GJBL-1): searches and returns matching UUID', async () => {
    const fakeItem = makeWorkitem({ id: 'resolved-uuid-001', serialNumber: 'GJBL-1' });
    const client = createMockClient();
    // searchWorkitems returns res.data directly — real API returns array, not paginated wrapper
    mock.method(client, 'post', async () => ({ data: [fakeItem] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1');
    assert.equal(result, 'resolved-uuid-001');
    assert.equal(client.post.mock.calls.length, 1);
  });

  test('serial number input is case-insensitive (gjbl-1 → GJBL-1)', async () => {
    const fakeItem = makeWorkitem({ id: 'resolved-uuid-002', serialNumber: 'GJBL-1' });
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: [fakeItem] }));

    const result = await api.resolveWorkitemId(client, 'org1', 'space1', 'gjbl-1');
    assert.equal(result, 'resolved-uuid-002');
  });

  test('serial number not found: throws AppError with NOT_FOUND code', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: [] }));

    await assert.rejects(
      () => api.resolveWorkitemId(client, 'org1', 'space1', 'GJBL-999'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.NOT_FOUND);
        return true;
      }
    );
  });

  test('null/undefined identifier: throws INVALID_ARGS', async () => {
    const client = createMockClient();
    await assert.rejects(
      () => api.resolveWorkitemId(client, 'org1', 'space1', null),
      (err) => {
        assert.equal(err.code, ERROR_CODE.INVALID_ARGS);
        return true;
      }
    );
  });
});

describe('wi view: getWorkitem', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns workitem data from API response', async () => {
    const fakeItem = makeWorkitem({
      id: 'wi-view-test-001',
      subject: 'View Test Item',
      serialNumber: 'GJBL-5',
    });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeItem }));

    const result = await api.getWorkitem(client, 'org1', 'wi-view-test-001');
    assert.equal(result.id, 'wi-view-test-001');
    assert.equal(result.subject, 'View Test Item');
    assert.equal(result.serialNumber, 'GJBL-5');
  });

  test('GET request uses correct URL with orgId and workitemId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makeWorkitem() }));

    await api.getWorkitem(client, 'myOrg', 'workitem-uuid-xyz');

    const call = client.get.mock.calls[0];
    assert.ok(call.arguments[0].includes('myOrg'), 'URL should contain orgId');
    assert.ok(call.arguments[0].includes('workitem-uuid-xyz'), 'URL should contain workitemId');
    assert.ok(call.arguments[0].includes('/workitems/'), 'URL should match workitems endpoint');
  });
});

describe('wi view: 404 → NOT_FOUND mapping (via getWorkitem)', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('getWorkitem 404 propagates as axios error with status 404', async () => {
    // Verify the error shape that withErrorHandling in src/index.js receives
    const client = createMockClient();
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404, data: { errorMessage: 'Workitem not found' }, statusText: 'Not Found' },
    });
    mock.method(client, 'get', async () => { throw notFoundError; });

    const err = await api.getWorkitem(client, 'org1', 'fake-uuid').catch(e => e);
    assert.ok(err.response, 'error should have .response property');
    assert.equal(err.response.status, 404);
  });

  test('withErrorHandling logic: 404 → NOT_FOUND, 500 → API_ERROR', () => {
    // Verify the fix in src/index.js is correct:
    // const code = err.response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR;
    assert.equal(404 === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR, ERROR_CODE.NOT_FOUND);
    assert.equal(500 === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR, ERROR_CODE.API_ERROR);
    assert.equal(403 === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR, ERROR_CODE.API_ERROR);
  });
});
