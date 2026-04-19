import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVE_ENV_VARS, SMOKE_CASES, getMissingLiveEnv } from "../scripts/smoke/matrix.js";
import { runSmokeMode } from "../scripts/smoke/runner.js";

test("smoke matrix contains required ci and live cases", () => {
  const ids = new Set(SMOKE_CASES.map((item) => item.id));

  [
    "version",
    "help",
    "auth-status-clean",
    "project-list-json-auth-missing",
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
});

test("live smoke mode fails fast when required env is missing", async () => {
  const summary = await runSmokeMode("live", { env: {} });

  assert.equal(summary.ok, false);
  assert.deepEqual(summary.missingEnv.sort(), [...LIVE_ENV_VARS].sort());
  assert.equal(summary.results.length, 0);
});
