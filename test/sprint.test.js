// test/sprint.test.js - Unit tests for getSprintInfo API function
import { describe, test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMockClient, makeSprint } from './setup.js';
import { getSprintInfo } from '../src/api.js';

const ORG_ID = 'org-001';
const PROJECT_ID = 'proj-001';
const SPRINT_ID = 'sprint-001';

describe('getSprintInfo', () => {
  let client;

  beforeEach(() => {
    client = createMockClient();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('returns sprint object on success', async () => {
    const fixture = makeSprint({ id: SPRINT_ID, name: 'Sprint 1', status: 'DOING' });
    mock.method(client, 'get', async () => ({ data: fixture }));

    const result = await getSprintInfo(client, ORG_ID, PROJECT_ID, SPRINT_ID);

    assert.deepEqual(result, fixture);
  });

  test('calls correct API path with projectId and sprintId', async () => {
    const fixture = makeSprint({ id: SPRINT_ID });
    let capturedUrl = null;
    mock.method(client, 'get', async (url) => {
      capturedUrl = url;
      return { data: fixture };
    });

    await getSprintInfo(client, ORG_ID, PROJECT_ID, SPRINT_ID);

    assert.equal(
      capturedUrl,
      `/oapi/v1/projex/organizations/${ORG_ID}/projects/${PROJECT_ID}/sprints/${SPRINT_ID}`
    );
  });

  test('propagates error on API failure', async () => {
    mock.method(client, 'get', async () => {
      throw new Error('Network error');
    });

    await assert.rejects(
      () => getSprintInfo(client, ORG_ID, PROJECT_ID, SPRINT_ID),
      { message: 'Network error' }
    );
  });
});
