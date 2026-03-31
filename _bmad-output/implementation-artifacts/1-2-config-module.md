# Story 1.2：配置管理模块

Status: review

## Story

As a developer,
I want a centralized `config.js` module with correct priority merging,
so that all commands consistently read configuration from the right source.

## Acceptance Criteria

1. **Given** 用户同时设置了环境变量 `YUNXIAO_PAT=env-token` 和 config 文件 `token: file-token`
   **When** 执行任意命令（不传 `--token`）
   **Then** 使用 `file-token`（config 文件优先于环境变量）

2. **Given** 用户传入 `--token cli-token`
   **When** 执行任意命令
   **Then** 使用 `cli-token`（命令行参数最高优先级）

3. **Given** 仅设置环境变量认证信息
   **When** 执行任意命令
   **Then** 命令正常读取环境变量中的 token 和 orgId

4. **Given** `config.js` 模块
   **When** 调用 `saveConfig({ token, orgId })`
   **Then** 配置被写入 `~/.yunxiao/config.json`，格式为合法 JSON

## Tasks / Subtasks

- [x] 创建 `src/config.js` 模块 (AC: #1, #2, #3, #4)
  - [x] 实现 `loadConfig(cliArgs)` — 三路优先级合并（cli > 文件 > 环境变量）
  - [x] 实现 `loadSavedConfig()` — 从 `~/.yunxiao/config.json` 读取，读失败返回 null
  - [x] 实现 `saveConfig(config)` — 写入 `~/.yunxiao/config.json`，自动创建目录
  - [x] 实现 `clearConfig()` — 写入空对象 `{}`
- [x] 将 config 函数从 `src/api.js` 迁移到 `src/config.js` (AC: #4)
  - [x] 删除 `api.js` 中的 `loadSavedConfig`、`saveConfig`、`clearConfig` 函数
  - [x] 删除 `api.js` 中的 `fs`、`os`、`path` import 和 `CONFIG_DIR`/`CONFIG_FILE` 常量
- [x] 更新 `src/commands/auth.js` 的 import 来源 (AC: #4)
  - [x] 将 `loadSavedConfig`、`saveConfig`、`clearConfig` 的 import 从 `../api.js` 改为 `../config.js`
  - [x] `saveConfig` 调用中将 `pat: pat.trim()` 改为 `token: pat.trim()`
- [x] 更新 `src/index.js` 使用 `loadConfig()` (AC: #1, #2, #3)
  - [x] 引入 `loadConfig` 从 `./config.js`
  - [x] 替换当前手动优先级逻辑为 `loadConfig()` 调用
  - [x] 用 `config.token` 替换 `pat`，用 `config.orgId`/`config.projectId`/`config.userId` 替换对应变量
- [x] 验证
  - [x] `node src/index.js --help` 正常运行（无模块缺失错误）

## Dev Notes

### 当前问题（必须修复）

**`src/index.js` 第 38、43 行的优先级 BUG：**

```js
// 当前（错误）：env 优先于文件
const pat = process.env.YUNXIAO_PAT || (savedConfig?.pat);
let orgId = process.env.YUNXIAO_ORG_ID || (savedConfig?.orgId);

// 修复后（正确）：文件优先于 env
const token = config.token;  // 来自 loadConfig()
```

FR26 要求：命令行 > 配置文件 > 环境变量。当前代码顺序反了。

### `src/config.js` 完整实现规格

```js
// src/config.js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.yunxiao');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadSavedConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    // 兼容旧 'pat' 字段和新 'token' 字段
    if (data && (data.token || data.pat)) return data;
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

export function clearConfig() {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, '{}', 'utf8');
  }
}

// loadConfig: cli args > file > env vars
// cliArgs: { token, orgId, projectId } (可选，未传值的字段为 undefined)
export function loadConfig(cliArgs = {}) {
  const file = loadSavedConfig();
  return {
    token: cliArgs.token || file?.token || file?.pat || process.env.YUNXIAO_PAT,
    orgId: cliArgs.orgId || file?.orgId || process.env.YUNXIAO_ORG_ID,
    projectId: cliArgs.projectId || file?.projectId || process.env.YUNXIAO_PROJECT_ID,
    userId: file?.userId,
    userName: file?.userName,
    orgId_name: file?.orgName,
  };
}
```

### `src/index.js` 变更摘要

**原来（手动优先级，顺序错误）：**
```js
import { getCurrentUser, loadSavedConfig, createClientWithPat } from './api.js';
// ...
const savedConfig = loadSavedConfig();
const pat = process.env.YUNXIAO_PAT || (savedConfig?.pat);  // ← 优先级反了
let orgId = process.env.YUNXIAO_ORG_ID || (savedConfig?.orgId);  // ← 同上
let projectId = process.env.YUNXIAO_PROJECT_ID || (savedConfig?.projectId);
```

**修改后：**
```js
import { getCurrentUser, createClientWithPat } from './api.js';
import { loadConfig } from './config.js';
// ...
const config = loadConfig();  // 无 cliArgs：从文件+env 合并
const token = config.token;
let orgId = config.orgId;
let projectId = config.projectId;
let currentUserId = config.userId;
// ...
if (token) {
  client = createClientWithPat(token);
  // ...
}
```

### `src/commands/auth.js` 变更摘要

**import 变更：**
```js
// 从
import { createClientWithPat, loadSavedConfig, saveConfig, clearConfig } from '../api.js';
// 改为
import { createClientWithPat } from '../api.js';
import { loadSavedConfig, saveConfig, clearConfig } from '../config.js';
```

**saveConfig 调用变更（第 108-115 行）：**
```js
// 从
const config = {
  pat: pat.trim(),
  // ...
};
// 改为
const config = {
  token: pat.trim(),  // ← pat → token
  // ...
};
```

**注意**：`auth status` 中读取 `config.pat` 的 mask 显示逻辑需同步改为 `config.token || config.pat`（兼容旧配置）：
```js
// auth status 中
const maskedPat = (config.token || config.pat).substring(0, 8) + '...' + (config.token || config.pat).slice(-4);
```

### `src/api.js` 变更摘要

删除以下内容（迁移到 config.js）：
- `import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'`
- `import { homedir } from 'os'`
- `import { join } from 'path'`
- `const CONFIG_DIR = ...`
- `const CONFIG_FILE = ...`
- `export function loadSavedConfig() { ... }`
- `export function saveConfig(config) { ... }`
- `export function clearConfig() { ... }`

保留的函数（均不涉及 config）：
- `createClientWithPat`、`searchProjects`、`getProject`、`searchWorkitems`、`getWorkitem` 等所有 API 函数

### 目标目录结构（本 Story 后）

```
src/
  index.js        ← 使用 loadConfig() 替换手动优先级逻辑
  api.js          ← 删除 config 相关代码，仅保留 API 函数
  config.js       ← 新建：loadConfig / loadSavedConfig / saveConfig / clearConfig
  commands/
    auth.js       ← import 来源改为 config.js，pat → token
    project.js    ← 不变
    sprint.js     ← 不变
    workitem.js   ← 不变
```

### 技术栈约束

- Node.js ≥ 18，ESM 模块（`"type": "module"`），使用 `import/export` 语法
- 无新依赖：仅用 Node.js 内置 `fs`、`os`、`path`
- Commander.js ^12.0.0, chalk ^5.3.0, axios ^1.7.0（不变）

### 范围边界

- **本 Story 范围**：创建 config.js，修复优先级 bug，迁移 config 函数，更新调用方
- **不在范围**：`--token` CLI 参数支持（这是 Story 1.5/1.6 的全局 option 机制）；`src/index.js` 中的 `if (client && orgId)` 条件注册移除（Story 1.6）；序列号解析 bug（Story 2.1）

### 从 Story 1-1 继承的模式

- ESM 模块，所有导入用相对路径 + `.js` 扩展名
- 代码风格：2 空格缩进，单引号字符串
- `loadSavedConfig` 的容错逻辑（try/catch 返回 null）已验证有效，迁移时保留

### Project Structure Notes

- `src/config.js` 是新建文件，路径与 PRD 技术架构章节的「目标目录结构」完全一致
- `api.js` 删除 config 代码后仅剩 API 函数，职责更清晰
- 所有调用方（`index.js`、`auth.js`）的 import 路径需同步更新

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/epics.md#FR26] — 配置优先级规则
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Architecture] — 目标目录结构
- [Source: src/api.js#1-32] — 待迁移的 config 函数（loadSavedConfig/saveConfig/clearConfig）
- [Source: src/index.js#37-44] — 当前有 BUG 的优先级逻辑
- [Source: src/commands/auth.js#4,108-115] — import 来源和 saveConfig 调用

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 新建 `src/config.js`，实现 `loadConfig`（三路优先级合并）、`loadSavedConfig`、`saveConfig`、`clearConfig`
- 修复 `src/index.js` 的优先级 BUG（原 env || file，修正为 file || env）
- 从 `src/api.js` 迁移 config 相关代码，api.js 现仅保留 API 函数（职责分离）
- 更新 `src/commands/auth.js`：import 改为 config.js，存储 key 从 `pat` 改为 `token`，兼容旧配置
- `node src/index.js --help` 验证通过，无模块缺失错误

### File List

- src/config.js (新建)
- src/api.js (修改：删除 config 函数及相关 import)
- src/commands/auth.js (修改：更新 import 来源、pat→token、兼容旧配置)
- src/index.js (修改：使用 loadConfig() 替换手动优先级逻辑)
- _bmad-output/implementation-artifacts/1-2-config-module.md (修改：Story 文件)
- _bmad-output/implementation-artifacts/sprint-status.yaml (修改：状态更新)
