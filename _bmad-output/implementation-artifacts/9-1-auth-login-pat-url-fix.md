# Story 9.1：auth login PAT URL 修正与交互提示改善

Status: done

## Story

As a 开发者用户（yunxiao-cli 使用者），
I want `auth login` 交互模式显示正确的 PAT 生成 URL，并使用清晰的中文提示语，
so that 我能直接点击正确的链接生成 PAT，并清楚地知道需要粘贴什么内容。

## Acceptance Criteria

1. **URL 修正**：交互模式下显示的 PAT 生成链接必须是 `https://account-devops.aliyun.com/settings/personalAccessToken`（而非旧的 `https://devops.aliyun.com/account/setting/tokens`）。
2. **提示语改善**：PAT 输入提示（promptSecret 调用处）必须明确告知用户粘贴 PAT，例如 `"请粘贴你的 Personal Access Token："`，光标紧随提示文字之后（无换行）。
3. **非交互模式不受影响**：`--token` + `--org-id` 非交互路径行为不变。
4. **`--json` 输出不受影响**：`auth login` 不支持 `--json`，本次不改变此行为。
5. **其他现有功能回归**：`auth status`、`auth logout`、PAT 验证流程、组织选择逻辑均不受改动影响。

## Tasks / Subtasks

- [x] 修正 PAT URL（AC: 1）
  - [x] 将 `src/commands/auth.js` 第 59 行中的旧 URL 替换为正确 URL
- [x] 改善 PAT 输入提示语（AC: 2）
  - [x] 将 `src/commands/auth.js` 第 63 行的 `"Enter your PAT: "` 替换为 `"请粘贴你的 Personal Access Token："`
- [x] 验证回归（AC: 3, 4, 5）
  - [x] 确认非交互模式代码路径未被改动
  - [x] 确认 `auth status`、`auth logout` 函数体未被改动
  - [x] 运行现有单元测试（如有）确保无回归

### Review Findings

- [x] [Review][Defer] 提示语中文但错误消息仍为英文（语言不一致）[src/commands/auth.js:65] — deferred, 国际化统一由 Story 9.6 处理
- [x] [Review][Defer] 全角冒号在非 UTF-8 终端可能渲染异常 [src/commands/auth.js:63] — deferred, 规格书明确要求该字符串；UTF-8 为 Node.js 生态标准
- [x] [Review][Defer] `promptSecret` 返回值缺少 null 守卫 [src/commands/auth.js:63] — deferred, pre-existing，本次变更未引入

## Dev Notes

### 问题定位

**文件**：`src/commands/auth.js`

**Bug 1 — 错误 URL（第 59 行）**：
```js
// 当前（错误）：
console.log(chalk.gray("Generate a PAT at: https://devops.aliyun.com/account/setting/tokens\n"));

// 修正后：
console.log(chalk.gray("Generate a PAT at: https://account-devops.aliyun.com/settings/personalAccessToken\n"));
```

**Bug 2 — 不够清晰的提示语（第 63 行）**：
```js
// 当前（不够清晰）：
pat = (await promptSecret("Enter your PAT: ")).trim();

// 修正后（清晰告知用户粘贴 PAT）：
pat = (await promptSecret("请粘贴你的 Personal Access Token：")).trim();
```

### 代码作用域说明

本 Story **仅需修改以上两处**，其余代码无需改动：
- `promptSecret` 函数本身不需要修改（已实现静默输入，光标行为正确）
- `prompt` 函数不需要修改
- `registerAuthCommands` 其余逻辑不需要修改
- `auth.js` 以外的文件不涉及

### 项目约定

- 语言：Node.js ≥ 18，ESM 模块（`"type": "module"`）
- 缩进：2 空格
- 字符串：项目代码实际使用双引号（`"`）
- 无需新增依赖
- Git 作者：`Sue <boil@vip.qq.com>`，无 Co-Authored-By
- Commit message 格式：`fix(auth): correct PAT URL and clarify login prompt`

### 来源与背景

- 来源：GitHub #62，FR9
- 新 URL 由阿里云平台更新，旧 URL 已失效
- 中文提示语改善：减少用户困惑（原英文提示 "Enter your PAT" 对部分用户不够直观）

### Project Structure Notes

- 修改单一文件：`src/commands/auth.js`
- 无新增文件，无目录结构变化

### References

- 需求来源：[Source: _bmad-output/planning-artifacts/epics.md#Epic 9 Story 9.1]
- 实现文件：[Source: src/commands/auth.js#L59, L63]
- GitHub Issue: #62

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 修改 `src/commands/auth.js` 两处：PAT URL 更新（L59）、交互提示语中文化（L63）
- 全量测试通过：169 tests, 0 failures（npm test）
- 非交互模式、auth status、auth logout 代码路径均未改动，回归验证通过

### File List

- src/commands/auth.js
