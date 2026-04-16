// test/version-check.test.js - Version check module tests
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { checkVersionAsync, getVersionCheckCacheFileForTest, setTestCacheFile } from '../src/version-check.js';

// Mock cache directory for testing
const testCacheDir = path.join(os.tmpdir(), 'yunxiao-test-cache');
const testCacheFile = path.join(testCacheDir, 'version-check-cache.json');

function setupTestCache() {
  if (!fs.existsSync(testCacheDir)) {
    fs.mkdirSync(testCacheDir, { recursive: true });
  }
  setTestCacheFile(testCacheFile);
}

function cleanupTestCache() {
  setTestCacheFile(null);
  if (fs.existsSync(testCacheDir)) {
    fs.rmSync(testCacheDir, { recursive: true, force: true });
  }
}

function writeMockCache(data) {
  fs.writeFileSync(testCacheFile, JSON.stringify(data, null, 2), 'utf-8');
}

function readMockCache() {
  if (!fs.existsSync(testCacheFile)) return null;
  return JSON.parse(fs.readFileSync(testCacheFile, 'utf-8'));
}

test('version check - cache hit (within 24 hours)', async () => {
  setupTestCache();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  writeMockCache({
    lastCheckTime: oneHourAgo,
    latestVersion: '2.0.0',
    localVersion: '1.0.0'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, true);
  assert.strictEqual(result.latestVersion, '2.0.0');

  cleanupTestCache();
});

test('version check - cache miss (older than 24 hours)', async () => {
  setupTestCache();
  const now = Date.now();
  const twoHoursAgo = now - 25 * 60 * 60 * 1000; // 25 hours ago

  writeMockCache({
    lastCheckTime: twoHoursAgo,
    latestVersion: '0.1.9',
    localVersion: '0.1.1'
  });

  // This will attempt to fetch from npm registry
  // If network is available, it will update cache
  // If network fails, it returns no update
  const result = await checkVersionAsync();
  assert.strictEqual(typeof result.hasUpdate, 'boolean');

  cleanupTestCache();
});

test('version check - no cache file', async () => {
  setupTestCache();
  // No cache file written, so it will attempt to fetch
  const result = await checkVersionAsync();
  assert.strictEqual(typeof result.hasUpdate, 'boolean');

  cleanupTestCache();
});

test('version comparison - local < latest', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '2.0.0',
    localVersion: '1.0.0'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, true);

  cleanupTestCache();
});

test('version comparison - local == latest', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '1.0.0',
    localVersion: '1.0.0'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, false);

  cleanupTestCache();
});

test('version comparison - local > latest', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '0.9.0',
    localVersion: '1.0.0'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, false);

  cleanupTestCache();
});

test('version comparison - major version difference', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '2.0.0',
    localVersion: '1.9.9'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, true);

  cleanupTestCache();
});

test('version comparison - minor version difference', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '1.3.0',
    localVersion: '1.2.5'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, true);

  cleanupTestCache();
});

test('version comparison - patch version difference', async () => {
  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: '1.0.2',
    localVersion: '1.0.1'
  });

  const result = await checkVersionAsync();
  assert.strictEqual(result.hasUpdate, true);

  cleanupTestCache();
});

test('version check - invalid cache JSON', async () => {
  setupTestCache();
  const cacheFile = path.join(testCacheDir, 'version-check-cache.json');
  fs.writeFileSync(cacheFile, 'invalid json', 'utf-8');

  // Should handle gracefully and attempt to fetch
  const result = await checkVersionAsync();
  assert.strictEqual(typeof result.hasUpdate, 'boolean');

  cleanupTestCache();
});

test('version check - network error handling', async () => {
  setupTestCache();
  // No cache, network will fail (or succeed depending on connectivity)
  // Either way, should not throw
  const result = await checkVersionAsync();
  assert.strictEqual(typeof result.hasUpdate, 'boolean');
  assert(result.latestVersion === null || typeof result.latestVersion === 'string');

  cleanupTestCache();
});

test('version check - cache file path exists', () => {
  const cacheFile = getVersionCheckCacheFileForTest();
  assert.strictEqual(typeof cacheFile, 'string');
  assert(cacheFile.includes('.yunxiao'));
  assert(cacheFile.includes('version-check-cache.json'));
});
