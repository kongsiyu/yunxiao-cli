// test/pipeline.test.js — pipeline status command tests
// Uses Strategy A: mock client.get at HTTP layer

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient } from './setup.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

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
// API layer: getPipelineRun
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
// makePipelineRun fixture helper tests
// ---------------------------------------------------------------------------

describe('makePipelineRun fixture', () => {
  test('returns fixture with expected keys', () => {
    const run = makePipelineRun();
    assert.ok('pipelineRunId' in run);
    assert.ok('pipelineId' in run);
    assert.ok('status' in run);
    assert.ok('triggerMode' in run);
    assert.ok('startTime' in run);
    assert.ok('endTime' in run);
  });

  test('respects overrides', () => {
    const run = makePipelineRun({ status: 'RUNNING', pipelineRunId: 999 });
    assert.equal(run.status, 'RUNNING');
    assert.equal(run.pipelineRunId, 999);
  });
});
