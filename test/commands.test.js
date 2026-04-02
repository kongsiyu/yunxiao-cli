// test/commands.test.js
// Story 7.4: 命令层测试
// 测试 CLI 命令层的核心输出路径：--json 格式、错误码契约、Auth 缺失行为
//
// 测试策略：Strategy A — mock client.post/get（HTTP 层）
//   src/commands/workitem.js 通过 ESM 直接 import api.js，模块导出为 sealed，
//   无法用 mock.method() 替换。正确做法：传入 mock client 给 registerWorkitemCommands，
//   通过 mock.method(client, 'post', ...) 控制 API 响应，让真实代码路径执行。
//
// 输出捕获：
//   mock.method(process.stdout, 'write', ...) — 捕获 printJson 写入
//   mock.method(process.stderr, 'write', ...) — 捕获 printError 写入
//   mock.method(process, 'exit', ...)         — 阻止进程退出，记录 exit code
//
// 不 import src/index.js — 该文件是 CLI 入口，加载时会读取 config 并发 API 请求

import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { registerWorkitemCommands } from '../src/commands/workitem.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { printJson, printError } from '../src/output.js';
import { createMockClient, makeWorkitem } from './setup.js';

// ---------------------------------------------------------------------------
// MockExit：替换 process.exit，防止测试进程被终止
// ---------------------------------------------------------------------------
class MockExit extends Error {
  constructor(code) {
    super(`process.exit(${code})`);
    this.exitCode = code;
  }
}

// ---------------------------------------------------------------------------
// setupCapture()：捕获 stdout/stderr 写入和 process.exit 调用
// 在 afterEach 中调用 mock.restoreAll() 即可还原，无需手动 restore
// ---------------------------------------------------------------------------
function setupCapture() {
  const stdout = [];
  const stderr = [];
  const exitCodes = [];
  mock.method(process.stdout, 'write', (data) => { stdout.push(String(data)); return true; });
  mock.method(process.stderr, 'write', (data) => { stderr.push(String(data)); return true; });
  mock.method(process, 'exit', (code) => {
    exitCodes.push(code ?? 0);
    throw new MockExit(code);
  });
  return { stdout, stderr, exitCodes };
}

// ---------------------------------------------------------------------------
// buildWithErrorHandling(jsonMode)：复制 src/index.js 中的 withErrorHandling 逻辑
// 不能直接 import index.js（入口文件加载时会执行 CLI 初始化逻辑）
// ---------------------------------------------------------------------------
function buildWithErrorHandling(jsonMode) {
  return (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
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

// ---------------------------------------------------------------------------
// buildProgram(client, orgId, projectId, jsonMode)：构建 Commander 程序
// exitOverride()    → 防止 Commander 内部调用 process.exit（parse 错误时抛 CommanderError）
// configureOutput() → 抑制 Commander 自身的错误输出（不污染 stderr 捕获）
// ---------------------------------------------------------------------------
function buildProgram(client, orgId, projectId, jsonMode) {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {} });
  program.option('--json', 'Output as JSON');
  const withErrorHandling = buildWithErrorHandling(jsonMode);
  registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, null, jsonMode);
  return program;
}

// ---------------------------------------------------------------------------
// AC1: wi list --json → stdout 是合法 JSON 且包含 total 字段
// ---------------------------------------------------------------------------
describe('命令层：wi list --json 输出格式', () => {
  afterEach(() => mock.restoreAll());

  test('stdout 是合法 JSON 且包含 total 字段', async () => {
    const client = createMockClient();
    const items = [makeWorkitem({ id: 'wi-001' }), makeWorkitem({ id: 'wi-002' })];
    // searchWorkitems: client.post 返回 { data: array } → items=array, total=items.length
    mock.method(client, 'post', async () => ({ data: items }));

    const { stdout } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);

    assert.ok(stdout.length > 0, 'stdout 应有输出');
    const output = JSON.parse(stdout.join(''));
    assert.ok('total' in output, 'JSON 输出应包含 total 字段');
    assert.ok(Array.isArray(output.items), 'JSON 输出应包含 items 数组');
    assert.equal(typeof output.total, 'number', 'total 应为数字类型');
  });

  test('items 数组长度与 mock 数据一致', async () => {
    const client = createMockClient();
    const items = [makeWorkitem(), makeWorkitem(), makeWorkitem()];
    mock.method(client, 'post', async () => ({ data: items }));

    const { stdout } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);

    const output = JSON.parse(stdout.join(''));
    assert.equal(output.items.length, 3);
    assert.equal(output.total, 3);
  });

  test('x-total header 被解析为 total 值（override items.length）', async () => {
    const client = createMockClient();
    const items = [makeWorkitem({ id: 'wi-page1' })];
    // x-total header 表示服务端总数（可大于当前页 items 数量）
    mock.method(client, 'post', async () => ({
      data: items,
      headers: { 'x-total': '42' },
    }));

    const { stdout } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);

    const output = JSON.parse(stdout.join(''));
    assert.equal(output.total, 42, 'total 应来自 x-total header');
    assert.equal(output.items.length, 1, 'items 仍为当前页数量');
  });

  test('API 返回空数组时，total=0，items=[]', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => ({ data: [] }));

    const { stdout } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);

    const output = JSON.parse(stdout.join(''));
    assert.equal(output.total, 0);
    assert.deepEqual(output.items, []);
  });
});

// ---------------------------------------------------------------------------
// AC2: 认证缺失 → stderr 含 AUTH_MISSING 错误码，退出码非零
// ---------------------------------------------------------------------------
describe('命令层：AUTH_MISSING 错误处理', () => {
  afterEach(() => mock.restoreAll());

  test('withErrorHandling 捕获 AUTH_MISSING → stderr 含错误码，exit(1)', async () => {
    const { stderr, exitCodes } = setupCapture();
    const withErrorHandling = buildWithErrorHandling(true);

    try {
      await withErrorHandling(async () => {
        throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      })();
    } catch (e) {
      assert.ok(e instanceof MockExit, '应抛出 MockExit');
    }

    assert.equal(exitCodes[0], 1, 'exit code 应为 1');
    assert.ok(stderr.length > 0, 'stderr 应有输出');
    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, ERROR_CODE.AUTH_MISSING);
    assert.ok(typeof errOutput.error === 'string', 'error 字段应为字符串');
  });

  test('AUTH_MISSING: stderr 格式为 {"error":"...","code":"AUTH_MISSING"}', async () => {
    const { stderr } = setupCapture();
    const withErrorHandling = buildWithErrorHandling(true);

    try {
      await withErrorHandling(async () => {
        throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required');
      })();
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, 'AUTH_MISSING');
    assert.ok('error' in errOutput, 'stderr JSON 应含 error 字段');
    assert.ok(!('stack' in errOutput), 'stderr JSON 不应暴露 stack trace');
  });

  test('AUTH_MISSING: stdout 无输出', async () => {
    const { stdout } = setupCapture();
    const withErrorHandling = buildWithErrorHandling(true);

    try {
      await withErrorHandling(async () => {
        throw new AppError(ERROR_CODE.AUTH_MISSING, 'Auth missing');
      })();
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    assert.equal(stdout.join(''), '', 'AUTH_MISSING 错误时 stdout 应无输出');
  });
});

// ---------------------------------------------------------------------------
// AC3: --json 模式下 API 错误 → stdout 无输出，stderr 含 JSON 错误格式
// ---------------------------------------------------------------------------
describe('命令层：--json 模式下 API 错误', () => {
  afterEach(() => mock.restoreAll());

  test('HTTP 500 错误：stdout 无输出，stderr 含 {"error":"...","code":"API_ERROR"}', async () => {
    const client = createMockClient();
    const apiErr = Object.assign(new Error('Internal Server Error'), {
      response: {
        status: 500,
        data: { errorMessage: 'server error' },
        statusText: 'Internal Server Error',
      },
    });
    mock.method(client, 'post', async () => { throw apiErr; });

    const { stdout, stderr } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    try {
      await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    assert.equal(stdout.join(''), '', 'API 错误时 stdout 应无输出');
    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, 'API_ERROR');
    assert.ok(typeof errOutput.error === 'string');
  });

  test('HTTP 404 错误：stderr 含 {"error":"...","code":"NOT_FOUND"}', async () => {
    const client = createMockClient();
    const notFoundErr = Object.assign(new Error('Not Found'), {
      response: {
        status: 404,
        data: { errorMessage: 'workitem not found' },
        statusText: 'Not Found',
      },
    });
    mock.method(client, 'post', async () => { throw notFoundErr; });

    const { stdout, stderr } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    try {
      await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    assert.equal(stdout.join(''), '', '404 错误时 stdout 应无输出');
    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, 'NOT_FOUND');
  });

  test('exit code 为 1（非零）', async () => {
    const client = createMockClient();
    const apiErr = Object.assign(new Error('Bad Gateway'), {
      response: { status: 502, data: {}, statusText: 'Bad Gateway' },
    });
    mock.method(client, 'post', async () => { throw apiErr; });

    const { exitCodes } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    try {
      await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    assert.ok(exitCodes.length > 0, 'process.exit 应被调用');
    assert.equal(exitCodes[0], 1, 'exit code 应为 1');
  });

  test('无 response 属性的错误（网络异常）→ stderr 含 API_ERROR', async () => {
    const client = createMockClient();
    mock.method(client, 'post', async () => { throw new Error('ECONNREFUSED'); });

    const { stdout, stderr } = setupCapture();
    const program = buildProgram(client, 'org1', 'proj1', true);

    try {
      await program.parseAsync(['node', 'yunxiao', 'wi', 'list']);
    } catch (e) { if (!(e instanceof MockExit)) throw e; }

    assert.equal(stdout.join(''), '', '网络错误时 stdout 应无输出');
    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, 'API_ERROR');
  });
});

// ---------------------------------------------------------------------------
// output 模块：printJson / printError 格式契约验证
// ---------------------------------------------------------------------------
describe('output 模块：printJson / printError 格式验证', () => {
  afterEach(() => mock.restoreAll());

  test('printJson: stdout 输出合法 JSON，以换行结尾', () => {
    const { stdout } = setupCapture();
    printJson({ items: [{ id: 'x' }], total: 1 });

    const raw = stdout.join('');
    assert.ok(raw.endsWith('\n'), 'JSON 输出应以换行结尾');
    const parsed = JSON.parse(raw.trim());
    assert.equal(parsed.total, 1);
    assert.equal(parsed.items[0].id, 'x');
  });

  test('printJson: 可序列化为嵌套对象', () => {
    const { stdout } = setupCapture();
    printJson({ nested: { a: 1 }, arr: [1, 2, 3] });

    const parsed = JSON.parse(stdout.join('').trim());
    assert.equal(parsed.nested.a, 1);
    assert.deepEqual(parsed.arr, [1, 2, 3]);
  });

  test('printError jsonMode=true: stderr 输出 {"error":"...","code":"..."} 格式', () => {
    const { stderr } = setupCapture();
    printError('API_ERROR', 'something went wrong', true);

    const errOutput = JSON.parse(stderr.join(''));
    assert.equal(errOutput.code, 'API_ERROR');
    assert.equal(errOutput.error, 'something went wrong');
  });

  test('printError jsonMode=true: 所有 ERROR_CODE 均可正确输出', () => {
    for (const code of Object.values(ERROR_CODE)) {
      const { stderr } = setupCapture();
      printError(code, `test error for ${code}`, true);
      mock.restoreAll();

      const errOutput = JSON.parse(stderr.join(''));
      assert.equal(errOutput.code, code, `ERROR_CODE.${code} 应正确写入 stderr`);
    }
  });

  test('printError jsonMode=false: stderr 输出人类可读格式（含错误码和消息）', () => {
    const { stderr } = setupCapture();
    printError('AUTH_MISSING', 'not authenticated', false);

    const raw = stderr.join('');
    assert.ok(raw.includes('AUTH_MISSING'), '非 json 模式应包含错误码');
    assert.ok(raw.includes('not authenticated'), '非 json 模式应包含错误消息');
  });
});
