# Story 6.2：手动发布验证

Status: done

## Story

As a developer,
I want to verify the package installs and runs correctly after `npm publish`,
So that users have a working experience from day one.

## Acceptance Criteria

1. **Given** 执行 `npm publish --access public`
   **When** 发布成功
   **Then** `npm install -g @kongsiyu/yunxiao-cli` 可成功安装，`yunxiao --help` 正常运行

2. **Given** 全局安装后
   **When** 执行 `npx @kongsiyu/yunxiao-cli --help`
   **Then** 命令正常运行，显示完整帮助信息

## Tasks / Subtasks

- [x] 更新 README 安装章节，添加 npm 全局安装方式 (AC: #1, #2)
  - [x] 替换/补充 `npm link` 为 `npm install -g @kongsiyu/yunxiao-cli` 安装说明
  - [x] 添加 `npx @kongsiyu/yunxiao-cli --help` 用法示例
- [x] 本地发布验证流程 (AC: #1, #2)
  - [x] 运行 `npm pack` 生成 tarball，检查包内容
  - [x] 运行 `npm install -g ./kongsiyu-yunxiao-cli-*.tgz` 模拟全局安装
  - [x] 验证 `yunxiao --help` 输出完整帮助树（无错误）
  - [x] 清理：`npm uninstall -g @kongsiyu/yunxiao-cli` + 删除 tarball
- [x] 在 CONTRIBUTING.md 中补充发布流程章节 (AC: #1)
  - [x] 记录手动发布步骤：版本 bump → npm publish --access public
  - [x] 说明 NPM_TOKEN 配置方式（GitHub Actions 自动化已有 6-4）
- [x] 更新 sprint-status.yaml：6-2 → done

### Review Findings

- [x] [Review][Patch] CONTRIBUTING.md 末尾存在双 `---` 分隔线 [CONTRIBUTING.md:135-136]
- [x] [Review][Patch] 手动发布步骤5 推送 tag 会触发 GitHub Actions 二次 publish [CONTRIBUTING.md:发布流程步骤5]

## Dev Notes

### 关键背景（不要重复造轮子）

- **Story 6-1 已完成**：`package.json` 已正确配置，`name: @kongsiyu/yunxiao-cli`，`bin.yunxiao: ./src/index.js`，`files: ["src/", "README.md"]`，`version: 0.1.1`
- **Story 6-4 已完成**：`push: tags: v*` 触发 `.github/workflows/publish.yml` 自动 npm publish，无需为本 story 创建任何 CD 文件
- **npm pack 验证结果**（已验证）：14 个文件，14.3 kB packed，包含 `src/` 全部文件 + `README.md` + `package.json`，**不含** `_bmad-output/`、`.github/`、`test/`——`files` 白名单机制正常工作

### README 当前问题

`README.md` 安装章节目前只有 `npm link`（本地开发方式），缺少 npm 全局安装方式：

```markdown
# 当前（错误/不完整）
## 安装
\`\`\`bash
# 全局安装（npm link）
cd yunxiao-cli
npm install
npm link

# 或者直接运行
node src/index.js [command]
\`\`\`
```

需要改为（参考最终状态）：

```markdown
## 安装

\`\`\`bash
npm install -g @kongsiyu/yunxiao-cli
\`\`\`

或者使用 npx 无需安装：

\`\`\`bash
npx @kongsiyu/yunxiao-cli --help
\`\`\`
```

> **注意**：保留本地开发说明（npm link）作为"本地开发"小节，但主要安装方式必须用 npm。

### 本地验证命令（在 BACKEND_ROOT 执行）

```bash
# 步骤1：打包
npm pack

# 步骤2：全局安装 tarball（模拟用户 npm install -g @kongsiyu/yunxiao-cli）
npm install -g ./kongsiyu-yunxiao-cli-0.1.1.tgz

# 步骤3：验证安装
yunxiao --help      # 应显示完整帮助树
yunxiao --version   # 应输出 0.1.1
npx @kongsiyu/yunxiao-cli --help  # 若 npm registry 已发布则有效，否则跳过

# 步骤4：清理（必须！避免污染全局环境）
npm uninstall -g @kongsiyu/yunxiao-cli
rm -f kongsiyu-yunxiao-cli-*.tgz
```

### CONTRIBUTING.md 补充内容

当前 CONTRIBUTING.md 有工作流程/代码规范/优先级/文档要求，但**缺少发布流程章节**。需在文件末尾（或适当位置）添加：

```markdown
## 发布流程

### 手动发布

1. 确认 `main`（`master`）分支所有测试通过
2. 更新 `package.json` 中的 `version` 字段（遵循 SemVer）
3. 运行 `npm pack --dry-run` 验证包内容
4. 运行 `npm publish --access public`（需要 npm 账号有 `@kongsiyu` scope 发布权限）
5. 打 tag：`git tag v<version> && git push origin v<version>`

### 自动发布（推荐）

推送 `v*` 格式 tag 后，GitHub Actions (`.github/workflows/publish.yml`) 自动触发 npm publish：
\`\`\`bash
git tag v0.2.0
git push origin v0.2.0
\`\`\`
需要在 GitHub 仓库 Settings → Secrets 中配置 `NPM_TOKEN`。
```

### Project Structure Notes

- README.md：根目录，只改安装章节（保留其余内容）
- CONTRIBUTING.md：根目录，追加发布流程章节（不改现有内容）
- **不需要创建任何新源码文件**（本 story 是文档 + 验证，无代码变更）
- 验证通过后删除临时生成的 `kongsiyu-yunxiao-cli-*.tgz`

### 验收成功标志

执行 `npm install -g ./kongsiyu-yunxiao-cli-0.1.1.tgz` 后：
- `yunxiao --help` 输出包含 `auth`、`wi`、`sprint`、`pipeline` 等命令组
- `yunxiao --version` 输出 `0.1.1`
- 无 "Cannot find module" 或 "SyntaxError" 错误

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR30] — npm 发布要求
- [Source: _bmad-output/implementation-artifacts/6-1-npm-package-config.md] — package.json 已完成配置
- [Source: _bmad-output/implementation-artifacts/6-4-github-actions-cd.md] — CD 自动发布已配置

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- README.md 安装章节重写：主安装方式改为 `npm install -g @kongsiyu/yunxiao-cli`；添加 `npx` 用法示例；本地开发方式移至"本地开发安装"子节
- 本地验证通过：`npm pack` 生成 tarball (14.3 kB, 14 files)；`npm install -g --prefix /tmp/npm-global ./kongsiyu-yunxiao-cli-0.1.1.tgz` 成功；`yunxiao --help` 输出完整命令树（auth/whoami/project/wi/sprint/pipeline/status/user）；`yunxiao --version` 输出 `0.1.1`；无错误
- CONTRIBUTING.md 末尾新增"发布流程"章节，涵盖手动发布步骤和自动发布（GitHub Actions + NPM_TOKEN）说明
- sprint-status.yaml 中 6-2 → review（待 code review 通过后→done）

### File List

- `README.md`（修改安装章节）
- `CONTRIBUTING.md`（追加发布流程章节）
- `_bmad-output/implementation-artifacts/6-2-manual-publish-verification.md`（本 story 文件）
- `_bmad-output/implementation-artifacts/sprint-status.yaml`（6-2 状态更新）
