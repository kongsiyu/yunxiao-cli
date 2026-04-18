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

describe("mr list command", () => {
  afterEach(() => mock.restoreAll());

  test("normal mode prints MR list output with id/title/state/branches/author", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: [
        {
          iid: 88,
          title: "Fix release branch merge conflict",
          state: "opened",
          source_branch: "feature/fix-mr",
          target_branch: "master",
          author: { id: "u-1", name: "alice" },
          created_at: "2026-04-18T00:00:00Z",
        },
      ],
    }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "mr", "list", "12345"]);

    const text = logs.join("\n");
    assert.ok(text.includes("Found 1 merge request(s):"));
    assert.ok(text.includes("88"));
    assert.ok(text.includes("opened"));
    assert.ok(text.includes("feature/fix-mr"));
    assert.ok(text.includes("master"));
    assert.ok(text.includes("alice"));
  });

  test("--json prints { mrs, total } to stdout", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: [
        {
          iid: 88,
          title: "Fix release branch merge conflict",
          state: "merged",
          source_branch: "feature/fix-mr",
          target_branch: "master",
          author: { id: "u-1", username: "alice" },
          created_at: "2026-04-18T00:00:00Z",
        },
      ],
    }));
    const { stdout, logs } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync(["node", "yunxiao", "--json", "mr", "list", "12345"]);

    assert.equal(logs.length, 0, "json mode should not print table logs");
    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.total, 1);
    assert.equal(payload.mrs[0].id, 88);
    assert.equal(payload.mrs[0].title, "Fix release branch merge conflict");
    assert.equal(payload.mrs[0].state, "merged");
    assert.equal(payload.mrs[0].sourceBranch, "feature/fix-mr");
    assert.equal(payload.mrs[0].targetBranch, "master");
    assert.equal(payload.mrs[0].author.name, "alice");
    assert.equal(payload.mrs[0].createdAt, "2026-04-18T00:00:00Z");
  });

  test("empty result prints no merge requests found", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: [] }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "mr", "list", "12345"]);

    assert.ok(logs.some((line) => line.includes("No merge requests found")));
  });

  test("passes state/page/limit params to listMrs", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: [] }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync([
      "node",
      "yunxiao",
      "mr",
      "list",
      "12345",
      "--state",
      "opened",
      "--page",
      "2",
      "--limit",
      "10",
    ]);

    assert.ok(logs.some((line) => line.includes("No merge requests found")));
    const call = codeupClient.get.mock.calls[0];
    assert.equal(call.arguments[0], "/projects/12345/merge_requests");
    assert.deepEqual(call.arguments[1], { params: { page: 2, per_page: 10, state: "opened" } });
  });

  test("missing repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "list"]);
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
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "list", "abc"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("invalid --state returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "list", "12345", "--state", "invalid"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "state must be one of: opened, merged, closed");
  });

  test("missing codeupClient returns AUTH_MISSING and exits 1", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "list", "12345"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr.join(""));
    assert.equal(output.code, "AUTH_MISSING");
  });
});

describe("mr view command", () => {
  afterEach(() => mock.restoreAll());

  function makeMrDetail(overrides = {}) {
    return {
      iid: 88,
      id: 188,
      title: "Fix release branch merge conflict",
      description: "Resolve conflicts before release",
      state: "opened",
      source_branch: "feature/fix-mr",
      target_branch: "master",
      author: { id: "u-1", name: "alice" },
      assignee: { id: "u-2", username: "bob" },
      web_url: "https://codeup.aliyun.com/repo/merge_requests/88",
      created_at: "2026-04-18T00:00:00Z",
      updated_at: "2026-04-18T01:00:00Z",
      ...overrides,
    };
  }

  test("normal mode prints MR details", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: makeMrDetail() }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "mr", "view", "12345", "88"]);

    const text = logs.join("\n");
    assert.ok(text.includes("Merge Request: Fix release branch merge conflict"));
    assert.ok(text.includes("opened"));
    assert.ok(text.includes("feature/fix-mr"));
    assert.ok(text.includes("master"));
    assert.ok(text.includes("alice"));
    assert.ok(text.includes("bob"));
    assert.ok(text.includes("https://codeup.aliyun.com/repo/merge_requests/88"));
  });

  test("--json prints mapped MR details", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: makeMrDetail() }));
    const { stdout, logs } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "88"]);

    assert.equal(logs.length, 0, "json mode should not print details logs");
    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.id, 88);
    assert.equal(payload.title, "Fix release branch merge conflict");
    assert.equal(payload.description, "Resolve conflicts before release");
    assert.equal(payload.state, "opened");
    assert.equal(payload.sourceBranch, "feature/fix-mr");
    assert.equal(payload.targetBranch, "master");
    assert.deepEqual(payload.author, { id: "u-1", name: "alice" });
    assert.deepEqual(payload.assignee, { id: "u-2", name: "bob" });
    assert.equal(payload.webUrl, "https://codeup.aliyun.com/repo/merge_requests/88");
    assert.equal(payload.createdAt, "2026-04-18T00:00:00Z");
    assert.equal(payload.updatedAt, "2026-04-18T01:00:00Z");
  });

  test("--json uses stable fallbacks for missing optional fields", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({
      data: makeMrDetail({
        iid: undefined,
        description: undefined,
        source_branch: undefined,
        target_branch: undefined,
        author: { id: "u-1", username: "alice-login" },
        assignee: null,
        web_url: undefined,
        updated_at: undefined,
      }),
    }));
    const { stdout } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "188"]);

    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.id, 188);
    assert.equal(payload.description, "");
    assert.equal(payload.sourceBranch, "");
    assert.equal(payload.targetBranch, "");
    assert.deepEqual(payload.author, { id: "u-1", name: "alice-login" });
    assert.deepEqual(payload.assignee, { id: "", name: "" });
    assert.equal(payload.webUrl, "");
    assert.equal(payload.updatedAt, "");
  });

  test("passes repoId and mrId as positive integers to getMr endpoint", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "get", async () => ({ data: makeMrDetail() }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await program.parseAsync(["node", "yunxiao", "mr", "view", "12345", "88"]);

    assert.ok(logs.some((line) => line.includes("Merge Request:")));
    assert.equal(codeupClient.get.mock.calls[0].arguments[0], "/projects/12345/merge_requests/88");
  });

  test("missing repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId is required");
  });

  test("missing mrId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "mrId is required");
  });

  test("invalid repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "abc", "88"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("partially numeric repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "123abc", "88"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("invalid mrId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "xyz"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "mrId must be a positive integer");
  });

  test("partially numeric mrId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "88x"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "mrId must be a positive integer");
  });

  test("missing codeupClient returns AUTH_MISSING and exits 1", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "88"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr.join(""));
    assert.equal(output.code, "AUTH_MISSING");
  });

  test("404 response returns NOT_FOUND and exits 1", async () => {
    const codeupClient = createMockClient();
    const err404 = new Error("Not Found");
    err404.response = { status: 404, statusText: "Not Found" };
    mock.method(codeupClient, "get", async () => {
      throw err404;
    });
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync(["node", "yunxiao", "--json", "mr", "view", "12345", "99999"]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "NOT_FOUND");
  });
});

describe("mr create command", () => {
  afterEach(() => mock.restoreAll());

  function makeCreatedMr(overrides = {}) {
    return {
      iid: 88,
      id: 188,
      title: "Fix release branch",
      description: "Release fix",
      state: "opened",
      source_branch: "feature/fix",
      target_branch: "master",
      author: { id: "u-1", name: "alice" },
      assignee: { id: "u-2", username: "bob" },
      web_url: "https://codeup.aliyun.com/repo/merge_requests/88",
      created_at: "2026-04-18T00:00:00Z",
      updated_at: "2026-04-18T01:00:00Z",
      workitem_id: "GJBL-123",
      ...overrides,
    };
  }

  async function parseCreate(program, extraArgs = []) {
    await program.parseAsync([
      "node",
      "yunxiao",
      "mr",
      "create",
      "12345",
      "--title",
      "Fix release branch",
      "--source-branch",
      "feature/fix",
      "--target-branch",
      "master",
      ...extraArgs,
    ]);
  }

  test("normal mode prints created MR details", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    const { logs } = setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program);

    const text = logs.join("\n");
    assert.ok(text.includes("Created Merge Request"));
    assert.ok(text.includes("88"));
    assert.ok(text.includes("Fix release branch"));
    assert.ok(text.includes("opened"));
    assert.ok(text.includes("feature/fix"));
    assert.ok(text.includes("master"));
    assert.ok(text.includes("https://codeup.aliyun.com/repo/merge_requests/88"));
  });

  test("--json prints mapped MR details without logs", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    const { stdout, logs } = setupCapture();
    const program = buildProgram(codeupClient, true);

    await program.parseAsync([
      "node",
      "yunxiao",
      "--json",
      "mr",
      "create",
      "12345",
      "--title",
      "Fix release branch",
      "--source-branch",
      "feature/fix",
      "--target-branch",
      "master",
    ]);

    assert.equal(logs.length, 0, "json mode should not print details logs");
    const payload = JSON.parse(stdout.join(""));
    assert.equal(payload.id, 88);
    assert.equal(payload.title, "Fix release branch");
    assert.equal(payload.description, "Release fix");
    assert.equal(payload.state, "opened");
    assert.equal(payload.sourceBranch, "feature/fix");
    assert.equal(payload.targetBranch, "master");
    assert.deepEqual(payload.author, { id: "u-1", name: "alice" });
    assert.deepEqual(payload.assignee, { id: "u-2", name: "bob" });
    assert.equal(payload.webUrl, "https://codeup.aliyun.com/repo/merge_requests/88");
    assert.equal(payload.createdAt, "2026-04-18T00:00:00Z");
    assert.equal(payload.updatedAt, "2026-04-18T01:00:00Z");
    assert.equal(payload.workitemId, "GJBL-123");
  });

  test("passes required payload fields to create endpoint", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program);

    const call = codeupClient.post.mock.calls[0];
    assert.equal(call.arguments[0], "/projects/12345/merge_requests");
    assert.deepEqual(call.arguments[1], {
      title: "Fix release branch",
      source_branch: "feature/fix",
      target_branch: "master",
    });
  });

  test("passes description when provided", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program, ["--description", "Release fix"]);

    assert.equal(codeupClient.post.mock.calls[0].arguments[1].description, "Release fix");
  });

  test("passes workitem_id unchanged when provided", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program, ["--workitem-id", "GJBL-123"]);

    assert.equal(codeupClient.post.mock.calls[0].arguments[1].workitem_id, "GJBL-123");
  });

  test("passes assignee_id unchanged when provided", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program, ["--assignee-id", "u-2"]);

    assert.equal(codeupClient.post.mock.calls[0].arguments[1].assignee_id, "u-2");
  });

  test("splits reviewer ids into trimmed string array", async () => {
    const codeupClient = createMockClient();
    mock.method(codeupClient, "post", async () => ({ data: makeCreatedMr() }));
    setupCapture();
    const program = buildProgram(codeupClient, false);

    await parseCreate(program, ["--reviewer-ids", "1, 2,3"]);

    assert.deepEqual(codeupClient.post.mock.calls[0].arguments[1].reviewer_ids, ["1", "2", "3"]);
  });

  test("missing repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId is required");
  });

  test("missing repoId returns INVALID_ARGS before AUTH_MISSING", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId is required");
  });

  test("missing title returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "title is required");
  });

  test("missing source branch returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "sourceBranch is required");
  });

  test("missing target branch returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "targetBranch is required");
  });

  test("invalid repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "abc",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("partially numeric repoId returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "123abc",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "repoId must be a positive integer");
  });

  test("blank workitem id returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
        "--workitem-id",
        "   ",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "workitemId must be a non-empty value");
  });

  test("empty reviewer ids returns INVALID_ARGS and exits 1", async () => {
    const codeupClient = createMockClient();
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
        "--reviewer-ids",
        ",",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "INVALID_ARGS");
    assert.equal(output.error, "reviewerIds must contain at least one id");
  });

  test("missing codeupClient returns AUTH_MISSING and exits 1", async () => {
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(null, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr.join(""));
    assert.equal(output.code, "AUTH_MISSING");
  });

  test("404 response returns NOT_FOUND and exits 1", async () => {
    const codeupClient = createMockClient();
    const err404 = new Error("Not Found");
    err404.response = { status: 404, statusText: "Not Found" };
    mock.method(codeupClient, "post", async () => {
      throw err404;
    });
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "NOT_FOUND");
  });

  test("409 response returns API_ERROR and preserves error message", async () => {
    const codeupClient = createMockClient();
    const err409 = new Error("Conflict");
    err409.response = {
      status: 409,
      statusText: "Conflict",
      data: { errorMessage: "Merge request already exists" },
    };
    mock.method(codeupClient, "post", async () => {
      throw err409;
    });
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "API_ERROR");
    assert.equal(output.error, "Merge request already exists");
  });

  test("422 response returns API_ERROR", async () => {
    const codeupClient = createMockClient();
    const err422 = new Error("Unprocessable Entity");
    err422.response = { status: 422, statusText: "Unprocessable Entity" };
    mock.method(codeupClient, "post", async () => {
      throw err422;
    });
    const { stderr, exitCodes } = setupCapture();
    const program = buildProgram(codeupClient, true);

    try {
      await program.parseAsync([
        "node",
        "yunxiao",
        "--json",
        "mr",
        "create",
        "12345",
        "--title",
        "T",
        "--source-branch",
        "feature/a",
        "--target-branch",
        "master",
      ]);
    } catch (err) {
      assert.ok(err instanceof MockExit);
    }

    assert.equal(exitCodes[0], 1);
    const output = JSON.parse(stderr[0]);
    assert.equal(output.code, "API_ERROR");
  });
});
