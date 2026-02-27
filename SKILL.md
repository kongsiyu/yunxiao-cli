# yunxiao Skill

CLI 工具，封装阿里云云效（Yunxiao DevOps）OpenAPI，用于管理项目和工作项。

## 环境要求

需要设置以下环境变量（可在 `.env.ps1` 或系统环境变量中配置）：

```bash
YUNXIAO_PAT=<个人访问令牌>
YUNXIAO_ORG_ID=<组织ID>
YUNXIAO_PROJECT_ID=<默认项目ID>   # 可选
YUNXIAO_USER_ID=<当前用户ID>      # create 工作项时用
```

## 可用命令

### 项目

```bash
yunxiao project list [--name <关键词>] [--limit N]
yunxiao project view <projectId>
```

### 工作项

```bash
# 列出
yunxiao workitem list [--project <id>] [--category Req|Task|Bug] [--status <id>] [--query <keyword>]

# 查看（支持序列号 如 GJBL-1 或 workitem ID）
yunxiao workitem view <id|serialNumber>

# 创建
yunxiao workitem create --title "标题" [--category Req] [--description "描述"] [--assigned-to <userId>]

# 更新
yunxiao workitem update <id> [--title "新标题"] [--status <statusId>] [--description "..."] [--assigned-to <userId>]

# 评论
yunxiao workitem comment <id> "评论内容"
yunxiao workitem comments <id>

# 工作项类型
yunxiao workitem types [--category Req|Task|Bug]
```

## 使用示例

当用户说"列出所有设计中的需求"：
```bash
yunxiao wi list --status 设计中
```

当用户说"创建一个 bug"：
```bash
yunxiao wi create --title "登录页面崩溃" --category Bug
```

当用户说"给 GJBL-1 加个评论"：
```bash
yunxiao wi comment GJBL-1 "已确认，安排修复"
```

当用户说"查看 GJBL-1 详情"：
```bash
yunxiao wi view GJBL-1
```

## 注意事项

- 评论内容不支持 emoji 表情
- workitem list 的 `--status` 接受状态名称（中文如"设计中"）或状态 ID
- 创建工作项需要 `YUNXIAO_USER_ID` 或 `--assigned-to` 指定负责人
- 序列号查找需要设置 `YUNXIAO_PROJECT_ID` 或 `--project`
