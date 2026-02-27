# yunxiao CLI

阿里云云效（Yunxiao）DevOps 平台命令行工具，风格参考 `gh`。

## 安装

```bash
# 全局安装（npm link）
cd yunxiao-cli
npm install
npm link

# 或者直接运行
node src/index.js [command]
```

## 环境变量配置

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `YUNXIAO_PAT` | ✅ | 云效个人访问令牌（Personal Access Token）|
| `YUNXIAO_ORG_ID` | ✅ | 组织 ID |
| `YUNXIAO_PROJECT_ID` | 可选 | 默认项目 ID（workitem 命令默认使用）|
| `YUNXIAO_USER_ID` | 可选 | 当前用户 ID（create 时作为默认 assignedTo）|

> 如何获取 PAT：https://help.aliyun.com/zh/yunxiao/developer-reference/obtain-personal-access-token

## 使用

### 项目管理

```bash
# 列出项目
yunxiao project list
yunxiao project list --name "系统" --limit 10

# 查看项目详情
yunxiao project view <projectId>
```

### 工作项管理

```bash
# 列出工作项
yunxiao workitem list
yunxiao wi list --category Req --limit 20
yunxiao wi list --status 设计中 --query "关键词"

# 查看工作项（支持序列号如 GJBL-1）
yunxiao wi view GJBL-1
yunxiao wi view <workitemId>

# 创建工作项
yunxiao wi create --title "新需求标题"
yunxiao wi create --title "标题" --category Bug --description "详细描述"
yunxiao wi create --title "标题" --assigned-to <userId>

# 更新工作项（by ID）
yunxiao wi update <id> --title "新标题"
yunxiao wi update <id> --status <statusId>

# 添加评论
yunxiao wi comment <id> "评论内容（不支持 emoji）"

# 列出评论
yunxiao wi comments <id>

# 列出工作项类型
yunxiao wi types
yunxiao wi types --category Bug
```

## API 说明（已验证）

基础 URL：`https://openapi-rdc.aliyuncs.com`

| 接口 | Method | Path |
|------|--------|------|
| 搜索项目 | POST | `/oapi/v1/projex/organizations/{orgId}/projects:search` |
| 获取项目 | GET | `/oapi/v1/projex/organizations/{orgId}/projects/{id}` |
| 搜索工作项 | POST | `/oapi/v1/projex/organizations/{orgId}/workitems:search` |
| 获取工作项 | GET | `/oapi/v1/projex/organizations/{orgId}/workitems/{id}` |
| 创建工作项 | POST | `/oapi/v1/projex/organizations/{orgId}/workitems` |
| 更新工作项 | PUT | `/oapi/v1/projex/organizations/{orgId}/workitems/{id}` |
| 添加评论 | POST | `/oapi/v1/projex/organizations/{orgId}/workitems/{id}/comments` |
| 列出评论 | GET | `/oapi/v1/projex/organizations/{orgId}/workitems/{id}/comments` |
| 工作项类型 | GET | `/oapi/v1/projex/organizations/{orgId}/projects/{id}/workitemTypes?category=Req` |
| 获取当前用户 | GET | `/oapi/v1/platform/user` （需要 platform scope 权限）|

### 注意事项

- 评论内容不支持 emoji 表情符号
- 创建工作项必须提供 `assignedTo`（用户 ID）
- 搜索工作项时 `category` 必填（Req/Task/Bug）
- workitem types 的 `category` 参数必填

## 版本历史

- **v0.1.0** - 基础功能：项目管理 + 工作项 CRUD + 评论
