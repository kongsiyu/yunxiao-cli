// test/resolve.test.js
// 序列号解析专项测试 (Story 7.3)
// 测试 resolveWorkitemId 的所有边界情况
//
// Mock 策略：Strategy A — mock client.post / client.get（HTTP 层）
// resolveWorkitemId → searchWorkitems → client.post(url, body)
// 通过替换 createMockClient() 对象上的 post 方法控制响应，
// 同时执行真实 api.js 代码路径。

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkitemId } from '../src/api.js';
import { AppError, ERROR_CODE } from '../src/errors.js';
import { createMockClient, makeWorkitem } from './setup.js';

describe('resolveWorkitemId', () => {
  let client;

  beforeEach(() => {
    client = createMockClient();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // AC1: 合法序列号 → 调用 searchWorkitems（全类型），精确匹配 serialNumber，返回 id
  // ---------------------------------------------------------------------------

  test('合法序列号 GJBL-1 → 调用 searchWorkitems，返回匹配工作项 id', async () => {
    const item = makeWorkitem({ id: 'wi-uuid-001', serialNumber: 'GJBL-1' });
    mock.method(client, 'post', async () => ({ data: [item] }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1');

    assert.equal(result, 'wi-uuid-001');
    assert.equal(client.post.mock.calls.length, 1);
  });

  test('searchWorkitems 使用全类型 category=Req,Task,Bug，perPage=200，支持分页循环', async () => {
    const item = makeWorkitem({ id: 'wi-uuid-002', serialNumber: 'PROJ-42' });
    mock.method(client, 'post', async () => ({ data: [item], headers: { 'x-total': '1' } }));

    await resolveWorkitemId(client, 'myOrg', 'mySpace', 'PROJ-42');

    const body = client.post.mock.calls[0].arguments[1];
    assert.equal(body.category, 'Req,Task,Bug');
    assert.equal(body.spaceId, 'mySpace');
    // perPage 扩大至 200；支持分页循环（page 1 → page N）
    assert.equal(body.perPage, 200);
  });

  test('结果中有多个工作项时，精确匹配 serialNumber', async () => {
    const items = [
      makeWorkitem({ id: 'wi-no-match', serialNumber: 'GJBL-10' }),
      makeWorkitem({ id: 'wi-match', serialNumber: 'GJBL-1' }),
      makeWorkitem({ id: 'wi-no-match-2', serialNumber: 'GJBL-11' }),
    ];
    mock.method(client, 'post', async () => ({ data: items }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1');

    assert.equal(result, 'wi-match');
  });

  // ---------------------------------------------------------------------------
  // AC1 (大小写不敏感): 小写序列号等效于大写
  // ---------------------------------------------------------------------------

  test('小写序列号 gjbl-1 与 GJBL-1 等效', async () => {
    const item = makeWorkitem({ id: 'wi-uuid-003', serialNumber: 'GJBL-1' });
    mock.method(client, 'post', async () => ({ data: [item] }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', 'gjbl-1');

    assert.equal(result, 'wi-uuid-003');
  });

  // ---------------------------------------------------------------------------
  // AC2: 序列号不存在 → 抛出 NOT_FOUND AppError
  // ---------------------------------------------------------------------------

  test('序列号不存在 → 抛出 AppError(NOT_FOUND)', async () => {
    mock.method(client, 'post', async () => ({ data: [] }));

    await assert.rejects(
      () => resolveWorkitemId(client, 'org1', 'space1', 'GJBL-999'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.NOT_FOUND);
        assert.ok(err.message.includes('GJBL-999'));
        return true;
      }
    );
  });

  test('搜索结果中无 serialNumber 匹配 → 抛出 AppError(NOT_FOUND)', async () => {
    const items = [
      makeWorkitem({ id: 'wi-x', serialNumber: 'OTHER-1' }),
    ];
    mock.method(client, 'post', async () => ({ data: items }));

    await assert.rejects(
      () => resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.NOT_FOUND);
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // AC3: 非序列号格式（UUID、任意字符串）→ 直接返回，不触发搜索
  // 实现规则：不匹配 /^[A-Z]+-\d+$/i 的标识符均直接返回（视为已是 UUID）
  // ---------------------------------------------------------------------------

  test('非序列号格式（含数字的多段字符串）→ 直接返回，不调用 client.post', async () => {
    const id = 'abc-123-def-456-789';
    mock.method(client, 'post', async () => ({ data: [] }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', id);

    assert.equal(result, id);
    assert.equal(client.post.mock.calls.length, 0);
  });

  test('标准 UUID v4 格式 → 直接返回，不调用 client.post', async () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    mock.method(client, 'post', async () => ({ data: [] }));

    const result = await resolveWorkitemId(client, 'org1', 'space1', uuid);

    assert.equal(result, uuid);
    assert.equal(client.post.mock.calls.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 边界情况：null / undefined → 抛出 INVALID_ARGS（不发起 HTTP 请求）
  // 注：原实现返回 null；7-2 重构后改为强制要求参数，抛出 INVALID_ARGS
  // ---------------------------------------------------------------------------

  test('identifier 为 null → 抛出 AppError(INVALID_ARGS)，不调用 client.post', async () => {
    mock.method(client, 'post', async () => ({ data: [] }));

    await assert.rejects(
      () => resolveWorkitemId(client, 'org1', 'space1', null),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.INVALID_ARGS);
        return true;
      }
    );
    assert.equal(client.post.mock.calls.length, 0);
  });

  test('identifier 为 undefined → 抛出 AppError(INVALID_ARGS)，不调用 client.post', async () => {
    mock.method(client, 'post', async () => ({ data: [] }));

    await assert.rejects(
      () => resolveWorkitemId(client, 'org1', 'space1', undefined),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.INVALID_ARGS);
        return true;
      }
    );
    assert.equal(client.post.mock.calls.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 防御路径：searchWorkitems 返回 null → 视为空结果，抛 NOT_FOUND
  // 实现：(results || []).find(...) 的 || [] 守卫覆盖
  // ---------------------------------------------------------------------------

  test('searchWorkitems 返回 null → 抛出 AppError(NOT_FOUND)', async () => {
    mock.method(client, 'post', async () => ({ data: null }));

    await assert.rejects(
      () => resolveWorkitemId(client, 'org1', 'space1', 'GJBL-1'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.code, ERROR_CODE.NOT_FOUND);
        return true;
      }
    );
  });
});
