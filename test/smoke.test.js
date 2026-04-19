import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ERROR_CODE } from "../src/errors.js";
import {
  LIVE_ENV_VARS,
  SMOKE_CASES,
  getMissingLiveEnv,
  validateJsonErrorContract,
  validateJsonSuccessContract,
} from "../scripts/smoke/matrix.js";
import { runSmokeMode } from "../scripts/smoke/runner.js";

test("smoke matrix contains required ci and live cases", () => {
  const ids = new Set(SMOKE_CASES.map((item) => item.id));

  [
    "version",
    "help",
    "auth-status-clean",
    "project-list-json-auth-missing",
    "project-list-json-auth-missing-zh",
    "sprint-list-json-auth-missing",
    "wi-list-json-auth-missing",
    "auth-login-zh-prompt",
    "project-list-json-live",
    "wi-list-json-live",
    "sprint-list-json-live",
  ].forEach((id) => {
    assert.ok(ids.has(id), `missing smoke case ${id}`);
  });

  const liveCases = SMOKE_CASES.filter((item) => item.tier === "live").map((item) => item.id);
  assert.deepEqual(liveCases.sort(), [
    "project-list-json-live",
    "sprint-list-json-live",
    "wi-list-json-live",
  ]);

  const zhJsonCase = SMOKE_CASES.find((item) => item.id === "project-list-json-auth-missing-zh");
  assert.equal(zhJsonCase?.config?.language, "zh");
});

test("json success contract validator enforces stdout JSON and clean stderr", () => {
  const validation = validateJsonSuccessContract(
    {
      status: 0,
      stdout: JSON.stringify({ projects: [], total: 0 }) + "\n",
      stderr: "",
    },
    {
      rootKey: "projects",
      requiredKeys: ["projects", "total"],
    }
  );

  assert.equal(validation.ok, true);

  const polluted = validateJsonSuccessContract(
    {
      status: 0,
      stdout: JSON.stringify({ projects: [], total: 0 }) + "\n",
      stderr: "Found 0 projects\n",
    },
    {
      rootKey: "projects",
      requiredKeys: ["projects", "total"],
    }
  );

  assert.equal(polluted.ok, false);
  assert.match(polluted.detail, /stderr/i);
});

test("json error contract validator enforces stderr JSON and known ERROR_CODE", () => {
  const validation = validateJsonErrorContract(
    {
      status: 1,
      stdout: "",
      stderr: JSON.stringify({ error: "Authentication required", code: ERROR_CODE.AUTH_MISSING }) + "\n",
    },
    {
      expectedCode: ERROR_CODE.AUTH_MISSING,
    }
  );

  assert.equal(validation.ok, true);

  const translatedCode = validateJsonErrorContract(
    {
      status: 1,
      stdout: "",
      stderr: JSON.stringify({ error: "需要认证", code: "认证缺失" }) + "\n",
    },
    {
      expectedCode: ERROR_CODE.AUTH_MISSING,
    }
  );

  assert.equal(translatedCode.ok, false);
  assert.match(translatedCode.detail, /ERROR_CODE|AUTH_MISSING/);
});

test("language-only config file is loaded for JSON contract runs", () => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunxiao-smoke-config-"));

  try {
    const configDir = path.join(homeDir, ".yunxiao");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, "config.json"),
      JSON.stringify({ language: "zh" }, null, 2),
      { encoding: "utf8", mode: 0o600 }
    );

    const run = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import { loadConfig } from './src/config.js'; console.log(JSON.stringify(loadConfig()));",
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: homeDir,
          USERPROFILE: homeDir,
          YUNXIAO_PAT: "",
          YUNXIAO_ORG_ID: "",
          YUNXIAO_PROJECT_ID: "",
          YUNXIAO_LANGUAGE: "",
          LANG: "en_US.UTF-8",
          LC_ALL: "en_US.UTF-8",
        },
        encoding: "utf8",
      }
    );

    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).language, "zh");
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test("getMissingLiveEnv returns the required live env variables", () => {
  assert.deepEqual(getMissingLiveEnv({}).sort(), [...LIVE_ENV_VARS].sort());
  assert.deepEqual(
    getMissingLiveEnv({
      YUNXIAO_SMOKE_PAT: "token",
      YUNXIAO_SMOKE_ORG_ID: "org",
      YUNXIAO_SMOKE_PROJECT_ID: "project",
    }),
    []
  );
});

test("ci smoke mode passes and skips live-only cases", async () => {
  const summary = await runSmokeMode("ci");

  assert.equal(summary.ok, true);
  assert.equal(summary.failedCount, 0);

  const skippedIds = summary.results
    .filter((item) => item.status === "skipped")
    .map((item) => item.id)
    .sort();

  assert.deepEqual(skippedIds, [
    "project-list-json-live",
    "sprint-list-json-live",
    "wi-list-json-live",
  ]);

  for (const id of [
    "project-list-json-auth-missing",
    "project-list-json-auth-missing-zh",
    "sprint-list-json-auth-missing",
    "wi-list-json-auth-missing",
  ]) {
    const result = summary.results.find((item) => item.id === id);
    assert.equal(result?.status, "passed", `${id} should pass JSON error contract`);
    assert.match(result.detail, /AUTH_MISSING/);
  }
});

test("live smoke mode fails fast when required env is missing", async () => {
  const summary = await runSmokeMode("live", { env: {} });

  assert.equal(summary.ok, false);
  assert.deepEqual(summary.missingEnv.sort(), [...LIVE_ENV_VARS].sort());
  assert.equal(summary.results.length, 0);
});
