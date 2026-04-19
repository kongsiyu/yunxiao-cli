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

function validateJsonShape(result, fieldName) {
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

  if (!Object.prototype.hasOwnProperty.call(payload, fieldName)) {
    return fail(`stdout JSON is missing "${fieldName}"`);
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "total")) {
    return fail('stdout JSON is missing "total"');
  }

  if (!Array.isArray(payload[fieldName])) {
    return fail(`stdout JSON field "${fieldName}" is not an array`);
  }

  if (typeof payload.total !== "number") {
    return fail('stdout JSON field "total" is not a number');
  }

  return pass(`stdout JSON contains ${fieldName}[${payload[fieldName].length}] and total=${payload.total}`);
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
      if (result.status !== 1) {
        return fail(`expected exit 1, got ${result.status}`);
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

      if (payload.code !== "AUTH_MISSING") {
        return fail(`expected AUTH_MISSING, got ${payload.code || "<missing>"}`);
      }
      if (typeof payload.error !== "string" || payload.error.length === 0) {
        return fail("stderr JSON is missing a non-empty error message");
      }
      return pass("stderr emitted AUTH_MISSING JSON and stdout stayed empty");
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
      return validateJsonShape(result, "projects");
    },
  },
  {
    id: "wi-list-json-live",
    title: "workitem list JSON contract in live mode",
    tier: "live",
    command: ["wi", "list", "--json"],
    profile: "live",
    validate(result) {
      return validateJsonShape(result, "items");
    },
  },
  {
    id: "sprint-list-json-live",
    title: "sprint list JSON contract in live mode",
    tier: "live",
    command: ["sprint", "list", "--json"],
    profile: "live",
    validate(result) {
      return validateJsonShape(result, "sprints");
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
