// test/pipeline.test.js
// Tests for pipeline API functions: listPipelines (5-1) and getPipelineRun (5-3)
// Uses Strategy A: mock client.get at HTTP layer

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient } from './setup.js';

// Actual API fields: pipelineId (number), pipelineName (string), createTime, createAccountId
function makePipeline(overrides = {}) {
  return {
    pipelineId: 4001,
    pipelineName: 'Test Pipeline',
    createTime: 1700000000000,
    createAccountId: 'user-001',
    ...overrides,
  };
}

function makePipelineRun(overrides = {}) {
  return {
    pipelineRunId: 12345,
    pipelineId: 999,
    status: 'SUCCESS',
    triggerMode: 'MANUAL',
    startTime: 1700000000000,
    endTime: 1700000060000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// listPipelines API
// ---------------------------------------------------------------------------

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
    assert.ok(url.includes('flow'), 'URL should use flow API path');
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

  test('returns data from response with correct fields', async () => {
    const fakePipeline = makePipeline({ pipelineId: 4001, pipelineName: 'Deploy Pipeline' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: [fakePipeline] }));

    const result = await api.listPipelines(client, 'org1', {});

    assert.equal(result.length, 1);
    assert.equal(result[0].pipelineId, 4001);
    assert.equal(result[0].pipelineName, 'Deploy Pipeline');
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

// ---------------------------------------------------------------------------
// getPipelineRun API
// ---------------------------------------------------------------------------

describe('getPipelineRun API', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns run object on success', async () => {
    const fakeRun = makePipelineRun({ pipelineRunId: 42, status: 'SUCCESS' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeRun }));

    const result = await api.getPipelineRun(client, 'org1', 'pipe-1', '42');

    assert.equal(result.pipelineRunId, 42);
    assert.equal(result.status, 'SUCCESS');
    assert.equal(client.get.mock.calls.length, 1);
  });

  test('calls correct URL with orgId, pipelineId, runId', async () => {
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: makePipelineRun() }));

    await api.getPipelineRun(client, 'myOrg', 'pipe-99', 'run-77');

    const url = client.get.mock.calls[0].arguments[0];
    assert.ok(url.includes('myOrg'), 'URL should contain orgId');
    assert.ok(url.includes('pipe-99'), 'URL should contain pipelineId');
    assert.ok(url.includes('run-77'), 'URL should contain runId');
    assert.ok(url.includes('/flow/'), 'URL should use flow namespace');
  });

  test('returns RUNNING status for in-progress run', async () => {
    const fakeRun = makePipelineRun({ status: 'RUNNING', endTime: null });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeRun }));

    const result = await api.getPipelineRun(client, 'org1', 'pipe-1', '55');

    assert.equal(result.status, 'RUNNING');
    assert.equal(result.endTime, null);
  });

  test('returns FAIL status for failed run', async () => {
    const fakeRun = makePipelineRun({ status: 'FAIL' });
    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeRun }));

    const result = await api.getPipelineRun(client, 'org1', 'pipe-1', '66');

    assert.equal(result.status, 'FAIL');
  });

  test('propagates HTTP error from client.get', async () => {
    const client = createMockClient();
    const apiError = Object.assign(new Error('Not Found'), {
      response: { status: 404, data: { errorMessage: 'run not found' }, statusText: 'Not Found' },
    });
    mock.method(client, 'get', async () => { throw apiError; });

    await assert.rejects(
      () => api.getPipelineRun(client, 'org1', 'pipe-1', 'bad-run'),
      (err) => {
        assert.ok(err.response, 'should have response');
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// fixture helper tests
// ---------------------------------------------------------------------------

describe('pipeline fixtures', () => {
  test('makePipeline returns fixture with expected keys', () => {
    const p = makePipeline();
    assert.ok('pipelineId' in p);
    assert.ok('pipelineName' in p);
    assert.ok('createTime' in p);
  });

  test('makePipelineRun returns fixture with expected keys', () => {
    const run = makePipelineRun();
    assert.ok('pipelineRunId' in run);
    assert.ok('pipelineId' in run);
    assert.ok('status' in run);
    assert.ok('triggerMode' in run);
    assert.ok('startTime' in run);
    assert.ok('endTime' in run);
  });

  test('makePipelineRun respects overrides', () => {
    const run = makePipelineRun({ status: 'RUNNING', pipelineRunId: 999 });
    assert.equal(run.status, 'RUNNING');
    assert.equal(run.pipelineRunId, 999);
  });
});
