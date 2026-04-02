// test/pipeline-run.test.js
// Tests for createPipelineRun API function (Story 5.2)
// Strategy A: mock client.post at HTTP layer

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient } from './setup.js';

describe('createPipelineRun', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns pipelineRunId on success', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: { pipelineRunId: 42 } }));

    const result = await api.createPipelineRun(client, 'org1', '123');

    assert.equal(result.pipelineRunId, 42);
    assert.equal(client.post.mock.calls.length, 1);
  });

  test('calls correct API path with orgId and pipelineId', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: { pipelineRunId: 99 } }));

    await api.createPipelineRun(client, 'myOrg', '456');

    const [url] = client.post.mock.calls[0].arguments;
    assert.ok(url.includes('myOrg'), 'URL should contain orgId');
    assert.ok(url.includes('456'), 'URL should contain pipelineId');
    assert.ok(url.includes('/runs'), 'URL should end with /runs');
  });

  test('sends params in body when provided as string', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: { pipelineRunId: 1 } }));

    const paramsStr = '{"branch":"main"}';
    await api.createPipelineRun(client, 'org1', '123', { params: paramsStr });

    const [, body] = client.post.mock.calls[0].arguments;
    assert.equal(body.params, paramsStr);
  });

  test('serializes params object to JSON string', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: { pipelineRunId: 1 } }));

    const paramsObj = { branch: 'develop' };
    await api.createPipelineRun(client, 'org1', '123', { params: paramsObj });

    const [, body] = client.post.mock.calls[0].arguments;
    assert.equal(body.params, JSON.stringify(paramsObj));
  });

  test('sends empty body when no params provided', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: { pipelineRunId: 7 } }));

    await api.createPipelineRun(client, 'org1', '123');

    const [, body] = client.post.mock.calls[0].arguments;
    assert.deepEqual(body, {});
  });

  test('propagates API error on failure', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => {
      const err = new Error('Not Found');
      err.response = { data: { errorMessage: 'Pipeline not found' }, status: 404 };
      throw err;
    });

    await assert.rejects(
      () => api.createPipelineRun(client, 'org1', '999'),
      (err) => {
        assert.equal(err.message, 'Not Found');
        return true;
      }
    );
  });
});
