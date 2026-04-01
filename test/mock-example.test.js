// test/mock-example.test.js
// Demonstrates working mock strategies for node:test in Node.js 18 ESM.
//
// Key finding: ESM module namespace exports are non-configurable (sealed),
// so `mock.method(api, 'searchWorkitems', ...)` throws
// "TypeError: Cannot redefine property" when `api` is imported as
// `import * as api from '../src/api.js'`.
//
// Working strategies documented here:
//
//   Strategy A — Mock client.post / client.get (mock the HTTP layer)
//     The client object returned by createMockClient() is a plain mutable JS
//     object.  Replace its methods with mock.method() to control what the
//     real api.js functions return without touching ESM exports.
//
//   Strategy B — Wrap api functions in a mutable adapter object
//     Create a plain object that holds references to the api functions.
//     mock.method() can replace properties on this plain object freely.
//     Tests call the adapter rather than the api namespace directly.
//
// Strategy A is preferred for Story 7.2 (direct api function tests), because
// it exercises the real api.js code paths with a controlled HTTP stub.
// Strategy B is preferred for Story 7.3/7.4 (command layer tests) where the
// command code imports api indirectly and you want to stub at the api boundary.

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/api.js';
import { createMockClient, makePage, makeWorkitem, makeProject, makeSprint } from './setup.js';

// ---------------------------------------------------------------------------
// Strategy A: mock client.post / client.get on the mutable mock client
// ---------------------------------------------------------------------------
describe('Strategy A: mock at client HTTP layer', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('searchWorkitems: mock client.post to control response', async () => {
    const fakeItem = makeWorkitem({ id: 'wi-1', subject: 'Mocked item' });
    const fakeResponse = makePage([fakeItem]);

    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: fakeResponse }));

    const result = await api.searchWorkitems(client, 'org1', 'space1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].id, 'wi-1');
    assert.equal(result.data[0].subject, 'Mocked item');
    // Verify mock was called
    assert.equal(client.post.mock.calls.length, 1);
  });

  test('getProject: mock client.get to control response', async () => {
    const fakeProject = makeProject({ id: 'proj-1', name: 'My Project' });

    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeProject }));

    const result = await api.getProject(client, 'org1', 'proj-1');

    assert.equal(result.id, 'proj-1');
    assert.equal(result.name, 'My Project');
    assert.equal(client.get.mock.calls.length, 1);
  });

  test('listSprints: mock client.get with page response', async () => {
    const fakeSprint = makeSprint({ id: 'sprint-1', name: 'Sprint 42' });
    const fakeResponse = makePage([fakeSprint]);

    const client = createMockClient();
    mock.method(client, 'get', async () => ({ data: fakeResponse }));

    const result = await api.listSprints(client, 'org1', 'proj1', {});

    assert.equal(result.total, 1);
    assert.equal(result.data[0].name, 'Sprint 42');
  });

  test('client.post receives correct URL and body', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: makePage([]) }));

    await api.searchWorkitems(client, 'myOrg', 'mySpace', { status: 'open' });

    const call = client.post.mock.calls[0];
    assert.ok(call.arguments[0].includes('myOrg'), 'URL should contain orgId');
    assert.ok(call.arguments[0].includes('workitems:search'), 'URL should be search endpoint');
    // Body should include spaceId
    assert.equal(call.arguments[1].spaceId, 'mySpace');
  });

  test('mocks are cleaned up between tests: client.post is pristine', async () => {
    // Previous test's mock.restoreAll() ran in afterEach.
    // A fresh client from createMockClient() should return the default stub value.
    const client = createMockClient();
    const result = await client.post('/anything', {});
    assert.deepEqual(result, { data: {} });
  });
});

// ---------------------------------------------------------------------------
// Strategy B: wrap api functions in a mutable adapter object
// ---------------------------------------------------------------------------
describe('Strategy B: mutable api adapter for command-layer tests', () => {
  // Build a plain mutable object wrapping api functions.
  // In real Story 7.3/7.4 tests you'd build this adapter once and pass it to
  // the command under test instead of letting the command import api directly.
  let apiAdapter;

  beforeEach(() => {
    apiAdapter = {
      searchWorkitems: api.searchWorkitems,
      getProject: api.getProject,
      listSprints: api.listSprints,
      getWorkitem: api.getWorkitem,
      createWorkitem: api.createWorkitem,
      updateWorkitem: api.updateWorkitem,
    };
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('mock.method() works on a plain adapter object (not ESM namespace)', async () => {
    const fakeItem = makeWorkitem({ id: 'adapted-1' });
    mock.method(apiAdapter, 'searchWorkitems', async () => makePage([fakeItem]));

    const client = createMockClient();
    const result = await apiAdapter.searchWorkitems(client, 'org1', 'space1', {});

    assert.equal(result.data[0].id, 'adapted-1');
    assert.equal(apiAdapter.searchWorkitems.mock.calls.length, 1);
  });

  test('adapter still holds original references when not mocked', async () => {
    assert.equal(apiAdapter.searchWorkitems, api.searchWorkitems);
    assert.equal(apiAdapter.getProject, api.getProject);
  });
});

// ---------------------------------------------------------------------------
// setup.js helper tests
// ---------------------------------------------------------------------------
describe('setup.js helper fixtures', () => {
  test('createMockClient returns object with four HTTP method stubs', async () => {
    const client = createMockClient();
    const getResult = await client.get('/url');
    const postResult = await client.post('/url', {});
    const putResult = await client.put('/url', {});
    const delResult = await client.delete('/url');
    assert.deepEqual(getResult, { data: {} });
    assert.deepEqual(postResult, { data: {} });
    assert.deepEqual(putResult, { data: {} });
    assert.deepEqual(delResult, { data: {} });
  });

  test('makePage wraps items with total count', () => {
    const items = [{ id: '1' }, { id: '2' }];
    const page = makePage(items);
    assert.deepEqual(page.data, items);
    assert.equal(page.total, 2);
  });

  test('makePage accepts extra meta fields', () => {
    const page = makePage([], { nextPage: 2 });
    assert.equal(page.nextPage, 2);
    assert.equal(page.total, 0);
  });

  test('makeWorkitem returns fixture with expected keys', () => {
    const wi = makeWorkitem();
    assert.ok('id' in wi);
    assert.ok('subject' in wi);
    assert.ok('status' in wi);
    assert.ok('projectKey' in wi);
  });

  test('makeWorkitem respects overrides', () => {
    const wi = makeWorkitem({ id: 'custom', status: 'closed' });
    assert.equal(wi.id, 'custom');
    assert.equal(wi.status, 'closed');
    assert.equal(wi.projectKey, 'TEST');
  });

  test('makeProject returns fixture with expected keys', () => {
    const proj = makeProject({ name: 'Override' });
    assert.equal(proj.name, 'Override');
    assert.ok('identifier' in proj);
  });

  test('makeSprint returns fixture with expected keys', () => {
    const sprint = makeSprint({ name: 'Sprint X' });
    assert.equal(sprint.name, 'Sprint X');
    assert.ok('status' in sprint);
  });
});
