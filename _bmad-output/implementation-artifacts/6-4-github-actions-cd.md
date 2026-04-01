# Story 6.4：GitHub Actions CD

Status: review

## Story

As a developer,
I want automated npm publishing triggered by git tags,
So that releases are consistent and don't require manual publish steps.

## Acceptance Criteria

1. **Given** 推送 `v*` 格式的 git tag（如 `v1.0.0`）
   **When** GitHub Actions 触发
   **Then** `.github/workflows/publish.yml` 执行 `npm publish`，使用 secrets 中的 NPM_TOKEN

2. **Given** 发布成功
   **When** 检查 npm registry
   **Then** 对应版本的包可在 npm 查到并安装（`@kongsiyu/yunxiao-cli`）

## Tasks / Subtasks

- [x] 创建 `.github/workflows/publish.yml` CD workflow 文件 (AC: #1)
  - [x] 触发条件：`on: push: tags: ['v*']`
  - [x] 使用 `actions/checkout@v4` 和 `actions/setup-node@v4`（带 npm registry 配置）
  - [x] 执行 `npm ci` 安装依赖
  - [x] 执行 `npm publish --access public`，环境变量 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`
- [x] 更新 `_bmad-output/implementation-artifacts/sprint-status.yaml` 中 `6-4-github-actions-cd` 为 `done` (AC: #1, #2)

## Dev Notes

### 技术背景

- 项目为 npm scoped package：`@kongsiyu/yunxiao-cli`，scope 为 `@kongsiyu`
- `package.json` 中已设置 `"type": "module"`，Node.js ESM 项目
- 已存在 CI workflow：`.github/workflows/ci.yml`，触发于 PR 和 push to master
- npm 发布需要 `--access public`，因为 scoped package 默认为 private
- GitHub repository secrets 中需预先配置 `NPM_TOKEN`（通过 npm 控制台生成）

### publish.yml 结构要点

```yaml
on:
  push:
    tags:
      - 'v*'
```

- `setup-node` 需配置 `registry-url: 'https://registry.npmjs.org'`，以便 npm 认证
- `NODE_AUTH_TOKEN` 是 setup-node 识别的标准环境变量名

### 已存在 CI workflow 参考

`.github/workflows/ci.yml` 使用：
- `actions/checkout@v4`
- `actions/setup-node@v4`（带 `cache: 'npm'`）
- node matrix 18.x / 20.x / 22.x（CD 只需单一版本，选 LTS 20.x 即可）

### 不需要做的事

- **不需要**修改 `package.json`（Story 6-1 已完成所有 npm 包配置）
- **不需要**修改测试或源代码
- **不需要**配置 `NPM_TOKEN` secret（这是运维操作，超出代码范围，只需文档说明）
- **不需要**创建 GitHub release（仅 npm publish 即可满足验收标准）

### Project Structure Notes

- 工作流文件位于：`.github/workflows/`
- CD 文件名：`publish.yml`（与 Story 6-3 CI 文件 `ci.yml` 并列，但本 story 只负责 CD）
- sprint-status.yaml 路径：`_bmad-output/implementation-artifacts/sprint-status.yaml`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.4] — 验收标准
- [Source: _bmad-output/planning-artifacts/prd.md#FR31] — GitHub Actions 自动化发布要求
- [Source: .github/workflows/ci.yml] — 已有 CI workflow 作为参考
- [Source: _bmad-output/implementation-artifacts/6-1-npm-package-config.md] — package.json 已完成配置

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

无

### Completion Notes List

- 创建 `.github/workflows/publish.yml`：触发条件 `push: tags: v*`，使用 `actions/setup-node@v4` 配置 npm registry，执行 `npm publish --access public`，NPM_TOKEN 通过 `NODE_AUTH_TOKEN` 注入
- 编译验证通过：`npm run lint` 输出 `0.1.1`
- 单元测试全部通过：25/25，无回归

### File List

- `.github/workflows/publish.yml`（新增）
- `_bmad-output/implementation-artifacts/6-4-github-actions-cd.md`（本文件）
