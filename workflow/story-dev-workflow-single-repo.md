# Story 开发工作流（单仓库 / 无子模块）

> 本文件是 single-repo story 执行的 canonical 规范源。
>
> 若仓库为「父仓库 + `backend` Git Submodule」结构，请使用对应 submodule workflow，不要套用本文件。

本文件适用于**单一 Git 仓库**：代码、BMAD 产物、文档均在同一检出根目录，无嵌套子模块。

---

## 1. Canonical 启动协议

### 1.1 Issue 描述必须包含的字段

repo 型 story 执行 issue 必须先给出仓库路径，再给出启动命令：

```text
REPO_PATH: /absolute/path/to/main/repo

start story <epic>-<story> [可选步骤...] [确认模式]
```

示例：

```text
REPO_PATH: /home/paperclip/workspaces/yunxiao-cli

start story 11-1 单元测试|代码审查|Worktree模式 全部跳过
```

`REPO_PATH` 是**主克隆根目录**，用于首次 `cd`、读取 issue 所指仓库、创建 branch/worktree。进入 Worktree 模式后，后续执行根会切换为 `BACKEND_ROOT_ABS`，不得继续在主克隆中混写同一个 story。

### 1.2 `start story` 语法

唯一合法语法：

```text
start story <epic>-<story> [单元测试|代码审查|编译验证|Worktree模式] [全部跳过|AI判断|全部确认]
```

规则：

- `start story` 是进入本 workflow 的触发词，不是“直接开始编码”的同义词。
- `<epic>-<story>` 必填，例如 `11-1`。
- 可选步骤可省略，可用空格或 `|` 分隔。
- 可选步骤仅允许：`单元测试`、`代码审查`、`编译验证`、`Worktree模式`。
- 确认模式仅允许：`全部跳过`、`AI判断`、`全部确认`。
- 未写可选步骤时，默认不执行任何可选步骤。
- 未写确认模式时，默认 `全部跳过`。
- 当 issue 描述已经写出可选步骤或确认模式时，Agent 不得再次询问这些启动问题，必须按启动命令执行。

兼容入口：人工接力时可以写 `开发 story <epic>-<story>`，但新建 Paperclip story 执行 issue 应统一使用 `start story`。

### 1.3 哪些参数属于启动词

以下参数属于启动词层，必须从 `start story` 行解析，不通过后续交互重新采集：

| 参数 | 来源 | 说明 |
|---|---|---|
| Story 编号 | `<epic>-<story>` | 例如 `11-1`。 |
| 可选步骤 | `单元测试` / `代码审查` / `编译验证` / `Worktree模式` | 控制步骤 4、5、6 与 Worktree 创建。 |
| 确认模式 | `全部跳过` / `AI判断` / `全部确认` | 控制执行暂停策略。 |

### 1.4 哪些仍允许交互采集

以下信息不属于启动词固定参数。只有在无法从 repo、story、issue 或项目约定中可靠推断时，才允许按确认模式暂停采集：

- 分支 slug 或依赖基点无法判断。
- 启用 `编译验证` / `单元测试` 后，项目实际命令无法从 `package.json`、构建脚本或项目文档中判断。
- GitHub issue / PR 目标分支存在多候选且无法自动消歧。
- 操作具有破坏性或不可逆，例如合并、删除远端分支、删除 worktree。
- 遇到 blocked 状态，需要人类补充缺失基线、权限或产品决策。

不得把上述交互机制用于重新询问已在 `start story` 行给出的可选步骤或确认模式。

---

## 2. 术语与会话变量

single-repo story 执行只认一个当前执行根：`BACKEND_ROOT_ABS`。

| 变量 | 含义 | 何时确定 |
|---|---|---|
| `REPO_PATH` | issue 描述中的主克隆绝对路径。Worktree 模式下它仍是创建/清理 worktree 的锚点，不是后续 story 执行根。 | 启动解析时。 |
| `BRANCH` | 当前 story 分支，例如 `story/11-1-i18n-audit-rollout-scope`。 | 步骤 1。 |
| `WORKTREE_MODE` | `true` 表示启用 `Worktree模式`；`false` 表示普通模式。 | 启动解析时。 |
| `BACKEND_ROOT` | 当前执行根的可读路径。普通模式通常等于 `REPO_PATH`；Worktree 模式为 `../worktrees/<BRANCH>`。 | 步骤 1。 |
| `BACKEND_ROOT_ABS` | 当前执行根绝对路径；跨会话接力必填。 | 步骤 1。 |

执行范围规则：

- `bmad-create-story`、`bmad-dev-story`、编译、测试、`bmad-code-review`、`git`、`gh` 都必须在 `BACKEND_ROOT_ABS` 执行。
- 普通模式：`BACKEND_ROOT_ABS == REPO_PATH`。
- Worktree 模式：`BACKEND_ROOT_ABS != REPO_PATH`，步骤 1 创建 worktree 后，不得在主克隆继续修改同一 story 的文件。
- 主克隆的未提交文件不是 Worktree 模式的权威输入来源。

---

## 3. 确认模式

| 模式 | 行为 |
|---|---|
| `全部跳过` | 全流程自动执行；只有 blocked、不可逆操作或外部系统失败时暂停。 |
| `AI判断` | Agent 对高风险、含糊或不可逆步骤暂停；低风险步骤自动继续。 |
| `全部确认` | 每个步骤完成后暂停，展示结果并等待继续指令。 |

高风险步骤至少包括：

- 步骤 1 中发现当前工作树存在与本 story 冲突的未提交改动。
- 步骤 2 中权威输入缺失或 story 状态不允许执行。
- 步骤 6 代码审查发现必须修复项。
- 步骤 8 PR 创建失败或目标分支无法判断。
- 步骤 10 合并、删除分支、删除 worktree。

---

## 4. 跨会话接力格式

遇到 blocked、中断或需要后续 heartbeat 接力时，必须在 issue 评论中保留可恢复上下文。

最低格式：

```text
BLOCKED at step <N>: <reason>

To resume, comment with: start story <epic>-<story> -- resume from step <N>
BACKEND_ROOT_ABS=<abs path>
BRANCH=<branch name>
WORKTREE_MODE=<true|false>
```

建议额外补充：

```text
REPO_PATH=<main clone abs path>
START_OPTIONS=<原 start story 行中的可选步骤与确认模式>
PR=<url if created>
```

恢复规则：

- 恢复时先读取上一条 blocked/relay 评论中的 `BACKEND_ROOT_ABS`、`BRANCH`、`WORKTREE_MODE`。
- 不得无条件从步骤 1 重启。
- 若 `WORKTREE_MODE=true`，恢复后必须 `cd "$BACKEND_ROOT_ABS"`，不得回主克隆补做同一 story。
- 若 `BACKEND_ROOT_ABS` 不存在或分支丢失，标记 blocked，并说明需要人类或 BMAD Master 恢复基线。

---

## 5. 前置条件

执行步骤 1 前只允许读取 issue 描述并进入 `REPO_PATH`。若启动命令包含 `Worktree模式`，必须在步骤 1 创建 worktree 后，再执行任何 story 创建、实现、验证或审查工作。

进入步骤 2 前，目标执行根必须能直接读取以下权威输入：

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- story 引用的 PRD、readiness、architecture、sprint change 或其他 planning artifacts
- `workflow/story-dev-workflow-single-repo.md`
- issue 明确列出的其他 repo 内权威输入

如果这些输入只存在于主克隆未提交文件中，而当前是 Worktree 模式，必须 blocked；不得混用主克隆文件绕过可见基线。

---

## 6. 工作流步骤

### Step 1. 建立分支与执行根

目标：固化 `BRANCH`、`WORKTREE_MODE`、`BACKEND_ROOT`、`BACKEND_ROOT_ABS`。

执行要求：

- 在 `REPO_PATH` 检查仓库状态与默认分支。
- 不得执行 `git reset --hard`、`git checkout -- <file>` 等破坏性命令。
- 分支名格式：`story/<epic>-<story>-<slug>`。
- 基点优先级：issue 明确指定的基点分支 > gating 依赖分支 > 默认分支。

普通模式：

```bash
cd "$REPO_PATH"
git fetch origin
git checkout -b "$BRANCH" "$BASE_REF"
BACKEND_ROOT="$REPO_PATH"
BACKEND_ROOT_ABS="$(pwd)"
WORKTREE_MODE=false
```

Worktree 模式：

```bash
cd "$REPO_PATH"
git fetch origin
git branch "$BRANCH" "$BASE_REF"
WORKTREE_DIR="../worktrees/$BRANCH"
git worktree add "$WORKTREE_DIR" "$BRANCH"
cd "$WORKTREE_DIR"
BACKEND_ROOT="$WORKTREE_DIR"
BACKEND_ROOT_ABS="$(pwd)"
WORKTREE_MODE=true
```

Worktree 模式下，创建 worktree 是本步骤的核心动作，必须先于步骤 2。

### Step 2. 创建或确认 Story 文件

在 `BACKEND_ROOT_ABS` 执行。

要求：

- 验证 `epics.md` 与 `sprint-status.yaml` 中存在该 Story。
- Story 状态必须允许开发，通常为 `backlog` 或 `ready-for-dev`。
- 若 Story 文件不存在，运行 `bmad-create-story`。
- 若 Story 文件已存在，读取完整 Story 文件，确认 AC、任务、Dev Agent Record 与 File List。
- 若权威输入缺失或状态不允许执行，按跨会话接力格式 blocked。

### Step 3. 实现 Story

在 `BACKEND_ROOT_ABS` 执行 `bmad-dev-story`。

要求：

- 严格按 Story 文件任务顺序实现。
- 不擅自扩大 story 范围。
- 每完成一项任务，同步更新 Story 文件中的任务状态、Dev Agent Record 与 File List。
- 若发现 story 与规划输入冲突，blocked 并回填原因，不在开发 issue 中临场改范围。

### Step 4. 编译验证（可选）

仅当启动命令包含 `编译验证` 时执行。

在 `BACKEND_ROOT_ABS` 运行项目实际编译命令，例如 `npm run build`、`pnpm build`、`mvn compile`、`./gradlew build`。若无法判断命令，按确认模式暂停或 blocked。

### Step 5. 单元测试（可选）

仅当启动命令包含 `单元测试` 时执行。

在 `BACKEND_ROOT_ABS` 运行项目实际单元测试命令，例如 `npm test`、`pnpm test`、`mvn test`、`./gradlew test`。测试失败必须修复或 blocked，不得虚报通过。

### Step 6. 代码审查（可选）

仅当启动命令包含 `代码审查` 时执行。

在 `BACKEND_ROOT_ABS` 运行 `bmad-code-review`，修复必须修复项。若审查项涉及范围变更，blocked 并交由 Planner / BMAD Master 决定。

### Step 7. 提交代码

在 `BACKEND_ROOT_ABS` 提交本 story 的全部必要变更。

要求：

- Git 作者：`Sue <boil@vip.qq.com>`。
- 不添加 `Co-Authored-By`。
- 使用 Conventional Commits，例如 `feat(scope): subject`。
- 不提交与本 story 无关的用户改动。

### Step 8. 推送并创建 PR

PR 是强制步骤，不得跳过。

在 `BACKEND_ROOT_ABS` 执行：

- `git push -u origin "$BRANCH"`
- `gh pr create`

PR 要求：

- target branch 与步骤 1 的基点/依赖策略一致。
- PR body 至少包含 Summary 与 Test plan。
- 若存在同仓库 GitHub issue，可写 `Closes #N`；跨仓库 issue 不依赖自动关闭。
- 若 PR 创建失败，必须把 Paperclip issue 标记为 blocked，并附完整错误与接力上下文。

### Step 9. 回写状态与证据

在 `BACKEND_ROOT_ABS` 执行。

要求：

- 将 `_bmad-output/implementation-artifacts/sprint-status.yaml` 中该 Story 更新为 `done`。
- 若 Step 7 已提交过代码，需为状态回写创建 follow-up commit 并推送到同一 PR。
- 在 Paperclip issue 评论中回填变更文件、验证方式、PR 链接、是否启用可选步骤。
- 只有 PR 已创建后，才允许将 Paperclip issue 标记为 `done`。

### Step 10. 合并与清理（用户决定）

合并、删除远端分支、删除 worktree 属于收尾动作，默认由用户或 BMAD Master 决定时机。

Worktree 清理示例：

```bash
cd "$REPO_PATH"
git worktree remove "../worktrees/$BRANCH"
git branch -d "$BRANCH"
```

---

## 7. 速查表

| 项目 | Canonical 规则 |
|---|---|
| Issue repo 字段 | `REPO_PATH: <main clone abs path>` |
| 启动命令 | `start story <epic>-<story> [可选步骤...] [确认模式]` |
| 可选步骤 | `单元测试`、`代码审查`、`编译验证`、`Worktree模式` |
| 确认模式 | `全部跳过`、`AI判断`、`全部确认` |
| 默认值 | 无可选步骤；`全部跳过` |
| 执行根 | `BACKEND_ROOT_ABS` |
| Worktree 路径 | `../worktrees/<BRANCH>`，相对 `REPO_PATH` |
| 接力必填 | `BACKEND_ROOT_ABS`、`BRANCH`、`WORKTREE_MODE` |
| PR | 必须创建，失败则 blocked |
| 状态回写 | PR 创建后将 sprint story 状态更新为 `done` 并推送 |
