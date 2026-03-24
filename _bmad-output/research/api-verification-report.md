# API 验证报告 -- 对照 CLI 方案

**日期:** 2026-03-22
**目的:** 验证头脑风暴方案中每个 CLI 功能的 API 可行性，标记需要修正的设计

---

## 1. 现有代码 Bug（对照官方 API 文档）

### Bug 1: listSprints 路径错误

**当前代码 (api.js:169):**
```javascript
const url = `/oapi/v1/projex/organizations/${orgId}/sprints`;
// 用 spaceId 作为查询参数
```

**正确路径:**
```
GET /oapi/v1/projex/organizations/{organizationId}/projects/{id}/sprints
```

Sprint 列表是项目维度的，projectId 在路径中，不是查询参数。

### Bug 2: resolveWorkitemId 按标题搜索（api.js:191-221）

**当前逻辑:** 把序列号数字部分作为 `subject`（标题）搜索，匹配不准确。

**正确逻辑:** 用 `category: "Req,Task,Bug"` 搜索全类型，在返回结果中精确匹配 `serialNumber` 字段。

### Bug 3: searchWorkitems 默认 category 只搜 Req（api.js:113）

**当前:** `category: opts.category || "Req"`
**应改为:** `category: opts.category || "Req,Task,Bug"`（搜全部类型）

---

## 2. 头脑风暴方案修正

### 修正 1: 移除评论编辑/删除（feat/11 不可行）

| 原计划 | 修正 | 原因 |
|--------|------|------|
| `wi comment-edit <id> <commentId> "新内容"` | 移除 | 新版 PAT API 无 UpdateWorkitemComment |
| `wi comment-delete <id> <commentId>` | 移除 | 新版 PAT API 无 DeleteWorkitemComment |

> feat/11 分支基于旧版 ROA API 开发。新版 PAT API 只支持创建评论和列出评论。

### 修正 2: Sprint view 简化

| 原计划 | 修正 |
|--------|------|
| `listSprints` + `searchWorkitems` 组合方案 | 直接用 `GetSprintInfo` 获取详情 + `searchWorkitems` 获取工作项统计 |

`GetSprintInfo` API 存在且可用，无需从列表中筛选。Sprint view 仍需要组合 searchWorkitems 来获取工作项完成统计（因为 GetSprintInfo 只返回 Sprint 基本信息，不含工作项数据）。

### 修正 3: Status 命令改为查工作流

| 原计划 | 修正 |
|--------|------|
| `status list --project <id> --category <type>` | `status list --project <id> --type-id <workitemTypeId>` |
| 使用 feat/9 的 getWorkitemStatuses API | 使用 GetWorkitemWorkflow API |

**新 API 路径:**
```
GET /oapi/v1/projex/organizations/{orgId}/projects/{projectId}/workitemTypes/{workitemTypeId}/workflows
```

状态查询维度是工作项类型（workitemTypeId），不是项目 + category。用户需要先知道 workitemTypeId。

**建议 UX:** `status list` 默认先查所有 workitemTypes，然后自动查每个类型的工作流状态，合并输出。或者按 `--category Req` 先查类型再查状态，对用户隐藏 typeId 概念。

### 修正 4: CreateWorkitem 必填参数

原计划中 `wi create` 的参数设计需要调整：

| API 必填参数 | CLI 参数 | 说明 |
|-------------|---------|------|
| assignedTo (userId) | `--assigned-to <userId>` | 必填，需要用户 ID |
| spaceId (projectId) | 自动从配置获取 | 无需用户传 |
| subject | `--title "..."` | 必填 |
| workitemTypeId | `--type <typeId>` | **新增必填参数！** 需要先查 `wi types` |

> **重要:** 原计划中 `--category <Req/Task/Bug>` 不是 API 直接支持的参数。创建工作项需要具体的 `workitemTypeId`，不是 category 字符串。CLI 应该提供便捷转换：`--category Req` -> 查 ListWorkitemTypes 获取默认 Req 类型的 ID。

---

## 3. 需新增的 API 函数

| 函数 | API | 用途 |
|------|-----|------|
| `getSprint(client, orgId, projectId, sprintId)` | GET `.../projects/{projectId}/sprints/{id}` | Sprint 详情 |
| `getWorkitemWorkflow(client, orgId, projectId, typeId)` | GET `.../workitemTypes/{id}/workflows` | 查状态列表 |
| `getProjectMembers(client, orgId, projectId, opts)` | GET `.../projects/{id}/members` | 查项目成员 |

---

## 4. 需修改的 API 函数

| 函数 | 问题 | 修复 |
|------|------|------|
| `listSprints` | 路径错误 | 改为 `/projects/{id}/sprints` |
| `searchWorkitems` | 默认 category 只搜 Req | 默认改为 "Req,Task,Bug" |
| `resolveWorkitemId` | 按 subject 搜索不准确 | 改为全类型搜索 + 匹配 serialNumber |

---

## 5. 需删除的代码

| 函数/文件 | 原因 |
|-----------|------|
| `createClient()` (api.js:44-51) | 死代码，从未被调用 |
| `getConfig()` (api.js:53-60) | 死代码，从未被调用 |
| `commands/attachment.js` | 上传不支持，已计划删除 |
| `commands/query.js` | AI 不需要保存搜索 |
| `commands/storage.js` | query 的依赖 |

---

## 6. 功能可行性最终矩阵

| CLI 命令 | API 支持 | 状态 |
|---------|---------|------|
| `auth login/status/logout` | 无需 API（本地操作） | OK |
| `whoami` | GetCurrentUser | OK |
| `project list` | SearchProjects | OK |
| `project view` | GetProject | OK |
| `wi list` | SearchWorkitems | OK（需修默认 category） |
| `wi view` | GetWorkitem / SearchWorkitems | OK（需修 resolveWorkitemId） |
| `wi create` | CreateWorkitem | OK（需加 workitemTypeId） |
| `wi update` | UpdateWorkitem | OK |
| `wi delete` | DeleteWorkitem | OK |
| `wi comment` | CreateWorkitemComment | OK |
| `wi comments` | ListWorkitemComments | OK |
| `wi comment-edit` | 无 API | **移除** |
| `wi comment-delete` | 无 API | **移除** |
| `wi types` | ListWorkitemTypes | OK |
| `sprint list` | ListSprints | OK（需修路径） |
| `sprint view` | GetSprintInfo + SearchWorkitems | OK |
| `status list` | GetWorkitemWorkflow | OK（需改设计） |
| `user list` | ListProjectMembers | OK |
| `user search` | ListProjectMembers(name filter) | OK |

---

## 7. 更新后的实施优先级

### Phase 0 不变: SKILL 草案

### Phase 1 修正: 核心重构

1. 删除 query/attachment/storage + 清理依赖
2. 删除 api.js 死代码
3. 删除 pnpm-lock.yaml
4. **修复 listSprints 路径**
5. **修复 searchWorkitems 默认 category**
6. **修复 resolveWorkitemId 用 serialNumber**
7. 命令注册始终可见
8. `wi create/update --json` 改名 `--fields`
9. Sprint 重写（**加 getSprint**）
10. `auth login --token --org-id`
11. **`wi create` 加 workitemTypeId 处理逻辑**

### Phase 2 修正: 新功能

1. 全局 `--json` flag
2. **status list 改用 GetWorkitemWorkflow**（非 feat/9 方案）
3. `user list/search`（feat/8 可用，但成员查询 API 改为 ListProjectMembers）
4. Sprint view = GetSprintInfo + SearchWorkitems 组合
5. `wi delete --force`
6. `--limit` 默认值 30
7. ~~评论编辑/删除~~ **已移除**

### Phase 3 不变: 质量 + 发布
