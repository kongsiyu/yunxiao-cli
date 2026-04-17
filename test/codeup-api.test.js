// test/codeup-api.test.js - Unit tests for src/codeup-api.js
import { test, describe, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createMockClient } from "./setup.js";
import { listRepos } from "../src/codeup-api.js";

function make401() {
  const err = new Error("Unauthorized");
  err.response = { status: 401 };
  return err;
}

function make403() {
  const err = new Error("Forbidden");
  err.response = { status: 403 };
  return err;
}

describe("listRepos", () => {
  afterEach(() => mock.restoreAll());

  test("calls GET /projects and returns response data", async () => {
    const client = createMockClient();
    const repos = [{ id: 1, name: "repo-1" }];
    mock.method(client, "get", async () => ({ data: repos }));

    const result = await listRepos(client, {});

    assert.deepEqual(result, repos);
    assert.equal(client.get.mock.calls[0].arguments[0], "/projects");
  });

  test("passes page and per_page query params", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => ({ data: [] }));

    await listRepos(client, { page: 2, perPage: 10 });

    const call = client.get.mock.calls[0];
    assert.deepEqual(call.arguments[1], { params: { page: 2, per_page: 10 } });
  });

  test("maps 401 to AUTH_FAILED", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => {
      throw make401();
    });

    await assert.rejects(
      () => listRepos(client, {}),
      (err) => {
        assert.equal(err.code, "AUTH_FAILED");
        return true;
      }
    );
  });

  test("maps 403 to AUTH_FAILED", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => {
      throw make403();
    });

    await assert.rejects(
      () => listRepos(client, {}),
      (err) => {
        assert.equal(err.code, "AUTH_FAILED");
        return true;
      }
    );
  });

  test("rethrows non-auth errors", async () => {
    const client = createMockClient();
    const err500 = new Error("Server Error");
    err500.response = { status: 500 };
    mock.method(client, "get", async () => {
      throw err500;
    });

    await assert.rejects(
      () => listRepos(client, {}),
      (err) => err === err500
    );
  });
});
