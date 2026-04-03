# Story 9.2：project list 输出排版修复

Status: done

## Story

As a user,
I want the project list command to display a properly aligned table,
so that I can easily read project information in the terminal even when project names contain Chinese characters.

## Acceptance Criteria

1. **Given** 执行 `project list`（非 --json 模式），**When** 项目名称包含中文或长字符串，**Then** 输出表格列宽正确对齐，不出现混乱换行或列错位。
2. **Given** 执行 `project list --json`，**When** 命令运行，**Then** JSON 输出不受影响（已正常工作，不得引入回归）。

## Root Cause

`src/commands/project.js` line 39：

```js
console.log(`${chalk.cyan(p.customCode.padEnd(12))} ${chalk.white(p.name.padEnd(30))} ${chalk.gray(p.id)}`);
```

`String.prototype.padEnd` 按 JS 字符数（UTF-16 code units）计算，而中文字符（CJK）在终端中占 **2 列宽**，导致补的空格不足，列错位。

## Tasks / Subtasks

- [x] 在 `src/output.js` 中添加 `visualWidth(str)` 和 `padEndVisual(str, width)` 工具函数 (AC: 1)
  - [x] `visualWidth`：遍历字符，CJK宽字符计 2，其余计 1
  - [x] `padEndVisual`：基于 `visualWidth` 计算补全空格数
- [x] 修改 `src/commands/project.js` 使用 `padEndVisual` (AC: 1)
  - [x] 在 import 行添加 `padEndVisual`
  - [x] 将 `p.name.padEnd(30)` 替换为 `padEndVisual(p.name, 30)`
- [x] 在 `test/project.test.js` 中添加 `padEndVisual` 单元测试 (AC: 1, 2)
  - [x] 纯 ASCII：`padEndVisual('abc', 10)` 宽度应为 10
  - [x] 中文名：`padEndVisual('云效项目', 30)` 视觉宽度（原字符 + 填充）应 ≥ 30
  - [x] 长字符串：超出宽度时不截断，原样返回

## Dev Notes

### 文件修改范围（精确）

| 文件 | 操作 |
|------|------|
| `src/output.js` | 追加 `visualWidth` 和 `padEndVisual` 函数并 export |
| `src/commands/project.js` | 修改 import 行 + line 39 的 `.padEnd(30)` |
| `test/project.test.js` | 新建，测试 `padEndVisual` 函数 |

**不需要改动**：`src/api.js`、`src/errors.js`、`src/index.js`、其他 commands、sprint-status.yaml（步骤 9 更新）。

### 关键实现：`src/output.js` 追加内容

```js
/**
 * Calculate visual (terminal column) width of a string.
 * CJK wide characters count as 2 columns; all others count as 1.
 */
export function visualWidth(str) {
  let width = 0;
  for (const char of str) {
    const cp = char.codePointAt(0);
    // CJK Unified Ideographs, CJK Extension A/B, Hangul, Hiragana, Katakana,
    // Fullwidth Forms, CJK Compatibility, etc.
    if (
      (cp >= 0x1100 && cp <= 0x115F) ||   // Hangul Jamo
      (cp >= 0x2E80 && cp <= 0x303F) ||   // CJK Radicals / Kangxi
      (cp >= 0x3040 && cp <= 0x33FF) ||   // Hiragana, Katakana, Bopomofo
      (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK Extension A
      (cp >= 0x4E00 && cp <= 0x9FFF) ||   // CJK Unified Ideographs (main block)
      (cp >= 0xA000 && cp <= 0xA4CF) ||   // Yi
      (cp >= 0xAC00 && cp <= 0xD7AF) ||   // Hangul Syllables
      (cp >= 0xF900 && cp <= 0xFAFF) ||   // CJK Compatibility Ideographs
      (cp >= 0xFE10 && cp <= 0xFE19) ||   // Vertical Forms
      (cp >= 0xFE30 && cp <= 0xFE6F) ||   // CJK Compatibility Forms
      (cp >= 0xFF00 && cp <= 0xFF60) ||   // Fullwidth Latin, Katakana
      (cp >= 0xFFE0 && cp <= 0xFFE6) ||   // Fullwidth Signs
      (cp >= 0x1F300 && cp <= 0x1F9FF) || // Misc Symbols and Pictographs (emoji)
      (cp >= 0x20000 && cp <= 0x2A6DF) || // CJK Extension B
      (cp >= 0x2A700 && cp <= 0x2CEAF)    // CJK Extension C/D
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Pad string to visual width (terminal columns), like String.padEnd but CJK-aware.
 * If visualWidth(str) >= targetWidth, returns str unchanged (no truncation).
 */
export function padEndVisual(str, targetWidth) {
  const current = visualWidth(str);
  if (current >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - current);
}
```

### 关键修改：`src/commands/project.js`

**import 行（当前）**：
```js
import { printJson } from "../output.js";
```

**修改后**：
```js
import { printJson, padEndVisual } from "../output.js";
```

**line 39（当前）**：
```js
console.log(`${chalk.cyan(p.customCode.padEnd(12))} ${chalk.white(p.name.padEnd(30))} ${chalk.gray(p.id)}`);
```

**修改后**：
```js
console.log(`${chalk.cyan(p.customCode.padEnd(12))} ${chalk.white(padEndVisual(p.name, 30))} ${chalk.gray(p.id)}`);
```

> `customCode` 是项目代码（如 `GJBL`），通常全 ASCII，`padEnd(12)` 无需修改。

### 测试文件：`test/project.test.js`

测试策略：直接单元测试 `output.js` 导出的 `padEndVisual` / `visualWidth` 函数（无需 mock client），不依赖 Commander。

```js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { visualWidth, padEndVisual } from '../src/output.js';
```

测试用例：
- `visualWidth('')` → 0
- `visualWidth('abc')` → 3
- `visualWidth('云效')` → 4（2 chars × 2 cols）
- `padEndVisual('abc', 10)` → `'abc       '`（长度 10）
- `padEndVisual('云效项目', 30)` → 视觉宽度 30（原 8 cols + 22 spaces）
- `padEndVisual('toolongstring_over_width', 5)` → 原字符串不截断

### 项目技术约定

- **ESM**：`"type": "module"`，所有文件用 `import/export`，无 `require()`
- **无新依赖**：禁止添加 npm 包（不用 `string-width` 等），内联实现
- **测试**：`node:test` + `node:assert/strict`，运行 `npm test`
- **代码风格**：2-space indent，单引号字符串，arrow functions，参考现有文件

### 回归注意

- `--json` 分支（line 28-31）不受影响，无需修改
- `project view` 命令无 padEnd 操作，不受影响
- 现有测试全部必须继续通过：`npm test`

### Review Findings

- [x] [Review][Defer] Zero-width/combining chars counted as width 1 [src/output.js] — deferred, pre-existing design limitation; project names in a DevOps tool don't contain combining diacritics
- [x] [Review][Defer] Emoji characters not handled (each code point counted as 1) [src/output.js] — deferred, story scope is CJK text; emoji in project names extremely unlikely
- [x] [Review][Defer] Newer CJK Extension blocks missing (F/G, U+2B740+) [src/output.js] — deferred, main block U+4E00–U+9FFF covers 99.9% of Chinese characters in practice
- [x] [Review][Defer] `p.name` null/undefined throws in `visualWidth` [src/output.js] — deferred, pre-existing: `p.name.padEnd(30)` had identical failure mode
- [x] [Review][Defer] `p.customCode.padEnd(12)` not updated — inconsistent column treatment [src/commands/project.js] — deferred, explicitly out of scope per spec; customCode is ASCII-only project code
- [x] [Review][Defer] No type guard in `padEndVisual` for non-string input [src/output.js] — deferred, pre-existing issue; same root as null name
- [x] [Review][Defer] Lone surrogate from malformed API response counted as width 1 [src/output.js] — deferred, API returns well-formed UTF-8; original code had same behavior
- [x] [Review][Defer] Long names overflow with no truncation (no change in behavior) [src/output.js] — deferred, pre-existing behavior; explicitly documented in JSDoc

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 在 `src/output.js` 新增 `visualWidth` 和 `padEndVisual` 两个 CJK-aware 工具函数（无新依赖，内联 Unicode 范围检查）
- `src/commands/project.js` import 更新，`p.name.padEnd(30)` 替换为 `padEndVisual(p.name, 30)`，修复中文项目名终端列错位问题
- 新建 `test/project.test.js`，包含 12 个单元测试（`visualWidth` × 6 + `padEndVisual` × 6），全部通过
- 全套测试：181 通过，0 失败，0 回归

### File List

- `src/output.js` — 新增 `visualWidth` 和 `padEndVisual` 函数
- `src/commands/project.js` — 更新 import，修复 `padEnd(30)` → `padEndVisual(..., 30)`
- `test/project.test.js` — 新建，12 个单元测试
