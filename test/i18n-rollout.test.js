import { afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';

import { registerAuthCommands } from '../src/commands/auth.js';
import { registerProjectCommands } from '../src/commands/project.js';
import { registerSprintCommands } from '../src/commands/sprint.js';
import { registerWhoamiCommand } from '../src/commands/whoami.js';
import { registerWorkitemCommands } from '../src/commands/workitem.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { setLanguage } from '../src/i18n/index.js';
import { printError } from '../src/output.js';
import { createMockClient } from './setup.js';

class MockExit extends Error {
  constructor(code) {
    super(`process.exit(${code})`);
    this.exitCode = code;
  }
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

function buildWithErrorHandling(jsonMode) {
  return (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        printError(ERROR_CODE.AUTH_FAILED, 'Authentication failed or token expired. Run: yunxiao auth login', jsonMode);
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

function buildProgram(jsonMode = false) {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {} });
  program.option('--json', 'Output as JSON');
  return { program, withErrorHandling: buildWithErrorHandling(jsonMode) };
}

function setupCapture() {
  const logs = [];
  const errors = [];
  const stdout = [];
  const stderr = [];
  const exitCodes = [];

  mock.method(console, 'log', (...args) => {
    logs.push(stripAnsi(args.join(' ')));
  });
  mock.method(console, 'error', (...args) => {
    errors.push(stripAnsi(args.join(' ')));
  });
  mock.method(process.stdout, 'write', (data) => {
    stdout.push(stripAnsi(String(data)));
    return true;
  });
  mock.method(process.stderr, 'write', (data) => {
    stderr.push(stripAnsi(String(data)));
    return true;
  });
  mock.method(process, 'exit', (code) => {
    exitCodes.push(code ?? 0);
    throw new MockExit(code);
  });

  return { logs, errors, stdout, stderr, exitCodes };
}

afterEach(() => {
  mock.restoreAll();
  setLanguage('en');
});

describe('Story 11.2 auth and whoami localization', () => {
  test('auth status shows Chinese human-readable output in zh mode', async () => {
    setLanguage('zh');
    const { logs } = setupCapture();
    const { program } = buildProgram();

    registerAuthCommands(program, {
      loadSavedConfig: () => null,
    });

    await program.parseAsync(['node', 'yunxiao', 'auth', 'status']);

    const output = logs.join('\n');
    assert.match(output, /认证状态/);
    assert.match(output, /未登录/);
    assert.match(output, /yunxiao auth login/);
  });

  test('auth login non-interactive keeps English fallback outside zh mode', async () => {
    setLanguage('en');
    const { logs } = setupCapture();
    const { program } = buildProgram();
    let savedConfig = null;

    registerAuthCommands(program, {
      saveConfig: (config) => {
        savedConfig = config;
      },
    });

    await program.parseAsync([
      'node',
      'yunxiao',
      'auth',
      'login',
      '--token',
      'pat-123',
      '--org-id',
      'org-123',
    ]);

    assert.deepEqual(savedConfig, { token: 'pat-123', orgId: 'org-123' });
    const output = logs.join('\n');
    assert.match(output, /Login successful!/);
    assert.match(output, /Config saved to ~\/\.yunxiao\/config\.json/);
  });

  test('whoami shows Chinese labels in zh mode', async () => {
    setLanguage('zh');
    const { logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram();
    const client = createMockClient();

    mock.method(client, 'get', async () => ({
      data: {
        id: 'user-1',
        name: '张三',
        email: 'zhangsan@example.com',
        lastOrganization: '研发组织',
        createdAt: '2024-01-02T03:04:05Z',
      },
    }));

    registerWhoamiCommand(program, client, withErrorHandling);

    await program.parseAsync(['node', 'yunxiao', 'whoami']);

    const output = logs.join('\n');
    assert.match(output, /当前用户/);
    assert.match(output, /名称/);
    assert.match(output, /邮箱/);
    assert.match(output, /组织/);
    assert.match(output, /创建时间/);
  });
});

describe('Story 11.2 project and workitem localization', () => {
  test('project list shows Chinese human-readable labels in zh mode', async () => {
    setLanguage('zh');
    const { logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram();
    const client = createMockClient();

    mock.method(client, 'post', async () => ({
      data: [
        {
          id: 'proj-1',
          customCode: 'DEMO',
          name: '演示项目',
          status: { name: 'Active' },
          gmtCreate: '2024-01-01T00:00:00Z',
        },
      ],
    }));

    registerProjectCommands(program, client, 'org-1', withErrorHandling, false);

    await program.parseAsync(['node', 'yunxiao', 'project', 'list']);

    const output = logs.join('\n');
    assert.match(output, /找到 1 个项目/);
    assert.match(output, /状态/);
    assert.match(output, /创建时间/);
  });

  test('project list json mode keeps stable English keys in stdout', async () => {
    setLanguage('zh');
    const { stdout, logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram(true);
    const client = createMockClient();

    mock.method(client, 'post', async () => ({
      data: [
        {
          id: 'proj-1',
          customCode: 'DEMO',
          name: '演示项目',
          status: { name: 'Active' },
          gmtCreate: '2024-01-01T00:00:00Z',
        },
      ],
    }));

    registerProjectCommands(program, client, 'org-1', withErrorHandling, true);

    await program.parseAsync(['node', 'yunxiao', '--json', 'project', 'list']);

    assert.equal(logs.length, 0);
    const output = JSON.parse(stdout.join(''));
    assert.deepEqual(output, {
      projects: [{ projectId: 'proj-1', name: '演示项目' }],
      total: 1,
    });
  });

  test('workitem view uses Chinese labels in zh mode', async () => {
    setLanguage('zh');
    const { logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram();
    const client = createMockClient();
    const workitemId = 'abc12300-0000-0000-0000-000000000001';

    mock.method(client, 'get', async () => ({
      data: {
        id: workitemId,
        serialNumber: 'DEMO-1',
        subject: '修复本地化',
        status: { displayName: 'In Progress' },
        workitemType: { name: 'Task' },
        priority: { name: 'P1' },
        iteration: { name: 'Sprint 10' },
        space: { name: '演示项目' },
        assignedTo: { name: '张三' },
        creator: { name: '李四' },
        gmtCreate: '2024-01-01T00:00:00Z',
        gmtModified: '2024-01-02T00:00:00Z',
        labels: [{ name: 'i18n' }],
        description: '修复高频命令中文输出',
      },
    }));

    registerWorkitemCommands(program, client, 'org-1', 'proj-1', withErrorHandling, 'user-1', false);

    await program.parseAsync(['node', 'yunxiao', 'wi', 'view', workitemId]);

    const output = logs.join('\n');
    assert.match(output, /工作项详情/);
    assert.match(output, /编号/);
    assert.match(output, /优先级/);
    assert.match(output, /创建人/);
    assert.match(output, /描述/);
  });

  test('workitem update localizes common error messages without changing error code', async () => {
    setLanguage('zh');
    const { stderr, exitCodes } = setupCapture();
    const { program, withErrorHandling } = buildProgram(false);
    const client = createMockClient();
    const workitemId = 'abc12300-0000-0000-0000-000000000002';

    registerWorkitemCommands(program, client, 'org-1', 'proj-1', withErrorHandling, 'user-1', false);

    try {
      await program.parseAsync(['node', 'yunxiao', 'wi', 'update', workitemId]);
    } catch (error) {
      if (!(error instanceof MockExit)) {
        throw error;
      }
    }

    assert.equal(exitCodes[0], 1);
    const output = stderr.join('');
    assert.match(output, /Error \[INVALID_ARGS\]/);
    assert.match(output, /没有可更新的字段/);
  });

  test('workitem update json mode keeps stdout contract stable', async () => {
    setLanguage('zh');
    const { stdout, logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram(true);
    const client = createMockClient();
    const workitemId = 'abc12300-0000-0000-0000-000000000003';

    mock.method(client, 'put', async () => ({ data: {} }));
    mock.method(client, 'get', async () => ({
      data: {
        id: workitemId,
        subject: 'New title',
        status: { name: 'Doing' },
      },
    }));

    registerWorkitemCommands(program, client, 'org-1', 'proj-1', withErrorHandling, 'user-1', true);

    await program.parseAsync(['node', 'yunxiao', '--json', 'wi', 'update', workitemId, '--title', 'New title']);

    assert.equal(logs.length, 0);
    const output = JSON.parse(stdout.join(''));
    assert.equal(output.id, workitemId);
    assert.equal(output.subject, 'New title');
  });
});

describe('Story 11.2 sprint localization and json guardrails', () => {
  test('sprint view shows Chinese labels in zh mode', async () => {
    setLanguage('zh');
    const { logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram();
    const client = createMockClient();

    mock.method(client, 'get', async () => ({
      data: {
        id: 'sprint-1',
        name: '迭代 1',
        status: 'DOING',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-15T00:00:00Z',
        goal: '完成中文化',
      },
    }));
    mock.method(client, 'post', async () => ({
      data: [
        { id: 'wi-1', workitemType: { name: 'Task' }, status: { done: true } },
        { id: 'wi-2', workitemType: { name: 'Bug' }, status: { stage: 'DOING' } },
      ],
    }));

    registerSprintCommands(program, client, 'org-1', 'proj-1', withErrorHandling, false);

    await program.parseAsync(['node', 'yunxiao', 'sprint', 'view', 'sprint-1']);

    const output = logs.join('\n');
    assert.match(output, /迭代详情/);
    assert.match(output, /周期/);
    assert.match(output, /工作项统计/);
    assert.match(output, /已完成/);
    assert.match(output, /按类型/);
  });

  test('sprint view json mode keeps english schema in stdout', async () => {
    setLanguage('zh');
    const { stdout, logs } = setupCapture();
    const { program, withErrorHandling } = buildProgram(true);
    const client = createMockClient();

    mock.method(client, 'get', async () => ({
      data: {
        id: 'sprint-1',
        name: '迭代 1',
        status: 'DOING',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-15T00:00:00Z',
      },
    }));
    mock.method(client, 'post', async () => ({
      data: [{ id: 'wi-1', workitemType: { name: 'Task' }, status: { done: true } }],
    }));

    registerSprintCommands(program, client, 'org-1', 'proj-1', withErrorHandling, true);

    await program.parseAsync(['node', 'yunxiao', '--json', 'sprint', 'view', 'sprint-1']);

    assert.equal(logs.length, 0);
    const output = JSON.parse(stdout.join(''));
    assert.deepEqual(Object.keys(output), ['sprint', 'stats']);
    assert.equal(output.stats.total, 1);
    assert.equal(output.stats.done, 1);
  });
});
