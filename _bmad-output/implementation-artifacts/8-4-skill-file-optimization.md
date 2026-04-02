# Story 8.4：SKILL 文件优化

Status: done

## Story

As an AI agent (LLM),
I want an optimized SKILL.md with clear When to Use, command reference, and workflow templates,
So that I can autonomously complete yunxiao workflows without additional prompting.

## Acceptance Criteria

1. **When to Use 识别**：LLM 仅读取 SKILL.md，当用户指令包含工作项相关操作时，能正确识别 When to Use 场景并选择正确命令序列。
2. **命令参考完整**：SKILL.md 命令参考章节包含所有 MVP 命令的格式、参数、`--json` 输出 schema 示例。
3. **工作流模板齐全**：包含 Sprint 工作流、工作项创建（两步）、指派工作流、认证失败处理四类标准模板。
4. **错误处理覆盖**：每个 ERROR_CODE（`AUTH_FAILED`、`AUTH_MISSING`、`NOT_FOUND`、`INVALID_ARGS`、`API_ERROR`）有对应的处理建议。

## Tasks / Subtasks

- [x] 分析现有 SKILL.md 的缺陷（与 skill-draft 对比，与实际命令对比）(AC: 1,2,3,4)
  - [x] 对比 `src/commands/*.js` 中实际实现的命令与 SKILL.md 的差距
  - [x] 确认 `--json` 输出 schema 与 `src/api.js` / 实际响应对齐
- [x] 重写 SKILL.md（AC: 1,2,3,4）
  - [x] When to Use / When NOT to Use 节
  - [x] Setup 节（环境变量、auth 命令）
  - [x] 全局 Flag 节（`--json`）
  - [x] 完整命令参考（含所有子命令和 `--json` schema）
  - [x] 常见工作流模板（4 类）
  - [x] 错误处理节（5 个 ERROR_CODE）
  - [x] 已知限制节

## Dev Notes

### 目标文件

- **修改文件**：`SKILL.md`（仓库根目录，与 `package.json` 同级）
- **参考草案**：`_bmad-output/planning-artifacts/skill-draft-yunxiao-cli-2026-03-30.md`（内容较完整，但需与实际实现对齐）

### 当前 SKILL.md 存在的缺陷

1. **无 When to Use / When NOT to Use** — LLM 无法判断适用场景
2. **命令参考不完整**：
   - 缺少 `auth` 命令（login/status/logout）
   - 缺少 `whoami`
   - 缺少 `sprint` 命令
   - 缺少 `pipeline` 命令
   - 缺少 `status list` 命令
   - 缺少 `--json` schema 示例
3. **无工作流模板** — LLM 需要自己推断两步依赖关系
4. **无错误处理指南** — LLM 遇到错误码不知道如何处置
5. **命令名称有误** — 顶层命令写的是 `workitem` 但实际支持 `wi` 别名

### 实际命令结构（来自 src/commands/）

```
yunxiao auth login [--token <pat>] [--org-id <orgId>]
yunxiao auth status
yunxiao auth logout
yunxiao whoami [--json]
yunxiao project list [--name <kw>] [--limit <n>] [--json]
yunxiao project view <projectId> [--json]
yunxiao sprint list [--project <id>] [--status started|unstarted|finished] [--json]
yunxiao sprint view <sprintId> [--project <id>] [--json]
yunxiao wi list [--project <id>] [--category <Req,Task,Bug>] [--status <statusId>]
              [--assigned-to <userId|me>] [--sprint <sprintId>] [--query <kw>]
              [--priority <p>] [--label <l>] [--limit <n>] [--page <n>] [--json]
yunxiao wi view <id|序列号> [--project <id>] [--json]
yunxiao wi create --title "标题" --type <typeId> [--assigned-to <userId>]
                  [--priority <p>] [--sprint <sprintId>] [--description "描述"] [--json]
yunxiao wi update <id|序列号> [--title "新标题"] [--status <statusId>]
                  [--assigned-to <userId>] [--priority <p>] [--sprint <id>]
                  [--description "描述"]
yunxiao wi delete <id|序列号> [--force]
yunxiao wi comment <id|序列号> "内容"
yunxiao wi comments <id|序列号> [--json]
yunxiao wi types [--project <id>] [--json]
yunxiao status list [--project <id>] [--type-id <typeId>] [--category Req|Task|Bug] [--json]
yunxiao user list [--project <id>] [--limit <n>] [--json]
yunxiao user search <keyword> [--project <id>] [--json]
yunxiao pipeline list [--limit <n>] [--json]
yunxiao pipeline run <pipelineId> [--params '<json>']
yunxiao pipeline status <runId> [--pipeline <id>] [--json]
```

### ERROR_CODE 定义（src/errors.js）

```js
AUTH_FAILED   // 认证失败（token 无效）→ 提示用户更新 YUNXIAO_PAT
AUTH_MISSING  // 未配置认证信息 → 提示执行 yunxiao auth login 或设置环境变量
NOT_FOUND     // 资源不存在 → 确认 ID/序列号是否正确
INVALID_ARGS  // 参数错误 → 检查必填参数
API_ERROR     // API 调用失败（网络/服务器错误）→ 重试或检查 orgId
```

### 配置优先级（重要，AI 场景易混淆）

**实际优先级**：config 文件（`~/.yunxiao/config.json`） > 环境变量（`YUNXIAO_PAT`/`YUNXIAO_ORG_ID`） > 命令行 `--token`

> 注意：skill-draft 写的是「环境变量 > config 文件」但 **src/config.js 实际是 config 文件优先**。写 SKILL.md 时以代码为准。

### `--json` 模式规则

- 所有 list/view 命令支持 `--json`
- stdout 输出纯 JSON，chalk 着色文字 → stderr
- list 命令 `--json` 输出包含 `total` 字段（`{ items: [...], total: N }`），便于 AI 判断是否被截断
- 错误输出格式：`{ "error": "...", "code": "ERROR_CODE" }`

### `wi list --json` 实际输出结构

```json
{
  "items": [
    {
      "id": "string",
      "serialNumber": "GJBL-1",
      "subject": "string",
      "status": { "id": "string", "displayName": "string" },
      "assignedTo": { "id": "string", "name": "string" },
      "gmtCreate": "ISO8601"
    }
  ],
  "total": 42
}
```

> 注意：字段名是 `subject`（非 `title`），`status.displayName`（非 `status.name`）

### 工作流模板内容（必须全部覆盖）

1. **Sprint 工作流**：`sprint list --status started` → `sprint view <id>` → `wi list --sprint <id>`
2. **创建工作项（两步）**：`wi types --json` 获取 typeId → `wi create --type <typeId>`
3. **指派工作流**：`user search "姓名"` 获取 userId → `wi update <id> --assigned-to <userId>`
4. **认证失败处理**：遇到 `AUTH_FAILED` → 提示更新 `YUNXIAO_PAT` 并重新 `auth login`

### 项目结构注意

- `SKILL.md` 在仓库**根目录**（`yunxiao-cli/SKILL.md`），不在 src/ 或 docs/ 下
- 内容为纯 Markdown，无需任何构建步骤
- 修改后直接可用，不影响 npm 包

### References

- 现有草案：[Source: _bmad-output/planning-artifacts/skill-draft-yunxiao-cli-2026-03-30.md]
- 错误码定义：[Source: src/errors.js]
- 配置优先级：[Source: src/config.js]
- 命令实现：[Source: src/commands/workitem.js, src/commands/sprint.js, src/commands/auth.js, src/commands/pipeline.js, src/commands/status.js, src/commands/query.js]
- 需求来源：[Source: _bmad-output/planning-artifacts/epics.md#Epic 8 Story 8.4] (FR33)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 分析了 6 个命令文件（workitem.js, sprint.js, auth.js, pipeline.js, status.js, query.js）及 errors.js、config.js
- 发现并修正 skill-draft 中的 4 处错误：配置优先级（config > env，非 env > config）、sprint 状态值（TODO/DOING/ARCHIVED，非 started/unstarted/finished）、wi types 输出 schema（带 `total` wrapper）、wi comments 输出 schema
- 新增内容：When to Use/NOT、auth 命令、whoami、sprint、pipeline、status、user 命令；5 个工作流模板；完整错误处理表
- 修正了命令名称（workitem → wi alias）、--json schema 字段名（subject 非 title，status.displayName 非 status.name）

### File List

- SKILL.md

### Review Findings

代码审查（Blind Hunter + Edge Case Hunter + Acceptance Auditor 三层并行）完成，经 triage 产生以下结论：

**Patch（已全部应用）：**

| # | 严重度 | 发现 | 修复 |
|---|--------|------|------|
| P1 | High | `user list/search --json` schema 字段名错误：`id` 应为 `userId`，`email` 应为 `roleName` | 已修正 schema |
| P2 | High | 配置优先级说明可能误导：`config.json > env var` 意味着旧 config 文件会覆盖最新环境变量，需警告 | 已添加警告注释 |
| P3 | Medium | `wi view` 缺少 `--json` schema | 已添加 |
| P4 | Medium | `wi create --json` 输出原始 API 响应对象，缺少 schema 说明 | 已添加 |
| P5 | Medium | `wi update` 文档缺少 `[--json]` flag 和输出 schema | 已补全 |
| P6 | Medium | `wi delete` 在 `--json` 模式下强制要求 `--force`，文档未说明；缺少 `--json` schema | 已补全 |
| P7 | Medium | `wi comment`（添加评论）缺少 `--json` schema；只有 `wi comments` 有 schema | 已添加 |
| P8 | Medium | `pipeline run` 和 `pipeline status` 缺少 `--json` schema；`pipeline list` 也缺少 | 已添加 |
| P9 | Low | `wi list` 缺少已实现的高级筛选项：`--priority`、`--label`、`--created-after`、`--created-before`、`--sort`、`--asc` | 已补全 |
| P10 | Low | Workflow 3（指派工作流）注释仍写 `取 id` 应为 `取 userId` | 已修正 |
| P11 | Low | Workflow 5（认证失败处理）未覆盖 `AUTH_MISSING` 场景 | 已添加 |
| P12 | Low | `pipeline status` 缺少 `YUNXIAO_PIPELINE_ID` 环境变量说明 | 已添加 |
| P13 | Low | `sprint view --json` 返回对象包含 `note` 字段（文字描述可能很长），未在 schema 中注明 | 已添加（可选字段标注） |

**Defer（延后处理）：**

- `--extra-json` 参数未文档化（有意保持为高级用法，避免滥用）
- `--type-id` 作为 `--type` 的别名未文档化（保持简洁）
- Windows shell 引号差异（超出 CLI 文档范围）

**Dismiss（不需处理）：**

- 工作流模板数量（5 个 vs AC 要求 4 个）：多 1 个只是更好
- `sprint view --json` `status` 字段为 string 而非 enum（API 原始值，无需固化）
