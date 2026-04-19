import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { SMOKE_CASES, getMissingLiveEnv, getSmokeEnvironment } from "./matrix.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function readPackageVersion() {
  const raw = fs.readFileSync(path.join(repoRoot, "package.json"), "utf8");
  return JSON.parse(raw).version;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function seedVersionCache(homeDir, packageVersion) {
  const yunxiaoDir = path.join(homeDir, ".yunxiao");
  ensureDir(yunxiaoDir);
  fs.writeFileSync(
    path.join(yunxiaoDir, "version-check-cache.json"),
    JSON.stringify(
      {
        lastCheckTime: Date.now(),
        latestVersion: packageVersion,
        localVersion: packageVersion,
      },
      null,
      2
    ),
    "utf8"
  );
}

function writeSmokeConfig(homeDir, config) {
  const yunxiaoDir = path.join(homeDir, ".yunxiao");
  ensureDir(yunxiaoDir);
  const payload = {
    token: config.token,
    orgId: config.orgId,
    projectId: config.projectId,
  };
  if (config.language) {
    payload.language = config.language;
  }
  fs.writeFileSync(path.join(yunxiaoDir, "config.json"), JSON.stringify(payload, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

function createTempHome(prefix = "yunxiao-smoke-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function normalizePreview(value, limit = 240) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

function defaultReporter(_line) {
  // no-op for tests
}

function buildChildEnv(homeDir, caseDef, liveEnv, baseEnv) {
  return {
    ...baseEnv,
    HOME: homeDir,
    USERPROFILE: homeDir,
    YUNXIAO_PAT: "",
    YUNXIAO_ORG_ID: "",
    YUNXIAO_PROJECT_ID: "",
    YUNXIAO_LANGUAGE: "",
    ...(caseDef.env || {}),
    ...(caseDef.profile === "live"
      ? {
          YUNXIAO_PAT: liveEnv.token,
          YUNXIAO_ORG_ID: liveEnv.orgId,
          YUNXIAO_PROJECT_ID: liveEnv.projectId,
          ...(liveEnv.language ? { YUNXIAO_LANGUAGE: liveEnv.language } : {}),
        }
      : {}),
  };
}

export function executeSmokeCase(caseDef, context) {
  if (caseDef.tier === "live" && context.mode !== "live") {
    return {
      id: caseDef.id,
      title: caseDef.title,
      tier: caseDef.tier,
      status: "skipped",
      detail: "live/manual case skipped in ci mode",
      command: `node src/index.js ${caseDef.command.join(" ")}`.trim(),
    };
  }

  const startedAt = Date.now();
  const homeDir = createTempHome();

  try {
    seedVersionCache(homeDir, context.packageVersion);

    if (caseDef.profile === "live") {
      writeSmokeConfig(homeDir, context.liveEnv);
    }

    const env = buildChildEnv(homeDir, caseDef, context.liveEnv, context.baseEnv);
    const run = spawnSync(process.execPath, ["src/index.js", ...caseDef.command], {
      cwd: context.repoRoot,
      env,
      encoding: "utf8",
      input: caseDef.stdin,
      timeout: 15000,
    });

    const elapsedMs = Date.now() - startedAt;

    if (run.error) {
      return {
        id: caseDef.id,
        title: caseDef.title,
        tier: caseDef.tier,
        status: "failed",
        detail: `spawn failed: ${run.error.message}`,
        command: `node src/index.js ${caseDef.command.join(" ")}`.trim(),
        durationMs: elapsedMs,
        exitCode: run.status,
        stdoutPreview: normalizePreview(run.stdout),
        stderrPreview: normalizePreview(run.stderr),
      };
    }

    const validation = caseDef.validate(
      {
        status: run.status ?? 0,
        stdout: run.stdout || "",
        stderr: run.stderr || "",
      },
      context
    );

    return {
      id: caseDef.id,
      title: caseDef.title,
      tier: caseDef.tier,
      status: validation.ok ? "passed" : "failed",
      detail: validation.detail,
      command: `node src/index.js ${caseDef.command.join(" ")}`.trim(),
      durationMs: elapsedMs,
      exitCode: run.status ?? 0,
      stdoutPreview: normalizePreview(run.stdout),
      stderrPreview: normalizePreview(run.stderr),
    };
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
}

export async function runSmokeMode(mode = "ci", options = {}) {
  const reporter = options.reporter ?? defaultReporter;
  const env = options.env ?? process.env;
  const packageVersion = options.packageVersion ?? readPackageVersion();
  const liveEnv = getSmokeEnvironment(env);
  const missingEnv = mode === "live" ? getMissingLiveEnv(env) : [];

  if (mode === "live" && missingEnv.length > 0) {
    const summary = {
      mode,
      ok: false,
      missingEnv,
      results: [],
      passedCount: 0,
      failedCount: 0,
      skippedCount: 0,
    };
    reporter(`Smoke ${mode}: missing required env: ${missingEnv.join(", ")}`);
    return summary;
  }

  const context = {
    mode,
    repoRoot,
    packageVersion,
    liveEnv,
    baseEnv: env,
  };

  const results = SMOKE_CASES.map((caseDef) => executeSmokeCase(caseDef, context));
  const passedCount = results.filter((item) => item.status === "passed").length;
  const failedCount = results.filter((item) => item.status === "failed").length;
  const skippedCount = results.filter((item) => item.status === "skipped").length;
  const ok = failedCount === 0;

  for (const item of results) {
    reporter(
      `[${item.status.toUpperCase()}] ${item.id} (${item.tier}) - ${item.detail}`
    );
  }
  reporter(
    `Smoke ${mode} summary: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`
  );

  return {
    mode,
    ok,
    results,
    missingEnv,
    passedCount,
    failedCount,
    skippedCount,
  };
}

function isMain() {
  if (!process.argv[1]) {
    return false;
  }
  return path.resolve(process.argv[1]) === __filename;
}

if (isMain()) {
  const mode = process.argv[2] === "live" ? "live" : "ci";
  const summary = await runSmokeMode(mode, { reporter: console.log });
  process.exit(summary.ok ? 0 : 1);
}
