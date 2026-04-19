// test/version-check.test.js - Version check module tests
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'url';
import { checkVersionAsync, getPackageVersion, getVersionCheckCacheFileForTest, setTestCacheFile } from '../src/version-check.js';

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
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );
  const [major, minor, patch] = packageJson.version.split('.').map(Number);

  setupTestCache();
  writeMockCache({
    lastCheckTime: Date.now(),
    latestVersion: `${major}.${minor}.${patch + 1}`,
    localVersion: packageJson.version
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

test('package version helper reads current package.json version', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );

  assert.strictEqual(getPackageVersion(), packageJson.version);
});

test('cli entrypoint prints update notice from cache during a normal command', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'yunxiao-cli-home-'));
  const cacheDir = path.join(tempHome, '.yunxiao');
  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      path.join(cacheDir, 'version-check-cache.json'),
      JSON.stringify({
        lastCheckTime: Date.now(),
        latestVersion: '9.9.9',
        localVersion: packageJson.version
      }),
      'utf-8'
    );

    const result = spawnSync(process.execPath, ['src/index.js', 'auth', 'status'], {
      cwd: repoRoot,
      env: { ...process.env, HOME: tempHome },
      encoding: 'utf-8'
    });

    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Authentication Status/i);
    assert.match(result.stderr, /yunxiao v9\.9\.9 available/i);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});

test('cli --version matches package.json version', () => {
  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );

  const result = spawnSync(process.execPath, ['src/index.js', '--version'], {
    cwd: repoRoot,
    env: { ...process.env },
    encoding: 'utf-8'
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  assert.strictEqual(result.stdout.trim(), packageJson.version);
});
