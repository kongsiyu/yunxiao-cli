# Story 9-5：版本检测与更新提示

**Story ID**: 9.5  
**Epic**: 9 - 稳定性修复与 v0.2 增强  
**Status**: ready-for-dev  
**Created**: 2026-04-16  
**Author**: Sue  

---

## 用户故事

As a user,
I want the CLI to check for new versions and notify me when an update is available,
So that I always use the latest features and bug fixes.

---

## 验收标准

### AC1：版本检测与 stderr 通知
**Given** 执行任意命令  
**When** 本地版本低于 npm registry 最新版本  
**Then** 在 stderr 输出一行更新提示（如"yunxiao v0.2.0 available, run `npm update -g @kongsiyu/yunxiao-cli` to update"）

### AC2：--json 模式下 stderr 隔离
**Given** 执行 `--json` 模式的命令  
**When** 检测到新版本  
**Then** 更新提示仍只写入 stderr，不影响 stdout JSON 输出

### AC3：网络失败静默处理
**Given** npm registry 不可达（离线 / 超时）  
**When** 版本检查失败  
**Then** 静默忽略，不影响命令正常执行；版本检查超时上限 ≤ 2 秒

### AC4：24 小时缓存机制
**Given** 距离上次版本检查不足 24 小时  
**When** 执行任意命令  
**Then** 跳过版本检查（使用缓存结果或直接跳过），避免频繁网络请求

---

## 技术需求

### 版本检测模块设计

1. **模块位置**: `src/version-check.js`
   - 导出 `checkVersionAsync()` 函数
   - 导出 `getVersionCheckCacheFile()` 辅助函数（用于测试）

2. **核心逻辑**:
   - 读取 `package.json` 获取本地版本
   - 查询 npm registry API: `https://registry.npmjs.org/@kongsiyu/yunxiao-cli`
   - 比较版本号（使用 semver 逻辑或简单字符串比较）
   - 缓存检查结果到 `~/.yunxiao/version-check-cache.json`

3. **缓存格式**:
   ```json
   {
     "lastCheckTime": 1713283200000,
     "latestVersion": "0.2.0",
     "localVersion": "0.1.1"
   }
   ```

4. **超时控制**:
   - 使用 `axios` 的 `timeout: 2000` 选项（2 秒）
   - 网络错误或超时时捕获异常，静默返回（不抛出）

5. **缓存检查**:
   - 读取缓存文件，检查 `lastCheckTime` 是否在 24 小时内
   - 若在缓存期内，直接返回缓存结果（不发起网络请求）
   - 若超过 24 小时或缓存不存在，发起新请求

### 集成到 CLI 入口

1. **位置**: `src/index.js` 的 `program.parse()` 前
2. **调用时机**: 在所有命令执行前，但不阻塞命令执行
3. **异步处理**: 使用 `Promise.resolve()` 或后台任务，确保不延迟命令响应
4. **输出格式**:
   ```
   yunxiao v0.2.0 available, run `npm update -g @kongsiyu/yunxiao-cli` to update
   ```
   - 输出到 `process.stderr`
   - 仅当版本低于最新版本时输出

### 版本比较逻辑

- 使用简单的字符串比较或 semver 库（如 `semver` npm 包，但优先用内置逻辑避免新依赖）
- 示例: `"0.1.1" < "0.2.0"` → true

---

## 实现路径

### 第一步：创建版本检测模块

创建 `src/version-check.js`，包含：
- `checkVersionAsync()`: 主函数，返回 `{ hasUpdate: boolean, latestVersion: string }`
- 内部函数处理缓存读写、网络请求、版本比较

### 第二步：集成到 CLI 入口

修改 `src/index.js`：
- 在 `program.parse()` 前调用版本检查
- 使用 `.then()` 或 `await` 确保异步完成但不阻塞
- 若有更新，输出提示到 stderr

### 第三步：编写单元测试

创建 `test/version-check.test.js`，覆盖：
- 缓存命中场景（24 小时内）
- 缓存过期场景（超过 24 小时）
- 版本比较逻辑（多个版本对）
- 网络超时处理
- 无效 JSON 缓存处理

### 第四步：集成测试

修改 `test/commands.test.js` 或创建集成测试，验证：
- 执行任意命令时版本检查不阻塞
- `--json` 模式下 stderr 输出不污染 stdout

---

## 依赖与库

- **axios**: 已有，用于 npm registry 请求
- **semver** (可选): 若需精确版本比较，可添加；否则用字符串比较
- **Node.js 内置**: `fs`、`path`、`os`、`JSON`

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/version-check.js` | 创建 | 版本检测模块 |
| `src/index.js` | 修改 | 集成版本检查调用 |
| `test/version-check.test.js` | 创建 | 单元测试 |
| `package.json` | 可选修改 | 若添加 semver 依赖 |

---

## 前置条件与依赖

- **前置 Story**: 9-1, 9-2, 9-3, 9-4（均已完成）
- **依赖 Story**: 无
- **外部依赖**: npm registry API 可访问（离线时静默处理）

---

## 已知限制与注意事项

1. **网络离线**: 版本检查失败时静默处理，用户不会收到任何提示
2. **缓存文件权限**: 若 `~/.yunxiao/` 目录不可写，缓存写入失败时静默处理
3. **版本格式**: 假设版本号为 `major.minor.patch` 格式（如 `0.1.1`）
4. **npm registry 延迟**: 新版本发布后可能需要几分钟才能在 registry 中可见

---

## 测试计划

### 单元测试覆盖

1. **缓存逻辑**:
   - 缓存命中（24 小时内）
   - 缓存过期（超过 24 小时）
   - 缓存文件不存在

2. **版本比较**:
   - `0.1.1` vs `0.2.0` → 有更新
   - `0.2.0` vs `0.2.0` → 无更新
   - `0.2.1` vs `0.2.0` → 无更新（本地版本更新）

3. **网络处理**:
   - 成功请求 npm registry
   - 超时（2 秒）
   - 连接错误
   - 无效 JSON 响应

4. **输出验证**:
   - 更新提示格式正确
   - 输出到 stderr（非 stdout）
   - `--json` 模式下 stdout 不受影响

### 集成测试

- 执行 `yunxiao --help` 验证版本检查不阻塞
- 执行 `yunxiao wi list --json` 验证 stderr 隔离

---

## 参考资源

- **GitHub Issue**: #65
- **npm registry API**: `https://registry.npmjs.org/@kongsiyu/yunxiao-cli`
- **相关 Story**: 9-1, 9-2, 9-3, 9-4
- **项目版本**: 当前 `0.1.1`（见 `package.json`）

---

## 开发者注意事项

1. **不要阻塞命令执行**: 版本检查必须异步且不延迟命令响应
2. **静默失败**: 网络错误或缓存写入失败时不应抛出异常
3. **缓存目录**: 使用 `os.homedir()` 获取用户主目录，确保跨平台兼容
4. **测试隔离**: 单元测试中 mock 缓存文件路径，避免污染用户实际缓存

---

## 完成标准

- [ ] `src/version-check.js` 实现完成，所有 AC 通过
- [ ] `src/index.js` 集成版本检查，命令执行不阻塞
- [ ] `test/version-check.test.js` 编写完成，覆盖率 ≥ 90%
- [ ] 集成测试通过（`npm test`）
- [ ] 代码审查通过
- [ ] sprint-status.yaml 更新为 `done`
