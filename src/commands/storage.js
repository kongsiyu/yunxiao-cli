// src/commands/storage.js - Persistent storage for saved queries
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const STORAGE_DIR = join(homedir(), ".yunxiao");
const QUERIES_FILE = join(STORAGE_DIR, "queries.json");

function ensureDir() {
  mkdirSync(STORAGE_DIR, { recursive: true });
}

export function loadQueries() {
  try {
    if (!existsSync(QUERIES_FILE)) return {};
    return JSON.parse(readFileSync(QUERIES_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveQueries(queries) {
  ensureDir();
  writeFileSync(QUERIES_FILE, JSON.stringify(queries, null, 2), "utf8");
}

export function getQuery(name) {
  const queries = loadQueries();
  return queries[name] || null;
}

export function setQuery(name, filters) {
  const queries = loadQueries();
  queries[name] = { ...filters, savedAt: new Date().toISOString() };
  saveQueries(queries);
}

export function deleteQuery(name) {
  const queries = loadQueries();
  if (!queries[name]) return false;
  delete queries[name];
  saveQueries(queries);
  return true;
}

export function listQueries() {
  const queries = loadQueries();
  return Object.entries(queries).map(([name, q]) => ({ name, ...q }));
}
