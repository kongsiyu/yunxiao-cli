// test/sprint.test.js - Tests for sprint API functions and done-status logic
import { describe, test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMockClient, makeSprint } from './setup.js';
import { getSprintInfo, listSprints } from '../src/api.js';
import { isDoneStatus } from '../src/commands/sprint.js';

const ORG_ID = 'org-001';
const PROJECT_ID = 'proj-001';
const SPRINT_ID = 'sprint-001';

// ---------------------------------------------------------------------------
// isDoneStatus — done 状态判断逻辑单元测试
// 验证字段优先级：done boolean > stage enum > nameEn exact match
// ---------------------------------------------------------------------------
describe('isDoneStatus', () => {
  // Priority 1: s.done boolean
  test('returns true when s.done === true', () => {
    assert.equal(isDoneStatus({ done: true }), true);
  });

  test('returns false when s.done === false (stops at boolean check)', () => {
    // s.done === false must short-circuit; do NOT fall through to stage
    assert.equal(isDoneStatus({ done: false, stage: 'DONE', nameEn: 'done' }), false);
  });

  // Priority 2: s.stage enum
  test('returns true when s.stage === "DONE" and s.done absent', () => {
    assert.equal(isDoneStatus({ stage: 'DONE' }), true);
  });

  test('returns true for lowercase stage "done"', () => {
    assert.equal(isDoneStatus({ stage: 'done' }), true);
  });

  test('returns false when s.stage is "DOING"', () => {
    assert.equal(isDoneStatus({ stage: 'DOING' }), false);
  });

  test('returns false when s.stage is "UNSTARTED"', () => {
    assert.equal(isDoneStatus({ stage: 'UNSTARTED' }), false);
  });

  // Priority 3: s.nameEn exact match (case-insensitive)
  test('returns true when s.nameEn === "done" (exact match)', () => {
    assert.equal(isDoneStatus({ nameEn: 'done' }), true);
  });

  test('returns true when s.nameEn === "Done" (case-insensitive exact)', () => {
    assert.equal(isDoneStatus({ nameEn: 'Done' }), true);
  });

  test('returns false when s.nameEn === "undone" (no partial match)', () => {
    assert.equal(isDoneStatus({ nameEn: 'undone' }), false);
  });

  test('returns false when s.nameEn === "in-done" (no partial match)', () => {
    assert.equal(isDoneStatus({ nameEn: 'in-done' }), false);
  });

  // s.name Chinese fuzzy match removed — must NOT count '待完成' or '完成' via name
  test('returns false for s.name "完成" when done/stage/nameEn all absent', () => {
    assert.equal(isDoneStatus({ name: '完成' }), false);
  });

  test('returns false for s.name "待完成"', () => {
    assert.equal(isDoneStatus({ name: '待完成' }), false);
  });

  // Edge cases
  test('returns false for null status', () => {
    assert.equal(isDoneStatus(null), false);
  });

  test('returns false for undefined status', () => {
    assert.equal(isDoneStatus(undefined), false);
  });

  test('returns false for string status (string check removed)', () => {
    assert.equal(isDoneStatus('done'), false);
  });

  test('returns false for empty object', () => {
    assert.equal(isDoneStatus({}), false);
  });
});

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
