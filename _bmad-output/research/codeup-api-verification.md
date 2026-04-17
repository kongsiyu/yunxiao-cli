# Codeup API 验证与仓库/MR 端点确认 - 研究报告

**日期**: 2026-04-17  
**作者**: BMAD Developer Senior  
**状态**: 初稿 - 待 API 实际验证

---

## 执行摘要

本 Spike 任务旨在验证 Codeup API 的兼容性，并确认仓库（Repository）和合并请求（Merge Request, MR）端点的规范，为 Epic 10（Codeup 集成）的后续 Stories 10.2-10.6 提供技术基础。

**关键发现**（待实际验证）：
- 现有 PAT (`x-yunxiao-token`) 是否可直接用于 Codeup API
- 9 个关键 API 问题的可行性结论
- 对 Stories 10.2-10.6 实现路径的影响

---

## 验证的 9 个关键问题

### Q1: Codeup API base URL 和路径前缀

**问题描述**：  
确认 Codeup API 服务地址和路径前缀。

**预期答案**：
- Base URL: `https://codeup.aliyuncs.com` 或其他
- API 前缀: `/api/v3` 或 `/api/v2` 或其他

**验证方法**：
- 查阅 Codeup 官方 API 文档
- 检查现有项目中是否有 Codeup API 调用示例

**影响**：
- 所有后续 API 调用的基础
- 决定 API 客户端的初始化配置

**结论**：待实际验证

---

### Q2: 现有 PAT (`x-yunxiao-token`) 是否可访问 Codeup API

**问题描述**：  
验证现有的 Personal Access Token 是否兼容 Codeup API，以及认证方式是否一致。

**预期答案**：
- 兼容：PAT 可直接用于 Codeup API，认证方式相同（Header: `x-yunxiao-token`）
- 不兼容：需要独立的 Codeup PAT 或不同的认证方式

**验证方法**：
- 使用现有 PAT 调用 Codeup API 的简单端点（如 `/user`）
- 检查响应状态码和错误信息

**影响**：
- 如果兼容：可复用现有认证机制，简化实现
- 如果不兼容：需要独立的 Codeup 认证流程，增加复杂度

**关键风险**：
- 如果 PAT 不兼容，需要在 `auth login` 中添加 Codeup 认证步骤
- 可能需要在 config 中存储两个不同的 token

**结论**：待实际验证

---

### Q3: `repoId` 的真实标识符类型

**问题描述**：  
确认 Codeup API 中仓库的标识符格式。

**预期答案**：
- UUID 格式（如 `550e8400-e29b-41d4-a716-446655440000`）
- 数字 ID（如 `12345`）
- 字符串标识符（如 `my-repo`）
- 其他格式

**验证方法**：
- 调用 `/projects` 或 `/repos` 端点列出仓库
- 检查返回数据中的 `id` 字段格式

**影响**：
- 决定 CLI 中如何接收和传递 repoId
- 影响 Stories 10.2-10.6 中的参数处理

**结论**：待实际验证

---

### Q4: `repo list` 的端点路径、必填参数、返回字段

**问题描述**：  
确认列出仓库的 API 端点规范。

**预期答案**：
- 端点路径：`GET /projects` 或 `GET /repos` 或其他
- 必填参数：无或需要 orgId/groupId
- 可选参数：`page`, `per_page`, `search`, `status` 等
- 返回字段：`id`, `name`, `description`, `url`, `created_at` 等

**验证方法**：
- 调用 repo list 端点
- 检查分页参数是否有效
- 记录返回的字段名

**影响**：
- Story 10.2 的实现基础
- 决定 CLI 中 `repo list` 命令的参数和输出格式

**结论**：待实际验证

---

### Q5: `repo view` 的端点路径、必填参数、返回字段

**问题描述**：  
确认查看单个仓库详情的 API 端点规范。

**预期答案**：
- 端点路径：`GET /projects/{repoId}` 或 `GET /repos/{repoId}` 或其他
- 必填参数：`repoId`
- 返回字段：仓库的详细信息（包括分支、标签、成员等）

**验证方法**：
- 调用 repo view 端点
- 检查返回的详细字段

**影响**：
- Story 10.3 的实现基础
- 决定 CLI 中 `repo view` 命令的输出内容

**结论**：待实际验证

---

### Q6: `mr list` 的端点路径、必填参数、返回字段

**问题描述**：  
确认列出合并请求的 API 端点规范。

**预期答案**：
- 端点路径：`GET /projects/{repoId}/merge_requests` 或类似
- 必填参数：`repoId`
- 可选参数：`page`, `per_page`, `state` (opened/merged/closed), `author_id` 等
- 返回字段：`id`, `title`, `description`, `source_branch`, `target_branch`, `state`, `author`, `created_at` 等

**验证方法**：
- 调用 mr list 端点
- 检查分页和过滤参数
- 记录返回的字段名

**影响**：
- Story 10.4 的实现基础
- 决定 CLI 中 `mr list` 命令的参数和输出格式

**结论**：待实际验证

---

### Q7: `mr view` 的端点路径、必填参数、返回字段

**问题描述**：  
确认查看单个合并请求详情的 API 端点规范。

**预期答案**：
- 端点路径：`GET /projects/{repoId}/merge_requests/{mrId}` 或类似
- 必填参数：`repoId`, `mrId`
- 返回字段：MR 的详细信息（包括评论、提交、检查状态等）

**验证方法**：
- 调用 mr view 端点
- 检查返回的详细字段

**影响**：
- Story 10.5 的实现基础
- 决定 CLI 中 `mr view` 命令的输出内容

**结论**：待实际验证

---

### Q8: `mr create` 的端点路径、必填参数、工作项关联字段名

**问题描述**：  
确认创建合并请求的 API 端点规范，特别是工作项关联字段。

**预期答案**：
- 端点路径：`POST /projects/{repoId}/merge_requests` 或类似
- 必填参数：`title`, `source_branch`, `target_branch`
- 可选参数：`description`, `assignee_id`, `reviewer_ids` 等
- 工作项关联字段：`workitem_id` 或 `issue_id` 或其他

**验证方法**：
- 调用 mr create 端点（可能需要测试分支）
- 检查是否支持工作项关联参数
- 记录所有必填和可选参数

**影响**：
- Story 10.6 的实现基础
- 决定 CLI 中 `mr create` 命令的参数

**关键风险**：
- 如果不支持 API 参数关联，需要依赖 commit message 关键字

**结论**：待实际验证

---

### Q9: MR 与工作项的关联机制

**问题描述**：  
确认 Codeup 中 MR 与工作项的关联方式。

**预期答案**：
- 方式 A：API 参数（在 mr create 时指定 workitem_id）
- 方式 B：Commit message 关键字（如 "Fixes #123" 或 "Closes PROJ-456"）
- 方式 C：两者都支持
- 方式 D：需要单独的关联 API 调用

**验证方法**：
- 查阅 Codeup API 文档
- 测试 mr create 时是否接受 workitem_id 参数
- 检查是否有单独的关联端点

**影响**：
- Story 10.6 中工作项与 MR 的关联实现方式
- 决定用户体验（是否需要显式指定工作项 ID）

**关键风险**：
- 如果只支持 commit message 关键字，需要在 CLI 中提示用户
- 如果关联机制复杂，可能需要额外的验证步骤

**结论**：待实际验证

---

## 验证脚本

已创建 `test/spike-codeup-api.js` 脚本，用于自动化验证上述 9 个问题。

**使用方法**：
```bash
export YUNXIAO_PAT="your-pat-here"
export CODEUP_API_BASE="https://codeup.aliyuncs.com"
export CODEUP_API_PREFIX="/api/v3"
node test/spike-codeup-api.js
```

**输出**：
- 控制台输出每个问题的验证结果
- `test/spike-codeup-api-results.json` 包含详细的 JSON 结果

---

## 关键风险与缓解策略

### 风险 1: PAT 不兼容

**风险描述**：现有 PAT 无法访问 Codeup API

**影响**：
- 需要独立的 Codeup 认证流程
- 增加 `auth login` 的复杂度
- 用户需要管理两个 token

**缓解策略**：
- 在 config 中支持 `codeup_pat` 字段
- 在 `auth login` 中添加可选的 Codeup 认证步骤
- 提供清晰的文档说明

### 风险 2: API 文档过时

**风险描述**：实际 API 与文档不符

**影响**：
- 端点路径、参数、返回字段与预期不同
- 需要额外的调试和适配

**缓解策略**：
- 通过验证脚本实际测试 API
- 记录实际的端点和参数
- 在报告中明确说明与文档的差异

### 风险 3: 工作项关联失败

**风险描述**：MR 与工作项的关联机制不清楚或不支持

**影响**：
- Story 10.6 的实现受阻
- 可能需要调整 Epic 10 的范围

**缓解策略**：
- 详细验证关联机制
- 如果 API 不支持，探索 commit message 关键字方案
- 在报告中明确说明替代方案

### 风险 4: 字段名不一致

**风险描述**：返回字段与预期不符

**影响**：
- 数据解析失败
- 需要额外的字段映射逻辑

**缓解策略**：
- 在验证脚本中记录实际的字段名
- 在报告中提供字段映射表
- 在实现中使用灵活的字段访问方式

---

## 对 Stories 10.2-10.6 的影响

### Story 10.2: repo list 命令

**依赖**：Q1, Q2, Q4

**预期影响**：
- 如果 Q1/Q2 验证成功，可直接实现
- 如果 Q4 返回字段与预期不同，需要调整输出格式

### Story 10.3: repo view 命令

**依赖**：Q1, Q2, Q3, Q5

**预期影响**：
- 如果 Q3 确认 repoId 格式，可确定参数处理方式
- 如果 Q5 返回字段丰富，可提供更详细的输出

### Story 10.4: mr list 命令

**依赖**：Q1, Q2, Q6

**预期影响**：
- 如果 Q6 支持过滤参数，可实现高级过滤功能
- 否则需要在客户端实现过滤

### Story 10.5: mr view 命令

**依赖**：Q1, Q2, Q7

**预期影响**：
- 如果 Q7 返回详细信息，可提供完整的 MR 视图
- 否则可能需要多个 API 调用

### Story 10.6: mr create 命令

**依赖**：Q1, Q2, Q8, Q9

**预期影响**：
- 如果 Q8/Q9 支持工作项关联，可直接实现
- 如果不支持，需要使用 commit message 关键字或其他方案

---

## 建议与后续步骤

### 立即行动

1. **运行验证脚本**
   - 使用有效的 PAT 和 Codeup API 地址
   - 收集实际的 API 响应数据

2. **更新本报告**
   - 将验证结果填入各问题的"结论"部分
   - 记录任何与预期不符的地方

3. **评估风险**
   - 如果发现关键问题，立即上报
   - 评估对 Epic 10 范围的影响

### 后续步骤

1. **创建 GitHub PR**
   - 包含验证脚本和研究报告
   - 链接到 GitHub Issue #70

2. **分配后续 Stories**
   - 基于验证结果，确认 Stories 10.2-10.6 的可行性
   - 如需调整范围，更新 Epic 10 的定义

3. **编写实现指南**
   - 基于验证结果，为每个 Story 编写详细的实现指南
   - 包括 API 端点、参数、错误处理等

---

## 附录：验证脚本输出示例

（待实际运行后填充）

```json
{
  "q1_base_url": {
    "base_url": "https://codeup.aliyuncs.com",
    "api_prefix": "/api/v3",
    "full_base": "https://codeup.aliyuncs.com/api/v3",
    "status": "configured"
  },
  "q2_pat_compatibility": {
    "status": "compatible",
    "auth_method": "x-yunxiao-token header",
    "verified_endpoint": "/user",
    "response_status": 200
  },
  ...
}
```

---

**报告完成日期**: 2026-04-17  
**下一步审查**: 待 API 实际验证后更新
