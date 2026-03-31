# CLAUDE.md — bmad-expert

---

## 工作流命令

工作流文件位于 `workflow/` 目录，供 AI Agent 按步骤执行。

### dev-story — 开发 Story

**触发**：用户说 `start story`，后跟 Story 编号（如 `1-2`）

执行步骤：读取 `workflow/story-dev-workflow-single-repo.md`。按对应工作流步骤执行。

**跨会话接力**：上一会话若只做到「创建 Story」或只做到「实现」即结束，用户在新会话仍用上述触发句式，并在同一条消息中附带 **`BACKEND_ROOT_ABS`**（必带）、`BACKEND_ROOT`（可选相对路径）、`BRANCH`、已做到哪一步、下一步只做实现或只做代码审查等上下文；模板见所执行工作流文件中的「跨会话启动词」。