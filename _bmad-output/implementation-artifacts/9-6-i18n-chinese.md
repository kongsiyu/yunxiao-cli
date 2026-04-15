---
story_id: 9.6
story_key: 9-6-i18n-chinese
epic_id: 9
epic_title: 稳定性修复与 v0.2 增强
title: 多语言支持——中文优先
status: ready-for-dev
created_date: 2026-04-15
last_updated: 2026-04-15
---

# Story 9-6：多语言支持——中文优先

## 📋 需求概述

**用户故事：**
As a Chinese-speaking user,
I want the CLI output to be in Chinese,
So that I can understand command results and error messages without translation.

**业务价值：**
- 提升中文用户体验，降低理解成本
- 支持国际化基础设施，为未来多语言扩展奠定基础
- 增强工具的本地化竞争力

**来源：** [GitHub #63](https://github.com/kongsiyu/yunxiao-cli/issues/63)

---

## ✅ 验收标准

### AC1：系统 locale 为中文时自动切换
**Given** 系统 locale 为 zh-CN 或用户配置 `language: zh` 在 config 文件中
**When** 执行任意命令
**Then** 人类可读输出（表头、提示、错误消息）显示为中文

### AC2：非中文环境保持英文
**Given** 系统 locale 非中文且未配置 language
**When** 执行任意命令
**Then** 输出保持英文（默认行为不变）

### AC3：JSON 模式不受影响
**Given** `--json` 模式
**When** 执行任意命令
**Then** JSON 字段名保持英文不变，仅 human-readable 部分受语言设置影响

### AC4：配置优先级
**Given** 用户在 config 文件中设置 `language: zh`
**When** 执行任意命令
**Then** 使用中文输出，优先级：config 文件 > 系统 locale > 默认英文

---

## 🏗️ 技术需求

### 语言切换策略

#### 1. 语言检测机制
- **优先级顺序：**
  1. Config 文件中的 `language` 字段（最高优先级）
  2. 环境变量 `YUNXIAO_LANGUAGE`
  3. 系统 locale（通过 `process.env.LANG` 或 `process.env.LC_ALL`）
  4. 默认英文

#### 2. 支持的语言代码
- `en` - English（默认）
- `zh` - 简体中文

#### 3. 语言配置存储
- Config 文件路径：`~/.yunxiao/config.json`
- 新增字段：`language: "zh"` 或 `language: "en"`
- 示例：
  ```json
  {
    "token": "...",
    "orgId": "...",
    "projectId": "...",
    "language": "zh"
  }
  ```

### 输出范围

#### 需要国际化的内容
1. **表格输出**
   - 列标题（如 `Name`、`ID`、`Status` 等）
   - 表格提示文字

2. **命令提示和交互**
   - 交互式输入提示（如 `auth login` 中的 PAT 输入提示）
   - 确认提示（如 `wi delete` 中的删除确认）
   - 进度提示

3. **错误消息**
   - 所有 ERROR_CODE 对应的人类可读错误描述
   - API 错误的本地化说明

4. **帮助文本**
   - `--help` 输出中的命令描述和选项说明
   - 注意：`--help` 本身不需要国际化（始终英文），但描述文本需要

#### 不需要国际化的内容
- JSON 输出的字段名（始终英文）
- 工作项类型、状态等 API 返回的枚举值（保持原样）
- 用户输入的内容（如工作项标题、评论等）

### 实现架构

#### 1. 新增 `i18n.js` 模块
位置：`src/i18n.js`

**职责：**
- 管理语言配置加载
- 提供翻译函数 `t(key, params)`
- 维护翻译字典

**接口：**
```javascript
// 初始化 i18n
initI18n(config)

// 获取当前语言
getCurrentLanguage()

// 翻译函数
t(key, params = {})

// 示例：
t('table.name')  // 返回 "名称" 或 "Name"
t('error.auth_missing')  // 返回 "认证信息缺失" 或 "Authentication required"
```

#### 2. 翻译字典结构
文件：`src/i18n/translations.js`

**结构：**
```javascript
const translations = {
  en: {
    table: {
      name: 'Name',
      id: 'ID',
      status: 'Status',
      // ...
    },
    error: {
      auth_missing: 'Authentication required',
      auth_failed: 'Authentication failed',
      not_found: 'Not found',
      // ...
    },
    prompt: {
      pat_input: 'Please paste your Personal Access Token:',
      delete_confirm: 'Are you sure? (y/n)',
      // ...
    }
  },
  zh: {
    table: {
      name: '名称',
      id: 'ID',
      status: '状态',
      // ...
    },
    error: {
      auth_missing: '认证信息缺失',
      auth_failed: '认证失败',
      not_found: '未找到',
      // ...
    },
    prompt: {
      pat_input: '请粘贴你的 Personal Access Token：',
      delete_confirm: '确定删除吗？(y/n)',
      // ...
    }
  }
};
```

#### 3. 集成到 `output.js`
- 修改 `printTable()` 使用 `t()` 获取列标题
- 修改 `printError()` 使用 `t()` 获取错误消息
- 修改 `printJson()` 保持字段名英文不变

#### 4. 集成到 `config.js`
- 新增 `getLanguage()` 函数
- 在 `loadConfig()` 中加载 language 字段
- 在 `saveConfig()` 中保存 language 字段

#### 5. 集成到命令层
- 在 `src/index.js` 初始化 i18n
- 在各命令中使用 `t()` 获取提示文字
- 特别关注 `auth.js` 中的交互式提示

---

## 📊 输出范围详细清单

### 表格列标题国际化
- `wi list` 输出的列标题
- `wi types` 输出的列标题
- `status list` 输出的列标题
- `user list` 输出的列标题
- `project list` 输出的列标题
- `sprint list` 输出的列标题
- `pipeline list` 输出的列标题

### 错误消息国际化
- `AUTH_MISSING` - "认证信息缺失"
- `AUTH_FAILED` - "认证失败"
- `NOT_FOUND` - "未找到"
- `INVALID_ARGS` - "参数无效"
- `API_ERROR` - "API 错误"
- 其他通用错误消息

### 交互提示国际化
- `auth login` 中的 PAT 输入提示
- `auth login` 中的 org-id 输入提示
- `wi delete` 中的删除确认提示
- 其他交互式提示

### 成功消息国际化
- 命令执行成功的提示
- 数据创建/更新/删除成功的确认

---

## 🔍 实现检查清单

### 代码结构
- [ ] 创建 `src/i18n.js` 模块
- [ ] 创建 `src/i18n/translations.js` 翻译字典
- [ ] 修改 `src/config.js` 支持 language 字段
- [ ] 修改 `src/output.js` 集成 i18n
- [ ] 修改 `src/index.js` 初始化 i18n
- [ ] 修改各命令文件集成 i18n

### 测试覆盖
- [ ] 测试语言检测优先级
- [ ] 测试中文输出正确性
- [ ] 测试 JSON 模式不受影响
- [ ] 测试错误消息国际化
- [ ] 测试交互提示国际化

### 文档更新
- [ ] 更新 README 中的配置章节，说明 language 字段
- [ ] 更新 SKILL.md 中的命令参考，说明语言支持

---

## 🎯 验收测试场景

### 场景 1：系统 locale 为中文
```bash
# 系统 locale: zh_CN.UTF-8
$ yunxiao wi list --json
# 输出：JSON 格式，字段名英文
# 表格输出（如果有）：中文列标题

$ yunxiao wi list
# 输出：中文表格
```

### 场景 2：Config 文件配置中文
```bash
# ~/.yunxiao/config.json 包含 "language": "zh"
$ yunxiao wi list
# 输出：中文表格
```

### 场景 3：环境变量配置
```bash
$ YUNXIAO_LANGUAGE=zh yunxiao wi list
# 输出：中文表格
```

### 场景 4：非中文环境
```bash
# 系统 locale: en_US.UTF-8，未配置 language
$ yunxiao wi list
# 输出：英文表格
```

### 场景 5：JSON 模式不受影响
```bash
$ yunxiao wi list --json
# 输出：JSON 格式，字段名始终英文，无论语言设置如何
```

---

## 📝 开发者注意事项

### 关键决策
1. **翻译字典维护**：所有翻译集中在 `src/i18n/translations.js`，便于后续维护和扩展
2. **性能考虑**：i18n 模块在启动时加载一次，避免重复加载
3. **向后兼容**：未配置 language 时默认英文，不影响现有用户

### 常见陷阱
- ❌ 不要在 JSON 输出中翻译字段名
- ❌ 不要翻译 API 返回的枚举值（如工作项类型、状态）
- ❌ 不要在 `--help` 中翻译命令名称
- ✅ 只翻译 CLI 生成的人类可读文本

### 测试建议
- 使用 mock 测试语言检测逻辑
- 使用集成测试验证各命令的中文输出
- 验证 JSON 模式下字段名保持英文

---

## 🔗 依赖关系

### 前置 Story
- Story 1-3：输出层模块（`output.js` 已存在）
- Story 1-4：错误定义模块（`errors.js` 已存在）

### 后续影响
- 无直接后续依赖
- 为未来多语言扩展奠定基础

---

## 📚 参考资源

### 相关文件
- `src/output.js` - 输出层模块
- `src/config.js` - 配置管理模块
- `src/errors.js` - 错误定义模块
- `src/index.js` - CLI 入口

### 相关 Story
- Story 1-2：配置管理模块
- Story 1-3：输出层模块
- Story 1-4：错误定义模块

---

## ✨ 完成标志

Story 完成时应满足：
1. ✅ 所有验收标准通过
2. ✅ 中文输出正确显示
3. ✅ JSON 模式不受影响
4. ✅ 语言检测优先级正确
5. ✅ 测试覆盖核心场景
6. ✅ 文档已更新
