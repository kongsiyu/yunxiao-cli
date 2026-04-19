// src/version-check.js - Version check and update notification
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '../package.json');

// Allow test injection of cache file path
let testCacheFilePath = null;

function getVersionCheckCacheFile() {
  if (testCacheFilePath) return testCacheFilePath;
  const homeDir = os.homedir();
  return path.join(homeDir, '.yunxiao', 'version-check-cache.json');
}

export function setTestCacheFile(filePath) {
  testCacheFilePath = filePath;
}

export function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return null;
  }
}

function compareVersions(local, latest) {
  // Simple semver comparison: "0.1.1" vs "0.2.0"
  const localParts = local.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const lp = localParts[i] || 0;
    const rp = latestParts[i] || 0;
    if (lp < rp) return -1; // local < latest
    if (lp > rp) return 1;  // local > latest
  }
  return 0; // equal
}

function readCache() {
  try {
    const cacheFile = getVersionCheckCacheFile();
    if (!fs.existsSync(cacheFile)) return null;
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    return cache;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    const cacheFile = getVersionCheckCacheFile();
    const cacheDir = path.dirname(cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Silently ignore cache write errors
  }
}

function isCacheValid(cache) {
  if (!cache || !cache.lastCheckTime) return false;
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - cache.lastCheckTime < twentyFourHours;
}

async function fetchLatestVersion() {
  try {
    const response = await axios.get(
      'https://registry.npmjs.org/@kongsiyu/yunxiao-cli',
      { timeout: 2000 }
    );
    return response.data['dist-tags']?.latest || null;
  } catch {
    // Silently ignore network errors
    return null;
  }
}

export async function checkVersionAsync() {
  const localVersion = getPackageVersion();
  if (!localVersion) return { hasUpdate: false, latestVersion: null };

  // Check cache first
  const cache = readCache();
  if (isCacheValid(cache)) {
    const cmp = compareVersions(localVersion, cache.latestVersion);
    return { hasUpdate: cmp < 0, latestVersion: cache.latestVersion };
  }

  // Fetch latest version from npm registry
  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    // If fetch fails, return no update (silent failure)
    return { hasUpdate: false, latestVersion: null };
  }

  // Update cache
  writeCache({
    lastCheckTime: Date.now(),
    latestVersion,
    localVersion
  });

  const cmp = compareVersions(localVersion, latestVersion);
  return { hasUpdate: cmp < 0, latestVersion };
}

export function getVersionCheckCacheFileForTest() {
  return getVersionCheckCacheFile();
}
