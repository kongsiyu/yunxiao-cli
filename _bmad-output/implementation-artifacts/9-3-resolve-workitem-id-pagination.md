# Story 9.3：resolveWorkitemId 分页完整性改进

Status: ready-for-dev

## Story

As a developer,
I want the serial number resolution to handle projects with many workitems reliably,
So that commands like `wi view GJBL-100` work correctly even in large projects.

## Acceptance Criteria

1. **Given** 项目工作项总数超过 50 条
   **When** 执行 `wi view <serialNumber>`，目标工作项不在前 50 条结果中
   **Then** 序列号仍能正确解析（通过分页循环或扩大 perPage 实现）

2. **Given** 评估云效 API 是否支持 `serialNumber` 作为 searchWorkitems 过滤参数
   **When** 通过代码分析确认
   **Then** 若支持：优先使用 API 级别 serialNumber 过滤；若不支持：使用分页循环并在文档中标注已知限制

3. **Given** `resolveWorkitemId` 修改后
   **When** 运行 `test/resolve.test.js`
   **Then** 所有原有 11 个测试用例仍全部通过

## Tasks / Subtasks

- [ ] 评估云效 API searchWorkitems 是否支持 `serialNumber` 过滤参数 (AC: #2)
  - [ ] 查阅 `_bmad-output/research/api-verification-v2.md` 中 SearchWorkitems 字段说明
  - [ ] 分析 `src/api.js` searchWorkitems 的 conditionGroups 构造逻辑，判断是否可添加 serialNumber condition
  - [ ] 记录评估结论（支持 / 不支持）

- [ ] 根据评估结论修改 `resolveWorkitemId` (AC: #1, #2)
  - [ ] **路径 A（API 支持 serialNumber 过滤）**：在 searchWorkitems conditionGroups 中添加 serialNumber 精确匹配 condition，去掉本地 perPage: 50 限制
  - [ ] **路径 B（API 不支持）**：将 perPage 从 50 扩大至 200，并添加分页循环（page 1 → page N，直到 match 或遍历完）；在函数注释中标注最大遍历页数

- [ ] 更新测试 (AC: #3)
  - [ ] 确认 `test/resolve.test.js` 所有 11 个用例仍通过
  - [ ] 如选路径 A，新增 1 个测试：验证 searchWorkitems 被调用时携带了 serialNumber 过滤参数

- [ ] 文档更新
  - [ ] 在 `_bmad-output/research/api-verification-v2.md` 的 SearchWorkitems 章节补充 serialNumber 过滤可行性结论

## Dev Notes

### 当前实现（待改进）

```js
// src/api.js - resolveWorkitemId（当前）
if (/^[A-Z]+-\d+$/i.test(identifier)) {
  const serialNumber = identifier.toUpperCase();
  const { items: results } = await searchWorkitems(client, orgId, spaceId, {
    category: "Req,Task,Bug",
    page: 1,
    perPage: 50,      // ← 限制：最多搜索 50 条，大型项目可能漏匹配
  });
  const match = results.find(
    (i) => i.serialNumber?.toUpperCase() === serialNumber
  );
  if (!match) {
    throw new AppError(ERROR_CODE.NOT_FOUND, `Workitem ${identifier} not found`);
  }
  return match.id;
}
```

**已知限制（技术债务 TD-1）**：perPage: 50 上限，大型项目（>50 个活跃工作项）中序列号可能无法命中。

### 路径 A：API 支持 serialNumber 过滤（优先方案）

如果云效 API searchWorkitems 支持 `serialNumber` 作为 conditionGroup 的 fieldIdentifier：

```js
// 添加 serialNumber 精确匹配 condition
conditionGroups.push({
  className: "string",
  fieldIdentifier: "serialNumber",
  format: "input",
  operator: "EQ",      // 精确匹配，而非 CONTAINS
  toValue: null,
  value: [serialNumber],
});
```

调用时只需 `perPage: 1`（精确匹配最多返回 1 条），大幅降低 API 开销。

### 路径 B：API 不支持 serialNumber 过滤（降级方案）

```js
// 分页循环，直到找到匹配或遍历完
let page = 1;
const perPage = 200;  // 扩大页面大小
while (true) {
  const { items: results, total } = await searchWorkitems(client, orgId, spaceId, {
    category: "Req,Task,Bug",
    page,
    perPage,
  });
  const match = results.find(
    (i) => i.serialNumber?.toUpperCase() === serialNumber
  );
  if (match) return match.id;
  if (page * perPage >= total || results.length === 0) break;
  page++;
}
throw new AppError(ERROR_CODE.NOT_FOUND, `Workitem ${identifier} not found`);
```

**注意**：searchWorkitems 返回体中需有 `total` 字段支持分页终止判断，需验证。

### searchWorkitems 返回结构参考

```js
// src/api.js searchWorkitems 返回
return {
  items: res.data?.workitems || [],
  total: res.data?.totalCount ?? res.data?.total ?? 0,
};
```

### 技术约束

- ESM 模块（`"type": "module"`），import 需带 `.js` 后缀
- 2 空格缩进，单引号字符串
- 不引入新依赖
- 测试使用 `node:test` + `node:assert/strict`

### 文件清单（预期）

```
src/api.js                    ← 修改 resolveWorkitemId 函数
test/resolve.test.js          ← 验证原有测试仍通过（可能新增 1 个）
_bmad-output/research/api-verification-v2.md  ← 补充 serialNumber 过滤结论
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.3] — AC 来源
- [Source: _bmad-output/implementation-artifacts/project-retro-2026-04-02.md#TD-1] — 技术债务来源
- [Source: src/api.js#resolveWorkitemId] — 当前实现（待修改）
- [Source: test/resolve.test.js] — 序列号解析专项测试（11 个用例）
- [Source: _bmad-output/research/api-verification-v2.md] — API 参考文档

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
