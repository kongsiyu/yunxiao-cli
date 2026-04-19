import { ERROR_CODE } from "../../src/errors.js";

function pass(detail) {
  return { ok: true, detail };
}

function fail(detail) {
  return { ok: false, detail };
}

function normalizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n");
}

function parseJson(value) {
  return JSON.parse(normalizeText(value).trim());
}

const ALLOWED_ERROR_CODES = new Set(Object.values(ERROR_CODE));

export function validateJsonSuccessContract(result, options = {}) {
  const rootKey = options.rootKey;
  const requiredKeys = options.requiredKeys ?? (rootKey ? [rootKey, "total"] : []);

  if (result.status !== 0) {
    return fail(`expected exit 0, got ${result.status}`);
  }

  if (normalizeText(result.stderr).trim() !== "") {
    return fail(`expected empty stderr, got: ${normalizeText(result.stderr).trim()}`);
  }

  let payload;
  try {
    payload = parseJson(result.stdout);
  } catch (error) {
    return fail(`stdout is not valid JSON: ${error.message}`);
  }

  for (const key of requiredKeys) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) {
      return fail(`stdout JSON is missing "${key}"`);
    }
  }

  if (rootKey && !Array.isArray(payload[rootKey])) {
    return fail(`stdout JSON field "${rootKey}" is not an array`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "total") && typeof payload.total !== "number") {
    return fail('stdout JSON field "total" is not a number');
  }

  return pass(
    rootKey
      ? `stdout JSON contains ${rootKey}[${payload[rootKey].length}] and total=${payload.total}`
      : "stdout JSON contract is valid"
  );
}

export function validateJsonErrorContract(result, options = {}) {
  const expectedCode = options.expectedCode;

  if (result.status === 0) {
    return fail("expected non-zero exit, got 0");
  }

  if (normalizeText(result.stdout).trim() !== "") {
    return fail(`expected empty stdout, got: ${normalizeText(result.stdout).trim()}`);
  }

  let payload;
  try {
    payload = parseJson(result.stderr);
  } catch (error) {
    return fail(`stderr is not valid JSON: ${error.message}`);
  }

  const keys = Object.keys(payload).sort();
  if (keys.length !== 2 || keys[0] !== "code" || keys[1] !== "error") {
    return fail(`stderr JSON keys must be exactly "error" and "code", got: ${keys.join(", ")}`);
  }

  if (typeof payload.error !== "string" || payload.error.length === 0) {
    return fail("stderr JSON is missing a non-empty error message");
  }

  if (!ALLOWED_ERROR_CODES.has(payload.code)) {
    return fail(`stderr JSON code must be a known ERROR_CODE, got: ${payload.code || "<missing>"}`);
  }

  if (expectedCode && payload.code !== expectedCode) {
    return fail(`expected ${expectedCode}, got ${payload.code}`);
  }

  return pass(`stderr emitted ${payload.code} JSON and stdout stayed empty`);
}

export const LIVE_ENV_VARS = [
  "YUNXIAO_SMOKE_PAT",
  "YUNXIAO_SMOKE_ORG_ID",
  "YUNXIAO_SMOKE_PROJECT_ID",
];

export const SMOKE_CASES = [
  {
    id: "version",
    title: "runtime version matches package.json",
    tier: "ci",
    command: ["--version"],
    profile: "clean",
    validate(result, context) {
      if (result.status !== 0) {
        return fail(`expected exit 0, got ${result.status}`);
      }
      if (normalizeText(result.stderr).trim() !== "") {
        return fail(`expected empty stderr, got: ${normalizeText(result.stderr).trim()}`);
      }
      const actual = normalizeText(result.stdout).trim();
      if (actual !== context.packageVersion) {
        return fail(`expected stdout "${context.packageVersion}", got "${actual}"`);
      }
      return pass(`stdout matched package.json version ${context.packageVersion}`);
    },
  },
  {
    id: "help",
    title: "help output is reachable",
    tier: "ci",
    command: ["--help"],
    profile: "clean",
    validate(result) {
      if (result.status !== 0) {
        return fail(`expected exit 0, got ${result.status}`);
      }
      const stdout = normalizeText(result.stdout);
      if (!stdout.includes("Usage: yunxiao")) {
        return fail('stdout does not include "Usage: yunxiao"');
      }
      if (!stdout.includes("Commands:")) {
        return fail('stdout does not include "Commands:"');
      }
      return pass("help output contains usage and command listing");
    },
  },
  {
    id: "auth-status-clean",
    title: "auth status works without local config",
    tier: "ci",
    command: ["auth", "status"],
    profile: "clean",
    validate(result) {
      if (result.status !== 0) {
        return fail(`expected exit 0, got ${result.status}`);
      }
      const stdout = normalizeText(result.stdout);
      if (!stdout.includes("Authentication Status:")) {
        return fail('stdout does not include "Authentication Status:"');
      }
      if (!stdout.includes("Not authenticated")) {
        return fail('stdout does not include "Not authenticated"');
      }
      if (normalizeText(result.stderr).trim() !== "") {
        return fail(`expected empty stderr, got: ${normalizeText(result.stderr).trim()}`);
      }
      return pass("clean-home auth status reports unauthenticated without failing");
    },
  },
  {
    id: "project-list-json-auth-missing",
    title: "failure path keeps JSON contract on stderr",
    tier: "ci",
    command: ["project", "list", "--json"],
    profile: "clean",
    validate(result) {
      return validateJsonErrorContract(result, { expectedCode: ERROR_CODE.AUTH_MISSING });
    },
  },
  {
    id: "project-list-json-auth-missing-zh",
    title: "Chinese mode keeps JSON error schema and code stable",
    tier: "ci",
    command: ["project", "list", "--json"],
    profile: "clean",
    config: {
      language: "zh",
    },
    env: {
      LANG: "zh_CN.UTF-8",
      LC_ALL: "zh_CN.UTF-8",
    },
    validate(result) {
      return validateJsonErrorContract(result, { expectedCode: ERROR_CODE.AUTH_MISSING });
    },
  },
  {
    id: "wi-list-json-auth-missing",
    title: "workitem list failure keeps JSON contract on stderr",
    tier: "ci",
    command: ["wi", "list", "--json"],
    profile: "clean",
    validate(result) {
      return validateJsonErrorContract(result, { expectedCode: ERROR_CODE.AUTH_MISSING });
    },
  },
  {
    id: "sprint-list-json-auth-missing",
    title: "sprint list failure keeps JSON contract on stderr",
    tier: "ci",
    command: ["sprint", "list", "--json"],
    profile: "clean",
    validate(result) {
      return validateJsonErrorContract(result, { expectedCode: ERROR_CODE.AUTH_MISSING });
    },
  },
  {
    id: "auth-login-zh-prompt",
    title: "Chinese human-readable path is present",
    tier: "ci",
    command: ["auth", "login"],
    profile: "clean",
    env: {
      LANG: "zh_CN.UTF-8",
      LC_ALL: "zh_CN.UTF-8",
    },
    stdin: "\n",
    validate(result) {
      if (result.status !== 1) {
        return fail(`expected exit 1, got ${result.status}`);
      }
      const stdout = normalizeText(result.stdout);
      const stderr = normalizeText(result.stderr);
      if (!stdout.includes("请粘贴你的 Personal Access Token")) {
        return fail("stdout does not include the Chinese PAT prompt");
      }
      if (!stderr.includes("PAT cannot be empty")) {
        return fail('stderr does not include "PAT cannot be empty"');
      }
      return pass("Chinese prompt appears on stdout and failure stays human-readable");
    },
  },
  {
    id: "project-list-json-live",
    title: "project list JSON contract in live mode",
    tier: "live",
    command: ["project", "list", "--json"],
    profile: "live",
    validate(result) {
      return validateJsonSuccessContract(result, {
        rootKey: "projects",
        requiredKeys: ["projects", "total"],
      });
    },
  },
  {
    id: "wi-list-json-live",
    title: "workitem list JSON contract in live mode",
    tier: "live",
    command: ["wi", "list", "--json"],
    profile: "live",
    validate(result) {
      return validateJsonSuccessContract(result, {
        rootKey: "items",
        requiredKeys: ["items", "total"],
      });
    },
  },
  {
    id: "sprint-list-json-live",
    title: "sprint list JSON contract in live mode",
    tier: "live",
    command: ["sprint", "list", "--json"],
    profile: "live",
    validate(result) {
      return validateJsonSuccessContract(result, {
        rootKey: "sprints",
        requiredKeys: ["sprints", "total"],
      });
    },
  },
];

export function getMissingLiveEnv(env = process.env) {
  return LIVE_ENV_VARS.filter((name) => !String(env[name] || "").trim());
}

export function getSmokeEnvironment(env = process.env) {
  return {
    token: String(env.YUNXIAO_SMOKE_PAT || "").trim(),
    orgId: String(env.YUNXIAO_SMOKE_ORG_ID || "").trim(),
    projectId: String(env.YUNXIAO_SMOKE_PROJECT_ID || "").trim(),
    language: String(env.YUNXIAO_SMOKE_LANGUAGE || "").trim(),
  };
}
