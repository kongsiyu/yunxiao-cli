// test/setup.js - Shared mock helpers for node:test suites
//
// Mock strategy for Node.js 18 ESM modules:
//
// IMPORTANT: ESM module namespace objects (`import * as api from '...'`) are
// sealed — their exports are non-configurable and non-writable.  Calling
// mock.method(api, 'searchWorkitems', ...) will throw:
//   TypeError: Cannot redefine property: searchWorkitems
//
// mock.module() (Node.js 22+) fully solves this, but is not available in
// Node.js 18.
//
// Two working strategies for Node.js 18:
//
//   Strategy A — Mock client.post / client.get (mock the HTTP layer)
//     createMockClient() returns a plain mutable JS object.  Replace its
//     methods with mock.method() to control what the real api.js functions
//     return without touching ESM exports.
//
//       const client = createMockClient();
//       mock.method(client, 'post', async () => ({ data: makePage([item]) }));
//       const result = await api.searchWorkitems(client, orgId, spaceId, {});
//
//   Strategy B — Wrap api functions in a mutable adapter object
//     Create a plain object that copies api function references.  mock.method()
//     can freely replace properties on this plain object.  Pass the adapter to
//     the code under test.
//
//       const apiAdapter = { searchWorkitems: api.searchWorkitems, ... };
//       mock.method(apiAdapter, 'searchWorkitems', async () => makePage([item]));
//
// Always call `mock.restoreAll()` in afterEach to prevent cross-test pollution.
//
// See test/mock-example.test.js for full working examples of both strategies.

/**
 * Creates a minimal axios-like client stub.
 * Returned methods (get, post, put, delete) can be individually replaced with
 * mock.method() inside individual tests.
 *
 * @returns {object} A plain object that looks like an axios instance.
 */
export function createMockClient() {
  return {
    get: async (_url, _opts) => ({ data: {} }),
    post: async (_url, _body) => ({ data: {} }),
    put: async (_url, _body) => ({ data: {} }),
    delete: async (_url) => ({ data: {} }),
  };
}

/**
 * Wraps items in the paginated envelope that the Yunxiao API returns.
 *
 * @param {Array} items - Array of workitem / project / sprint objects.
 * @param {object} [meta={}] - Optional extra top-level fields.
 * @returns {object} { data: items, total: items.length, ...meta }
 */
export function makePage(items, meta = {}) {
  return {
    data: items,
    total: items.length,
    ...meta,
  };
}

/**
 * Returns a minimal workitem fixture with sane defaults.
 * Override individual fields by passing a partial object.
 *
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeWorkitem(overrides = {}) {
  return {
    id: 'wi-001',
    subject: 'Test workitem',
    status: 'open',
    assignedTo: null,
    projectKey: 'TEST',
    gmtCreate: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Returns a minimal project fixture with sane defaults.
 *
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeProject(overrides = {}) {
  return {
    id: 'proj-001',
    name: 'Test Project',
    identifier: 'TEST',
    ...overrides,
  };
}

/**
 * Returns a minimal sprint fixture with sane defaults.
 *
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeSprint(overrides = {}) {
  return {
    id: 'sprint-001',
    name: 'Sprint 1',
    status: 'started',
    ...overrides,
  };
}
