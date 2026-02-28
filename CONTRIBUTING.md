# 开发规范

本文档记录 yunxiao-cli 项目的开发流程和工作标准。

---

## 工作流程

### 1. 需求 → Issue

- 每个功能/修复必须对应一个 GitHub Issue
- Issue 标题格式：`T[优先级]: 功能描述`
- Issue 内容包含：
  - 功能描述
  - 命令设计（如适用）
  - API 端点（如适用）
  - 使用示例

### 2. 开发 → 分支

- 从 `main` 创建功能分支
- 分支命名：`feat/<issue编号>-简短描述` 或 `fix/<issue编号>-简短描述`
- 示例：`feat/5-workitem-id-resolution`

### 3. 提交 → Commit

- 使用有意义的提交信息
- 格式：`<类型>: <描述>`
- 类型：`feat` / `fix` / `docs` / `refactor` / `test` / `chore`
- 示例：`feat: add JSON input support for wi create/update`

### 4. 完成 → PR

- 每个 Issue 对应一个 Pull Request
- PR 标题与 Issue 标题一致
- PR 描述包含：
  - 功能说明
  - 技术实现
  - 相关 Issue（`Fixes #编号`）
  - 测试说明
- 关联到 Roadmap 中的对应任务

### 5. 审核 → Merge

- CI 检查必须通过
- 至少一人 Review
- 使用 Squash Merge 保持历史清晰

---

## 代码规范

### 1. 命令设计

- 参考 `gh` CLI 风格
- 主命令 + 子命令结构：`yunxiao <resource> <action>`
- 缩写支持：`wi` = `workitem`

### 2. API 调用

- 所有 API 调用封装在 `src/api.js`
- 函数命名：`<action><Resource>` 如 `searchProjects`, `getWorkitem`
- 错误处理统一在入口层

### 3. 输出格式

- 成功：绿色 `✓` + 描述
- 失败：红色 `✗` + 错误信息
- 列表：表格或简洁格式
- 详情：字段对齐显示

### 4. 配置管理

- 配置文件：`~/.yunxiao/config.json`
- 配置内容：`{ pat, userId, userName, orgId, orgName }`
- 优先级：环境变量 > 配置文件

---

## 优先级定义

| 优先级 | 说明 | 时间框 |
|--------|------|--------|
| T0 | 基础设施（CI/CD、自动化） | 立即 |
| T1 | 核心功能（接口完备性） | 1-2 周 |
| T2 | 扩展功能（体验优化） | 3-4 周 |
| T3 | 低频功能（可选） | 后续 |

---

## 文档要求

### README.md

- 安装说明
- 使用示例
- API 说明
- 开发计划（Roadmap）

### Issue 模板

- 功能描述
- 使用场景
- API 参考
- 验收标准

### 版本历史

- 每次发布更新版本号
- 记录主要变更

---

## 检查清单

### 提交前

- [ ] 代码通过 lint 检查
- [ ] 功能已测试
- [ ] 文档已更新
- [ ] Commit 信息规范

### PR 前

- [ ] CI 检查通过
- [ ] 关联 Issue
- [ ] 更新 Roadmap 状态
- [ ] 请求 Review

### Merge 后

- [ ] 关闭关联 Issue
- [ ] 更新 Roadmap 状态为 ✅
- [ ] 删除功能分支

---

> 📌 本规范适用于所有贡献者。首次贡献请先阅读本文档。
