// src/api.js - Yunxiao API client
import axios from "axios";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const API_BASE = "https://openapi-rdc.aliyuncs.com";

const CONFIG_DIR = join(homedir(), ".yunxiao");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

// Config file helpers
export function loadSavedConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const data = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    return data && data.pat ? data : null;
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export function clearConfig() {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, "{}", "utf8");
  }
}

export function createClientWithPat(pat) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      "x-yunxiao-token": pat,
      "Content-Type": "application/json",
    },
  });
}

export function createClient() {
  const pat = process.env.YUNXIAO_PAT;
  if (!pat) {
    console.error("Error: YUNXIAO_PAT environment variable is not set");
    process.exit(1);
  }
  return createClientWithPat(pat);
}

export function getConfig() {
  const pat = process.env.YUNXIAO_PAT;
  const orgId = process.env.YUNXIAO_ORG_ID;
  const projectId = process.env.YUNXIAO_PROJECT_ID;
  if (!pat) { console.error("Error: YUNXIAO_PAT is not set"); process.exit(1); }
  if (!orgId) { console.error("Error: YUNXIAO_ORG_ID is not set"); process.exit(1); }
  return { pat, orgId, projectId };
}

// Projects
export async function searchProjects(client, orgId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects:search`;
  const body = { page: opts.page || 1, perPage: opts.perPage || 20 };
  if (opts.name) {
    body.conditions = JSON.stringify({
      conditionGroups: [[{
        className: "string", fieldIdentifier: "name", format: "input",
        operator: "CONTAINS", toValue: null, value: [opts.name]
      }]]
    });
  }
  const res = await client.post(url, body);
  return res.data;
}

export async function getProject(client, orgId, projectId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}`;
  const res = await client.get(url);
  return res.data;
}

// Work Items
export async function searchWorkitems(client, orgId, spaceId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems:search`;
  const conditionGroups = [];
  if (opts.status) {
    conditionGroups.push({ className: "status", fieldIdentifier: "status", format: "list", operator: "CONTAINS", toValue: null, value: [opts.status] });
  }
  if (opts.assignedTo) {
    conditionGroups.push({ className: "user", fieldIdentifier: "assignedTo", format: "list", operator: "CONTAINS", toValue: null, value: [opts.assignedTo] });
  }
  if (opts.subject) {
    conditionGroups.push({ className: "string", fieldIdentifier: "subject", format: "input", operator: "CONTAINS", toValue: null, value: [opts.subject] });
  }
  const body = {
    spaceId,
    category: opts.category || "Req",
    page: opts.page || 1,
    perPage: opts.perPage || 20,
    orderBy: opts.orderBy || "gmtCreate",
    sort: opts.sort || "desc",
  };
  if (conditionGroups.length > 0) {
    body.conditions = JSON.stringify({ conditionGroups: [conditionGroups] });
  }
  const res = await client.post(url, body);
  return res.data;
}

export async function getWorkitem(client, orgId, workitemId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}`;
  const res = await client.get(url);
  return res.data;
}

export async function createWorkitem(client, orgId, data) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems`;
  const res = await client.post(url, data);
  return res.data;
}

export async function updateWorkitem(client, orgId, workitemId, fields) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}`;
  const res = await client.put(url, fields);
  return res.data;
}

export async function addComment(client, orgId, workitemId, content) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/comments`;
  const res = await client.post(url, { content });
  return res.data;
}

export async function listComments(client, orgId, workitemId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/comments`;
  const res = await client.get(url, { params: { page: opts.page || 1, perPage: opts.perPage || 20 } });
  return res.data;
}

export async function getWorkitemTypes(client, orgId, projectId, category = "Req") {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/workitemTypes`;
  const res = await client.get(url, { params: { category } });
  return res.data;
}

// Sprints
export async function listSprints(client, orgId, projectId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/sprints`;
  const res = await client.get(url, {
    params: { spaceId: projectId, page: opts.page || 1, perPage: opts.perPage || 20, status: opts.status }
  });
  return res.data;
}

// Platform
export async function getCurrentUser(client) {
  const url = "/oapi/v1/platform/user";
  const res = await client.get(url);
  return res.data;
}

export async function getOrganizations(client) {
  const url = "/oapi/v1/platform/organizations";
  const res = await client.get(url);
  return res.data;
}
