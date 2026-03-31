# Story 1.5：auth 命令

Status: review

## Story

As an AI agent or team member,
I want `auth login`, `auth status`, and `auth logout` commands,
So that I can authenticate once and have credentials persisted for all subsequent commands.

## Acceptance Criteria

1. **Given** 用户执行 `auth login --token <PAT> --org-id <orgId>`（两参数均提供）
   **When** 命令运行
   **Then** 非交互式完成认证，credentials 写入 `~/.yunxiao/config.json`，退出码 0

2. **Given** 用户执行 `auth login`（不带参数）
   **When** 命令运行
   **Then** 进入交互式提示，分别请求 token 和 org-id

3. **Given** 认证信息已保存
   **When** 执行 `auth status`
   **Then** 显示已认证状态，token 以掩码形式显示（如 `*****1234`），不暴露完整 token

4. **Given** 已有认证信息
   **When** 执行 `auth logout`
   **Then** `~/.yunxiao/config.json` 中的 token/orgId 被清除，退出码 0

## Tasks / Subtasks

- [x] 为 `auth login` 添加 `--token` 和 `--org-id` 选项，支持非交互模式 (AC: #1)
  - [x] `.option('--token <token>', 'Personal Access Token')` 和 `.option('--org-id <orgId>', 'Organization ID')`
  - [x] 若两参数均提供，跳过交互式提示，直接写入 config，退出码 0
  - [x] 若仅提供部分参数，补全缺失项的交互提示
- [x] 调整 `auth status` 掩码格式为 `*****1234`（五星+后四位） (AC: #3)
- [x] 验证 `auth logout` 退出码为 0 (AC: #4)
- [x] 运行现有单元测试确保无回归

## Dev Notes

### 当前实现状态分析

`src/commands/auth.js` 已实现 `auth login`（仅交互式）、`auth status`、`auth logout`，由 `registerAuthCommands(program)` 注册到 `src/index.js`。

**需要变更的文件：仅 `src/commands/auth.js`**

### 非交互模式实现规格

Commander.js `.option()` 将 `--org-id <orgId>` 解析为 `options.orgId`（camelCase）。

若 `options.token` 和 `options.orgId` 均提供，直接 `saveConfig` 后返回（不需要验证 PAT）；若只提供了其中一个，则对缺失项发出交互提示。

### auth status 掩码格式

统一为 `'*****' + token.slice(-4)`，与 Epic AC#3 描述一致。

### 技术栈约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`），`import/export` 语法
- 2 空格缩进，单引号字符串
- 无新依赖：使用现有 `readline`、`chalk`、`saveConfig/clearConfig`

### 范围边界

- **本 Story 范围**：`auth login` 非交互模式；`auth status` 掩码格式统一；`auth logout` 退出码
- **不在范围**：`whoami`（Story 1.6）；命令始终注册（Story 1.6）

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — AC 来源
- [Source: _bmad-output/planning-artifacts/epics.md#FR9, FR10, FR11] — 双模式、掩码、logout
- [Source: src/commands/auth.js] — 现有实现

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `auth login` 添加 `--token` 和 `--org-id` 选项：两参数均提供时直接 saveConfig（非交互）；只提供一个时补全缺失项的交互提示
- `auth status` 掩码统一为 `'*****' + token.slice(-4)`，符合 AC#3 格式要求
- `auth logout` 原有实现已返回 0，无需变更
- 11/11 现有单元测试全部通过，无回归

### File List

- src/commands/auth.js（修改：auth login 添加 --token/--org-id 选项；auth status 掩码格式）
- _bmad-output/implementation-artifacts/1-5-auth-commands.md（新建：Story 文件）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：状态更新）
