// src/config.js - Centralized configuration management
// Priority: CLI args > config file > environment variables (FR26)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.yunxiao');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadSavedConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    // Support both new 'token' key and legacy 'pat' key
    if (data && (data.token || data.pat)) return data;
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 });
}

export function clearConfig() {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, '{}', 'utf8');
  }
}

// Merge config from all sources with correct priority:
// 1. cliArgs (highest) - e.g. { token, orgId, projectId }
// 2. config file (~/.yunxiao/config.json)
// 3. environment variables (lowest)
export function loadConfig(cliArgs = {}) {
  const file = loadSavedConfig();
  return {
    token: cliArgs.token || file?.token || file?.pat || process.env.YUNXIAO_PAT,
    orgId: cliArgs.orgId || file?.orgId || process.env.YUNXIAO_ORG_ID,
    projectId: cliArgs.projectId || file?.projectId || process.env.YUNXIAO_PROJECT_ID,
    userId: file?.userId,
    userName: file?.userName,
    orgName: file?.orgName,
    language: file?.language || process.env.YUNXIAO_LANGUAGE,
  };
}
