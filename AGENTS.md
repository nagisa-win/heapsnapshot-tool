# Heapdump Processor

分析 Node.js V8 堆内存快照的工具。从 HTTP URL 下载 `heapsnapshots-YYYY-MM-DD.tar.gz`，解压后解析 JSON 格式的快照文件，构建 Graph 图结构，支持按 `TARGET` 条件追踪 Module 节点的内存占用。

核心模块：
- `src/app.js` - 主入口，协调下载/解压/解析/追踪流程
- `src/graph-parse.js` - `Graph` 类，解析快照的 nodes/edges/strings，构建图结构并提供 `findNode`/`traceNodes` 查询
- `src/req.js` - HTTP 下载
- `src/util.js` - 日志、时间、文件读写工具
- `src/constants.js` - 从 `.env` 读取配置

快照 JSON 格式：顶层包含 `nodes[]`、`edges[]`、`strings[]`、`snapshot`（含 meta）。nodes 每 6 或 7 个字段为一组（取决于 `trace_function_count` 是否 > 0）：`[type, name, id, self_size, edge_count, trace_node_id?, detachedness]`。edges 每 3 个字段为一组：`[type, name_or_index, to_node]`。

V8 Node Type: hidden=0, array=1, string=2, object=3, code=4, closure=5, regexp=6, number=7, native=8, synthetic=9, concatenated string=10, sliced string=11, symbol=12, bigint=13

V8 Edge Type: context=0, element=1, property=2, internal=3, hidden=4, shortcut=5, weak=6

## Run

```sh
pnpm start
```

Requires `.env` with `SNAPSHOT_URL`, `PATH`, `TARGET`, `LOG`. See `.env.example`.

## Project

- ES modules (`"type": "module"` in package.json)
- Entry: `src/app.js`
- `postinstall` script creates `download/` directory
- No test/lint/typecheck commands defined
- Uses prettier (`.prettierrc`) but no npm script to run it; rely on editor/IDE integration
- Husky pre-commit hook present but `lint-staged` not in package.json scripts

## Bug Fixes

已修复的 bug（在 `src/graph-parse.js` 中）：
- `hasEdge()`: 调用未定义的 `reject()` → 改为 `throw new Error()`
- `hasEdge()`: RegExp test 未检查 undefined → 增加 `!== undefined` 判断
- `hasEdge()`: 循环内找到匹配后继续遍历 → 改为立即 `return true`
- `findNode()`: RegExp test 未检查 undefined → 增加 `!== undefined` 判断
- `searchGraph()`: 错误标记 visited（`node.id` 而非 `nextNode.id`）→ 已删除此未使用方法
- `nodes`/`edges` 属性遮蔽：实例属性与 getter 同名 → 重命名为 `_nodes`/`_edges`，保留只读 getters

## 编码要求

- 4 空格缩进，LF 结尾，trim trailing whitespace（见 `.editorconfig`）
- ES modules 写法：`import`/`export`，文件后缀 `.js` 需写明
- JSDoc 注释风格（参考现有代码）
- prettier 用于格式化，但无 npm script，需靠编辑器集成
