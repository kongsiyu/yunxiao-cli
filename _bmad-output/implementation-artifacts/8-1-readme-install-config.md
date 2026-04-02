# Story 8.1: README 安装与配置章节

Status: done

## Story

As a new team member,
I want a clear README section covering installation and configuration,
so that I can get from zero to first successful command in under 5 minutes.

## Acceptance Criteria

1. README 包含 `npm install -g @kongsiyu/yunxiao-cli` 安装命令
2. README 包含三个核心环境变量的设置说明：`YUNXIAO_PAT`、`YUNXIAO_ORG_ID`、`YUNXIAO_PROJECT_ID`
3. README 包含 config 文件方式（`~/.yunxiao/config.json`）及安全风险警告（明文存储）
4. README 包含配置优先级说明：命令行参数 > config 文件 > 环境变量

## Tasks / Subtasks

- [x] 任务 1：重写 README.md 安装章节 (AC: 1)
  - [x] 移除旧的 `npm link` / `node src/index.js` 方式
  - [x] 添加 `npm install -g @kongsiyu/yunxiao-cli` 全局安装命令
  - [x] 添加安装后验证命令 `yunxiao --version` / `yunxiao --help`
- [x] 任务 2：重写 README.md 配置章节 (AC: 2, 3, 4)
  - [x] 环境变量方式：列出三个变量及说明（含获取 PAT 的链接）
  - [x] Config 文件方式：说明 `yunxiao auth login` 交互式登录流程
  - [x] 添加安全风险警告：config 文件明文存储 PAT，推荐使用环境变量
  - [x] 配置优先级说明：命令行参数 > config 文件 > 环境变量
  - [x] 说明命令行覆盖参数：`--token`、`--org-id`
- [x] 任务 3：清理 README.md 过时内容 (AC: 整体质量)
  - [x] 移除"开发计划"章节（已过时，PR 和 Issue 状态记录）
  - [x] 移除或迁移"API 说明"章节（内部实现细节，非用户文档）
  - [x] 保留或更新"版本历史"章节

### Review Findings

- [x] [Review][Patch] `--token`/`--org-id` 被错误记录为全局标志，实为 `auth login` 子命令专属标志 [README.md]
- [x] [Review][Patch] 配置优先级章节缺少警告：config 文件会静默覆盖 CI 环境变量 [README.md]
- [x] [Review][Patch] 评论不支持 emoji 的提示被意外移除 [README.md]
- [x] [Review][Patch] 未说明 Node.js >=18 前提要求 [README.md]
- [x] [Review][Patch] Windows 用户无法使用 `export` 语法，缺少跨平台说明 [README.md]
- [x] [Review][Defer] `auth status` 和 `whoami` 区别未说明 [README.md] — deferred, pre-existing
- [x] [Review][Defer] 非交互式登录跳过 PAT 验证（代码行为，非文档问题）[src/commands/auth.js] — deferred, pre-existing
- [x] [Review][Defer] 传入部分 auth 标志触发混合交互流程（代码行为）[src/commands/auth.js] — deferred, pre-existing

## Dev Notes

### 实现要点

**这是纯文档任务**，只需修改 `README.md`，无需改动任何 `.js` 源代码。

**文件路径**：`README.md`（worktree 根目录）

### 当前 README 现状（需修改）

当前 README 安装方式已过时：
```bash
# 旧的方式（需移除）
cd yunxiao-cli
npm install
npm link
# 或
node src/index.js [command]
```

正确的发布安装方式（需添加）：
```bash
npm install -g @kongsiyu/yunxiao-cli
```

### 配置系统实现细节（来自 `src/config.js`）

配置优先级（代码注释：`FR26`）：
```
命令行参数（最高） > Config 文件 > 环境变量（最低）
```

Config 文件路径：`~/.yunxiao/config.json`
- 写入权限：`mode: 0o600`（仅用户可读）
- 格式：JSON，字段包括 `token`、`orgId`、`projectId`、`userId`、`userName`、`orgName`

Config 文件加载逻辑（`loadConfig()`）：
```javascript
token: cliArgs.token || file?.token || file?.pat || process.env.YUNXIAO_PAT
orgId: cliArgs.orgId || file?.orgId || process.env.YUNXIAO_ORG_ID
projectId: cliArgs.projectId || file?.projectId || process.env.YUNXIAO_PROJECT_ID
```

命令行参数（全局 option，在所有命令中可用）：
- `--token <token>` — 覆盖 PAT
- `--org-id <orgId>` — 覆盖组织 ID

### 环境变量说明（来自代码 + PRD）

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `YUNXIAO_PAT` | ✅ | 云效个人访问令牌（Personal Access Token）|
| `YUNXIAO_ORG_ID` | ✅ | 组织 ID |
| `YUNXIAO_PROJECT_ID` | 可选 | 默认项目 ID（workitem/sprint 命令默认使用）|

注：`YUNXIAO_USER_ID` 在代码中存在但通过 auth login 自动存储，无需手动设置，不需写入 README 配置章节。

### Auth Login 流程（来自 `src/commands/auth.js`）

**交互式登录**（推荐）：
```bash
yunxiao auth login
# 1. 提示输入 PAT（隐藏输入）
# 2. 验证 PAT 有效性（调用 /oapi/v1/platform/user）
# 3. 自动列出并选择组织
# 4. 保存到 ~/.yunxiao/config.json
```

**非交互式登录**（适用于 CI）：
```bash
yunxiao auth login --token <PAT> --org-id <orgId>
```

保存内容：`token`、`userId`、`userName`、`orgId`、`orgName`

PAT 获取地址：`https://devops.aliyun.com/account/setting/tokens`

### 安全风险警告要求（来自 PRD NFR3）

> PAT 存储在 config 文件时明文，文档须标注安全风险并建议使用环境变量

必须在 README 配置章节中明确标注：
- config 文件 `~/.yunxiao/config.json` 以**明文**存储 PAT
- 建议生产/CI 环境使用环境变量 `YUNXIAO_PAT`，避免 token 泄露

### README 结构建议

重写后的 README 结构（安装与配置部分）应包含：

1. **安装** — `npm install -g @kongsiyu/yunxiao-cli` + 验证
2. **快速开始** — 5分钟内运行第一个命令（可选，视内容量决定是否加）
3. **配置**
   - 方式一：环境变量（推荐用于 CI/生产）
   - 方式二：auth login 交互式配置（推荐用于本地开发）
   - 安全警告
   - 配置优先级说明
   - 手动 Config 文件说明（可选，补充）

### Project Structure Notes

- 修改文件：`README.md`（项目根目录）
- 不改动任何 `src/` 下的文件
- 不改动 `package.json`
- 保留 `SKILL.md`（Story 8-4 单独处理）

### References

- 配置优先级：[Source: src/config.js#loadConfig()]
- Auth 命令：[Source: src/commands/auth.js]
- 安全要求：[Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- Story AC：[Source: _bmad-output/planning-artifacts/epics.md#Story 8.1]
- 安装命令：[Source: package.json#name, bin]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 重写 README.md：移除 npm link 安装方式，改为 `npm install -g @kongsiyu/yunxiao-cli`
- 新增完整配置章节：环境变量方式、交互式登录（auth login）、非交互式登录（CI）
- 添加安全警告：config 文件明文存储 PAT，建议 CI/生产使用环境变量
- 添加配置优先级说明：命令行 > config 文件 > 环境变量
- 移除过时的"开发计划"章节（Issues/PR 状态记录）
- 移除"API 说明"章节（内部实现细节，非用户文档）
- 保留"版本历史"章节
- 全部 134 个测试通过，零回归

### File List

- README.md
