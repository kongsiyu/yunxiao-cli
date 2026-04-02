# Deferred Work

## Deferred from: code review of 3-1-wi-types (2026-04-02)

- `t.id` 缺失时 typeId 为 undefined [src/commands/workitem.js] — pre-existing API 合约问题，无 id 字段的类型对象在 JSON 输出中 typeId 会为 undefined
- `t.name` null/undefined 无防护 [src/commands/workitem.js] — pre-existing，name 字段为空时表格/JSON 均无 fallback
- `total` 为本地计数非服务端总数 [src/commands/workitem.js] — 符合项目设计（与其他命令一致），如需分页支持则需另行实现
