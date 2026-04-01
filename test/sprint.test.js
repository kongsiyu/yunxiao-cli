// test/sprint.test.js - Tests for listSprints API function
import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMockClient, makeSprint } from './setup.js';
import { listSprints } from '../src/api.js';

const ORG_ID = 'test-org';
const PROJECT_ID = 'proj-001';

describe('listSprints', () => {
  afterEach(() => mock.restoreAll());

  test('uses correct path with projectId in URL', async () => {
    const client = createMockClient();
    let capturedUrl = null;
    mock.method(client, 'get', async (url, _opts) => {
      capturedUrl = url;
      return { data: [makeSprint()] };
    });

    await listSprints(client, ORG_ID, PROJECT_ID, {});

    assert.equal(
      capturedUrl,
      `/oapi/v1/projex/organizations/${ORG_ID}/projects/${PROJECT_ID}/sprints`
    );
  });

  test('does not pass spaceId as query param', async () => {
    const client = createMockClient();
    let capturedParams = null;
    mock.method(client, 'get', async (_url, opts) => {
      capturedParams = opts?.params || {};
      return { data: [] };
    });

    await listSprints(client, ORG_ID, PROJECT_ID, {});

    assert.equal(capturedParams.spaceId, undefined, 'spaceId should not be in query params');
  });

  test('passes status filter when provided', async () => {
    const client = createMockClient();
    let capturedParams = null;
    mock.method(client, 'get', async (_url, opts) => {
      capturedParams = opts?.params || {};
      return { data: [] };
    });

    await listSprints(client, ORG_ID, PROJECT_ID, { status: 'DOING' });

    assert.equal(capturedParams.status, 'DOING');
  });

  test('returns sprint list from API response', async () => {
    const client = createMockClient();
    const sprints = [
      makeSprint({ id: 'sp-1', name: 'Sprint 1', status: 'DOING' }),
      makeSprint({ id: 'sp-2', name: 'Sprint 2', status: 'TODO' }),
    ];
    mock.method(client, 'get', async () => ({ data: sprints }));

    const result = await listSprints(client, ORG_ID, PROJECT_ID, {});

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'sp-1');
    assert.equal(result[1].status, 'TODO');
  });

  test('passes default page and perPage params', async () => {
    const client = createMockClient();
    let capturedParams = null;
    mock.method(client, 'get', async (_url, opts) => {
      capturedParams = opts?.params || {};
      return { data: [] };
    });

    await listSprints(client, ORG_ID, PROJECT_ID, {});

    assert.equal(capturedParams.page, 1);
    assert.equal(capturedParams.perPage, 20);
  });
});
