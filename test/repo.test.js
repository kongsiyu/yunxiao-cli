// test/repo.test.js - Unit tests for src/commands/repo.js
import { test, describe, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { Command } from "commander";
import { registerRepoCommands } from "../src/commands/repo.js";
import { AppError, ERROR_CODE } from "../src/errors.js";
import { printError } from "../src/output.js";
import { createMockClient } from "./setup.js";

class MockExit extends Error {
  constructor(code) {
    super(`process.exit(${code})`);
    this.exitCode = code;
  }
}

function setupCapture() {
  const stdout = [];
  const stderr = [];
  const logs = [];
  const exitCodes = [];

  mock.method(process.stdout, "write", (data) => { stdout.push(String(data)); return true; });
  mock.method(process.stderr, "write", (data) => { stderr.push(String(data)); return true; });
  mock.method(console, "log", (...args) => { logs.push(args.map(String).join(" ")); });
  mock.method(process, "exit", (code) => {
    exitCodes.push(code ?? 0);
    throw new MockExit(code);
  });

  return { stdout, stderr, logs, exitCodes };
}

function buildWithErrorHandling(jsonMode) {
  return (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        printError(ERROR_CODE.AUTH_FAILED, "Authentication failed or token expired. Run: yunxiao auth login", jsonMode);
      } else if (err.response) {
        const code = err.response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR;
        printError(code, err.response.data?.errorMessage || err.response.statusText, jsonMode);
      } else {
        printError(ERROR_CODE.API_ERROR, err.message, jsonMode);
      }
      process.exit(1);
    }
  };
}

function buildProgram(codeupClient, jsonMode) {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {} });
  program.option("--json", "Output as JSON");
  registerRepoCommands(program, codeupClient, buildWithErrorHandling(jsonMode), jsonMode);
  return program;
}

describe("repo list command", () => {
  afterEach(() => mock.restoreAll());

  test("normal mode prints list output with id and name", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: [{ id: 101, name: "alpha", description: "desc", visibility_level: "private", web_url: "u1" }],
    }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "repo", "list"]);

    const text = logs.join("\n");
    assert.ok(text.includes("Found 1 repo(s):"));
    assert.ok(text.includes("101"));
    assert.ok(text.includes("alpha"));
    assert.ok(text.includes("private"));
  });

  test("--json prints { repos, total } to stdout", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: [
        { id: 101, name: "alpha", description: "desc", visibility_level: "private", web_url: "u1" },
        { id: 102, name: "beta", description: "", visibility_level: "public", web_url: "u2" },
      ],
    }));
    const { stdout, logs } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync(["node", "yunxiao", "--json", "repo", "list"]);

    assert.equal(logs.length, 0, "json mode should not print table logs");
    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.total, 2);
    assert.equal(payload.repos[0].id, 101);
    assert.equal(payload.repos[0].visibility, "private");
  });

  test("empty repos prints no repositories found", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: [] }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "repo", "list"]);

    assert.ok(logs.some((line) => line.includes("No repositories found")));
  });

  test("missing codeupClient returns AUTH_MISSING and exits 1", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "repo", "list"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr.join(""));
    assert.equal(output.code, "AUTH_MISSING");
  });

  test("passes page and limit as integers to listRepos", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: [] }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "repo", "list", "--page", "2", "--limit", "10"]);

    assert.ok(logs.some((line) => line.includes("No repositories found")));
    const call = codeupClient.get.mock.calls[0];
    assert.equal(call.arguments[0], "/projects");
    assert.deepEqual(call.arguments[1], { params: { page: 2, per_page: 10 } });
  });

  test("limit > 100 returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "repo", "list", "--limit", "101"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
  });
});

describe("repo view command", () => {
  afterEach(() => mock.restoreAll());

  test("normal mode prints repo details", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: {
        id: 12345,
        name: "alpha",
        description: "repo desc",
        visibility_level: "private",
        web_url: "https://codeup.aliyun.com/alpha",
        default_branch: "main",
        created_at: "2026-04-17T00:00:00Z",
      },
    }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "repo", "view", "12345"]);

    const text = logs.join("\n");
    assert.ok(text.includes("Repository: alpha"));
    assert.ok(text.includes("12345"));
    assert.ok(text.includes("private"));
    assert.ok(text.includes("https://codeup.aliyun.com/alpha"));
  });

  test("--json prints mapped repo details", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: {
        id: 12345,
        name: "alpha",
        description: "repo desc",
        visibility_level: "private",
        web_url: "https://codeup.aliyun.com/alpha",
        default_branch: "main",
        created_at: "2026-04-17T00:00:00Z",
      },
    }));
    const { stdout, logs } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync(["node", "yunxiao", "--json", "repo", "view", "12345"]);

    assert.equal(logs.length, 0, "json mode should not print details logs");
    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.id, 12345);
    assert.equal(payload.name, "alpha");
    assert.equal(payload.visibility, "private");
    assert.equal(payload.webUrl, "https://codeup.aliyun.com/alpha");
    assert.equal(payload.defaultBranch, "main");
    assert.equal(payload.createdAt, "2026-04-17T00:00:00Z");
  });

  test("missing repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "repo", "view"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId is required");
  });

  test("invalid repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "repo", "view", "abc"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("missing codeupClient returns AUTH_MISSING and exits 1", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "repo", "view", "12345"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr.join(""));
    assert.equal(output.code, "AUTH_MISSING");
  });
});
