// src/codeup-api.js - Codeup API client
import axios from "axios";
import { AppError, ERROR_CODE } from "./errors.js";

const CODEUP_BASE = "https://codeup.aliyuncs.com/api/v3";

export function createCodeupClient(pat) {
  return axios.create({
    baseURL: CODEUP_BASE,
    headers: {
      "x-yunxiao-token": pat,
      "Content-Type": "application/json",
    },
  });
}

async function codeupCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw new AppError(ERROR_CODE.AUTH_FAILED, "Codeup authentication failed: invalid or missing PAT");
    }
    throw err;
  }
}

export async function listRepos(codeupClient, opts = {}) {
  const params = {};
  if (opts.page !== undefined) params.page = opts.page;
  if (opts.perPage !== undefined) params.per_page = opts.perPage;
  return codeupCall(() =>
    codeupClient.get("/projects", { params }).then((r) => r.data)
  );
}

export async function getRepo(codeupClient, repoId) {
  return codeupCall(() =>
    codeupClient.get(`/projects/${repoId}`).then((r) => r.data)
  );
}

export async function listMrs(codeupClient, repoId, opts = {}) {
  const params = {};
  if (opts.page !== undefined) params.page = opts.page;
  if (opts.perPage !== undefined) params.per_page = opts.perPage;
  if (opts.state !== undefined) params.state = opts.state;
  return codeupCall(() =>
    codeupClient.get(`/projects/${repoId}/merge_requests`, { params }).then((r) => r.data)
  );
}
