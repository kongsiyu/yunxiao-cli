// test/pipeline.test.js
// Tests for listPipelines API function (Story 5-1)
// Uses Strategy A: mock client.get at HTTP layer

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient } from './setup.js';

function makePipeline(overrides = {}) {
  return {
    pipelineId: 'pipe-001',
    name: 'Test Pipeline',
    ...overrides,
  };
}

describe('listPipelines API', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('calls URL containing orgId and pipelines', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listPipelines(client, 'myOrg', {});

    const call = client.get.mock.calls[0];
    const url = call.arguments[0];
    assert.ok(url.includes('myOrg'), 'URL should contain orgId');
    assert.ok(url.includes('pipelines'), 'URL should contain pipelines');
  });

  test('passes maxResults param (default 20)', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listPipelines(client, 'org1', {});

    const call = client.get.mock.calls[0];
    const params = call.arguments[1]?.params;
    assert.equal(params.maxResults, 20);
  });

  test('passes custom maxResults', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listPipelines(client, 'org1', { maxResults: 5 });

    const call = client.get.mock.calls[0];
    const params = call.arguments[1]?.params;
    assert.equal(params.maxResults, 5);
  });

  test('returns data from response', async () => {
    const fakePipeline = makePipeline({ pipelineId: 'p-1', name: 'Deploy Pipeline' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [fakePipeline] }));

    const result = await api.listPipelines(client, 'org1', {});

    assert.equal(result.length, 1);
    assert.equal(result[0].pipelineId, 'p-1');
    assert.equal(result[0].name, 'Deploy Pipeline');
  });

  test('returns empty array when no pipelines', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    const result = await api.listPipelines(client, 'org1', {});

    assert.deepEqual(result, []);
  });

  test('passes nextToken when provided', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listPipelines(client, 'org1', { nextToken: 'token-xyz' });

    const call = client.get.mock.calls[0];
    const params = call.arguments[1]?.params;
    assert.equal(params.nextToken, 'token-xyz');
  });

  test('does not include nextToken param when not provided', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [] }));

    await api.listPipelines(client, 'org1', {});

    const call = client.get.mock.calls[0];
    const params = call.arguments[1]?.params;
    assert.ok(!('nextToken' in params), 'nextToken should not be in params');
  });
});
