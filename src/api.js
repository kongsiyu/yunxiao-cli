// src/api.js - Yunxiao API client
import axios from "axios";
import { AppError, ERROR_CODE } from "./errors.js";

const API_BASE = "https://openapi-rdc.aliyuncs.com";

export function createClientWithPat(pat) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      "x-yunxiao-token": pat,
      "Content-Type": "application/json",
    },
  });
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
  if (opts.sprint) {
    conditionGroups.push({ className: "sprint", fieldIdentifier: "iteration", format: "list", operator: "CONTAINS", toValue: null, value: [opts.sprint] });
  }
  if (opts.priority) {
    conditionGroups.push({ className: "priority", fieldIdentifier: "priority", format: "list", operator: "CONTAINS", toValue: null, value: [opts.priority] });
  }
  if (opts.label) {
    conditionGroups.push({ className: "string", fieldIdentifier: "label", format: "input", operator: "CONTAINS", toValue: null, value: [opts.label] });
  }
  if (opts.createdAfter || opts.createdBefore) {
    const from = opts.createdAfter ? new Date(opts.createdAfter).getTime() : null;
    const to = opts.createdBefore ? new Date(opts.createdBefore).getTime() : null;
    conditionGroups.push({ className: "date", fieldIdentifier: "gmtCreate", format: "date", operator: "BETWEEN", value: from ? [String(from)] : null, toValue: to ? String(to) : null });
  }
  const body = {
    spaceId,
    category: opts.category || "Req,Task,Bug",
    page: opts.page || 1,
    perPage: opts.perPage || 20,
    orderBy: opts.orderBy || "gmtCreate",
    sort: opts.sort || "desc",
  };
  if (conditionGroups.length > 0) {
    body.conditions = JSON.stringify({ conditionGroups: [conditionGroups] });
  }
  const res = await client.post(url, body);
  // Real API: res.data is an array, total in x-total header
  // Some response formats: res.data is { data: [...], total: N }
  const rawData = res.data;
  const items = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
  const total = parseInt(
    res.headers?.['x-total'] ?? rawData?.total ?? items.length, 10
  ) || 0;
  return { items, total };
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

export async function deleteWorkitem(client, orgId, workitemId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}`;
  await client.delete(url);
}

export async function getWorkitemTypes(client, orgId, projectId, category = "Req") {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/workitemTypes`;
  const res = await client.get(url, { params: { category } });
  return res.data;
}

export async function getWorkitemWorkflow(client, orgId, projectId, typeId) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/workitemTypes/${typeId}/workflows`;
  const res = await client.get(url);
  return res.data;
}

// Sprints
export async function listSprints(client, orgId, projectId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/sprints`;
  const res = await client.get(url, {
    params: { page: opts.page || 1, perPage: opts.perPage || 20, status: opts.status }
  });
  return res.data;
}

// Pipelines
// Verified path: GET /oapi/v1/flow/organizations/{orgId}/pipelines
// Returns array of { pipelineId, pipelineName, createTime, createAccountId }
export async function listPipelines(client, orgId, opts = {}) {
  const url = `/oapi/v1/flow/organizations/${orgId}/pipelines`;
  const res = await client.get(url, {
    params: {
      maxResults: opts.maxResults || 20,
      ...(opts.nextToken ? { nextToken: opts.nextToken } : {}),
    },
  });
  return res.data;
}

// Project Members
export async function listProjectMembers(client, orgId, projectId, opts = {}) {
  const url = `/oapi/v1/projex/organizations/${orgId}/projects/${projectId}/members`;
  const params = {};
  if (opts.name) params.name = opts.name;
  if (opts.roleId) params.roleId = opts.roleId;
  if (opts.perPage) params.perPage = opts.perPage;
  const res = await client.get(url, { params });
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

// Pipelines
export async function createPipelineRun(client, orgId, pipelineId, opts = {}) {
  const url = `/oapi/v1/flow/organizations/${orgId}/pipelines/${pipelineId}/runs`;
  const body = {};
  if (opts.params) {
    body.params = typeof opts.params === "string" ? opts.params : JSON.stringify(opts.params);
  }
  const res = await client.post(url, body);
  return res.data;
}

// ID Resolution
// Supports: GJBL-1 (serialNumber format) or UUID
export async function resolveWorkitemId(client, orgId, spaceId, identifier) {
  if (!identifier) return null;

  // Serial number format: e.g. GJBL-1 (letters-digits)
  if (/^[A-Z]+-\d+$/i.test(identifier)) {
    const serialNumber = identifier.toUpperCase();
    const { items: results } = await searchWorkitems(client, orgId, spaceId, {
      category: "Req,Task,Bug",
      page: 1,
      perPage: 50,
    });
    const match = (results || []).find(
      (i) => i.serialNumber?.toUpperCase() === serialNumber
    );
    if (!match) {
      throw new AppError(ERROR_CODE.NOT_FOUND, `Workitem ${identifier} not found`);
    }
    return match.id;
  }

  // Otherwise assume it's already a UUID
  return identifier;
}
