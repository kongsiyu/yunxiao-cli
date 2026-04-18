// test/codeup-api.test.js - Unit tests for src/codeup-api.js
import { test, describe, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createMockClient } from "./setup.js";
import { listRepos, getRepo, listMrs, getMr } from "../src/codeup-api.js";

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

describe("getRepo", () => {
  afterEach(() => mock.restoreAll());

  test("calls GET /projects/:id and returns response data", async () => {
    const client = createMockClient();
    const repo = { id: 123, name: "repo-123" };
    mock.method(client, "get", async () => ({ data: repo }));

    const result = await getRepo(client, 123);

    assert.deepEqual(result, repo);
    assert.equal(client.get.mock.calls[0].arguments[0], "/projects/123");
  });

  test("maps 401 to AUTH_FAILED", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => {
      throw make401();
    });

    await assert.rejects(
      () => getRepo(client, 123),
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
      () => getRepo(client, 123),
      (err) => {
        assert.equal(err.code, "AUTH_FAILED");
        return true;
      }
    );
  });

  test("rethrows non-auth errors like 404", async () => {
    const client = createMockClient();
    const err404 = new Error("Not Found");
    err404.response = { status: 404 };
    mock.method(client, "get", async () => {
      throw err404;
    });

    await assert.rejects(
      () => getRepo(client, 123),
      (err) => err === err404
    );
  });
});

describe("listMrs", () => {
  afterEach(() => mock.restoreAll());

  test("calls GET /projects/:id/merge_requests and returns response data", async () => {
    const client = createMockClient();
    const mrs = [{ id: 1, title: "mr-1" }];
    mock.method(client, "get", async () => ({ data: mrs }));

    const result = await listMrs(client, 123, {});

    assert.deepEqual(result, mrs);
    assert.equal(client.get.mock.calls[0].arguments[0], "/projects/123/merge_requests");
  });

  test("passes page, per_page and state query params", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => ({ data: [] }));

    await listMrs(client, 123, { page: 2, perPage: 10, state: "opened" });

    const call = client.get.mock.calls[0];
    assert.deepEqual(call.arguments[1], { params: { page: 2, per_page: 10, state: "opened" } });
  });

  test("maps 401 to AUTH_FAILED", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => {
      throw make401();
    });

    await assert.rejects(
      () => listMrs(client, 123, {}),
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
      () => listMrs(client, 123, {}),
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
      () => listMrs(client, 123, {}),
      (err) => err === err500
    );
  });
});

describe("getMr", () => {
  afterEach(() => mock.restoreAll());

  test("calls GET /projects/:repoId/merge_requests/:mrId and returns response data", async () => {
    const client = createMockClient();
    const mr = { id: 88, title: "mr-88" };
    mock.method(client, "get", async () => ({ data: mr }));

    const result = await getMr(client, 123, 88);

    assert.deepEqual(result, mr);
    assert.equal(client.get.mock.calls[0].arguments[0], "/projects/123/merge_requests/88");
  });

  test("maps 401 to AUTH_FAILED", async () => {
    const client = createMockClient();
    mock.method(client, "get", async () => {
      throw make401();
    });

    await assert.rejects(
      () => getMr(client, 123, 88),
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
      () => getMr(client, 123, 88),
      (err) => {
        assert.equal(err.code, "AUTH_FAILED");
        return true;
      }
    );
  });

  test("rethrows 404 for command-level NOT_FOUND handling", async () => {
    const client = createMockClient();
    const err404 = new Error("Not Found");
    err404.response = { status: 404 };
    mock.method(client, "get", async () => {
      throw err404;
    });

    await assert.rejects(
      () => getMr(client, 123, 88),
      (err) => err === err404
    );
  });
});
