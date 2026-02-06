---
title: 网页搜索工具与动态过滤 (Web Search Tools)
type: feature
status: stable
last_updated: 2024-05-22
related_base: ai_integration/llm_tools.md
---

## 概述
AstrBot 通过内置的 `web_searcher` 插件提供联网搜索能力。该系统支持多个搜索提供商（如 Tavily, BoCha, Baidu），并利用事件钩子根据用户配置动态调整 LLM 可用的工具集。

## BoCha 搜索工具 (`web_search_bocha`)

BoCha 是新增的联网搜索工具，具有高度可定制的搜索参数。

### 工具契约
- **名称**: `web_search_bocha`
- **核心参数**:
    - `query` (string): 搜索关键词。
    - `freshness` (string): 时间范围。可选值：`noLimit` (默认), `oneDay`, `oneWeek`, `oneMonth`, `oneYear` 或特定日期范围。
    - `summary` (boolean): 是否返回结果摘要。
    - `count` (number): 返回结果数量 (1-50)。
    - `include`/`exclude` (string): 包含或排除的域名，支持 `|` 分隔。

## 动态工具管理机制

系统通过 `@filter.on_llm_request` 钩子实现工具的动态注入与拦截。这确保了 LLM 仅能看到当前配置激活的搜索工具，避免了工具冗余导致的上下文浪费或误调用。

### 逻辑流转
1. **配置读取**: 插件通过 `self.context.get_config()` 获取 `websearch_provider`。
2. **拦截请求**: 在 LLM 请求发送前，`edit_web_search_tools` 方法介入。
3. **工具清洗**: 
    - 若 `web_search` 关闭，移除所有搜索相关工具。
    - 若指定了特定 Provider（如 `bocha`），则保留 `web_search_bocha` 并移除 `web_search_tavily` 等其他竞品工具。

## 配置项定义
- `websearch_bocha_key` (list[str]): 支持多 Key 轮询机制，增强 API 稳定性。
- `websearch_provider`: 可选值包括 `default`, `tavily`, `baidu_ai_search`, `bocha`。

## 变更影响分析
- **AI 提示词优化**: AI 在调用搜索工具时，现在可以利用 `freshness` 参数进行时效性搜索，这在处理新闻或实时事件时具有显著优势。
- **多 Provider 隔离**: 开发者应注意，虽然系统中存在多个搜索函数，但在运行时它们是互斥的。AI 助手在编写调用逻辑时，应假设只有一个活跃的搜索工具。
- **引用追踪**: 系统会自动提取 `web_search_bocha` 的返回结果并尝试匹配 Favicon，增强了 WebUI 侧的来源展示能力。