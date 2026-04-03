# Story 9.4：sprint view 工作项 done 状态 schema 固化

Status: done

## Story

As a team member or AI agent,
I want sprint view completion statistics to be based on confirmed API field schema,
So that the done count is accurate regardless of project workflow configuration.

## Acceptance Criteria

1. **Given** 执行 `sprint view <id>` 或 `sprint view <id> --json`
   **When** 获取工作项列表并计算完成统计
   **Then** "已完成"判断基于 API 返回的确定字段优先级顺序，且该顺序在代码注释中有说明

2. **Given** 确认 status 字段 schema 后
   **When** 更新实现
   **Then** 将确认结论记录到 `_bmad-output/research/api-verification-v2.md` 的 Sprint 章节

3. **Given** `sprint view <id> --json` 执行
   **When** `stats.done` 返回值
   **Then** done 计算逻辑一致、可重复（相同数据多次运行结果相同）

## Tasks / Subtasks

- [x] 分析当前 done 判断逻辑并确认字段优先级 (AC: #1)
  - [x] 阅读 `src/commands/sprint.js` 当前多级降级实现（`s.done === true` → `s.nameEn /done/i` → `s.stage.toUpperCase() === 'DONE'` → `s.name /done|完成/`）
  - [x] 查阅 `_bmad-output/research/api-verification-v2.md` 中 SearchWorkitems 返回字段的 status 对象结构
  - [x] 确认哪个字段是 API 返回中最可靠的 done 标识（`s.done` boolean 优先，`s.stage` 次之）
  - [x] 记录确认结论

- [x] 优化 done 判断逻辑（简化降级链） (AC: #1, #3)
  - [x] 保留 `s.done === true` 作为第一优先级（boolean，最可靠）
  - [x] 保留 `s.stage?.toUpperCase() === 'DONE'` 作为第二优先级（enum，可靠）
  - [x] 如 `s.nameEn` 和 `s.name` 模糊匹配确认为不可靠，降低或移除该降级
  - [x] 在代码中添加注释说明字段优先级顺序及依据

- [x] 更新 API 验证文档 (AC: #2)
  - [x] 在 `_bmad-output/research/api-verification-v2.md` SearchWorkitems 章节补充 status 字段 schema 说明
  - [x] 明确标注 `done` boolean 字段、`stage` enum 字段的存在性和可靠性

- [x] 验证现有测试仍通过
  - [x] 运行 `npm test`，确认无回归

### Review Findings

- [x] [Review][Defer] `isDoneStatus`: `nameEn` 含前后空格时精确匹配失败（如 `' done '`） [src/commands/sprint.js] — deferred，API 响应通常无空格填充，无实际案例证明是真实问题；如有需要可在后续版本加 `.trim()`

## Dev Notes

### 当前实现（src/commands/sprint.js）

```js
// 当前多级降级判断（第 86-95 行）
const done = items.filter(item => {
  const s = item.status;
  if (s && typeof s === 'object') {
    if (s.done === true) return true;
    if (typeof s.nameEn === 'string' && /\bdone\b/i.test(s.nameEn)) return true;
    if (typeof s.stage === 'string' && s.stage.toUpperCase() === 'DONE') return true;
    if (typeof s.name === 'string' && /\bdone\b|完成/i.test(s.name)) return true;
  }
  if (typeof s === 'string' && /\bdone\b|完成/i.test(s)) return true;
  return false;
});
```

**问题**：`s.nameEn` 和 `s.name` 的模糊匹配（`/\bdone\b/i`）可能误匹配"undone"、"in-done"等状态名；`s.name` 中文匹配（`/完成/`）可能误匹配"待完成"。这两个降级分支的可靠性未经 API 验证。

### 目标优化方向

```js
// 优化后：严格按可靠字段优先级
const done = items.filter(item => {
  const s = item.status;
  if (!s) return false;
  // 优先级 1: boolean done 字段（API 明确返回时最可靠）
  if (typeof s.done === 'boolean') return s.done;
  // 优先级 2: stage enum（标准化枚举，云效约定值为 DONE/DOING/UNSTARTED）
  if (typeof s.stage === 'string') return s.stage.toUpperCase() === 'DONE';
  // 降级 3: 仅保留严格 nameEn 完整匹配（避免误匹配）
  if (typeof s.nameEn === 'string') return s.nameEn.toLowerCase() === 'done';
  return false;
}).length;
```

**关键变更**：
- 移除 `s.name` 中文模糊匹配（`/完成/`）—— 最不可靠，可能误匹配"待完成"
- `nameEn` 从模糊改为完整匹配（`=== 'done'` 而非 `/\bdone\b/i`）
- 仅保留 3 级降级（原 5 级），减少误判风险

### status 字段 schema 参考

来自 `_bmad-output/research/api-verification-v2.md`（待更新）：

```json
{
  "status": {
    "id": "xxx",
    "name": "已完成",
    "nameEn": "Done",
    "stage": "DONE",    // enum: DONE / DOING / UNSTARTED
    "done": true        // boolean，是否存在待确认
  }
}
```

`stage` 字段由云效平台统一管理，是最稳定的枚举标识；`done` boolean 字段若存在则最直接。

### 与其他 Story 的关系

- 本 Story **独立**于 9-3（不涉及 resolveWorkitemId 或 api.js）
- 修改范围：`src/commands/sprint.js` 第 86-95 行 + `api-verification-v2.md` 文档
- 不影响 sprint list、wi 系列命令

### 技术约束

- ESM 模块（`"type": "module"`），import 需带 `.js` 后缀
- 2 空格缩进，单引号字符串
- 不引入新依赖

### 文件清单（预期）

```
src/commands/sprint.js                      ← 修改 done 判断逻辑（第 86-95 行）
_bmad-output/research/api-verification-v2.md ← 补充 status 字段 schema 说明
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.4] — AC 来源
- [Source: _bmad-output/implementation-artifacts/project-retro-2026-04-02.md#TD-2] — 技术债务来源
- [Source: src/commands/sprint.js#86-95] — 当前 done 判断实现（待优化）
- [Source: _bmad-output/research/api-verification-v2.md] — API schema 参考（需补充）
- [Source: _bmad-output/implementation-artifacts/4-2-sprint-view.md#Dev Notes] — 原始 done 判断设计说明

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 提取 `isDoneStatus(s)` 为独立导出函数，替换原来的 5 级内联降级链
- 字段优先级固化：`s.done` boolean → `s.stage` enum → `s.nameEn` 精确匹配
- 移除 `s.name` 中文模糊匹配（最不可靠）和 `typeof s === 'string'` 字符串检查
- 为 `isDoneStatus` 新增 17 个单元测试，覆盖所有优先级分支和边界情况
- 更新 `api-verification-v2.md` SearchWorkitems 章节，补充 status 对象 schema 表格
- 全套 197 个测试全部通过，无回归

### File List

- `src/commands/sprint.js` — 提取 `isDoneStatus`，简化 done 判断逻辑
- `test/sprint.test.js` — 新增 `isDoneStatus` 单元测试（17 个用例）
- `_bmad-output/research/api-verification-v2.md` — 补充 status 字段 schema 说明
- `_bmad-output/implementation-artifacts/9-4-sprint-view-done-schema.md` — Story 文件（状态更新）
