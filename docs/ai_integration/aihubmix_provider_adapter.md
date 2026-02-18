---
title: AIHubMix Chat Completion Provider Adapter
type: feature
status: experimental
last_updated: 2026-02-18
related_base: agent/providers.md
---

## 概述
AstrBot Core 新增 **AIHubMix** 的 Chat Completion Provider 适配器类型，用于在 ProviderManager 中以标准 Provider 机制加载与使用 AIHubMix 的 OpenAI 兼容接口。

该变更的对外契约核心是：
- 在默认 provider 模板中新增一个 provider 配置项（`id: "aihubmix"`）。
- Provider 动态加载支持新的 `type: "aihubmix_chat_completion"`。
- 新增 Provider 适配器类 `ProviderAIHubMix`，其实现基于 `ProviderOpenAIOfficial`，并在初始化时注入固定自定义请求头。

## 配置与类型契约（Default Provider Template）
在默认配置模板中新增 `AIHubMix` 节点，其配置结构（字段名与默认值）如下（用于被系统作为可选 provider 模板来源）：

- `id: "aihubmix"`
- `provider: "aihubmix"`
- `type: "aihubmix_chat_completion"`
- `provider_type: "chat_completion"`
- `enable: true`
- `key: []`
- `timeout: 120`
- `api_base: "https://aihubmix.com/v1"`
- `proxy: ""`
- `custom_headers: {}`

对插件开发者/AI 集成侧的意义：
- **provider 的可选项扩展**：当会话或全局配置选择该 provider 后，插件通过 `Context` 获取当前会话 provider 的方式（如 `get_using_provider(umo)`、`get_current_chat_provider_id(umo)`）保持不变，但底层可被解析到新的 provider 类型。
- **provider type 是加载关键**：核心是按 `type` 决定动态导入哪个 provider adapter，因此 `type="aihubmix_chat_completion"` 是系统识别与加载 AIHubMix 的关键契约字符串。

## Provider 动态加载（ProviderManager -> dynamic_import_provider）
ProviderManager 的动态导入逻辑新增分支：

- 当 `type == "aihubmix_chat_completion"` 时，导入并启用：
  - `astrbot/core/provider/sources/oai_aihubmix_source.py` 中的 `ProviderAIHubMix`

这意味着系统架构上的数据流向保持一致：
1) 配置层产出 provider 配置（包含 `type`）
2) ProviderManager 根据 `type` 动态导入适配器类
3) 后续 Chat/Agent 侧通过既有 Provider 入口使用该 provider（不会引入新的插件侧调用 API）

## 适配器实现（ProviderAIHubMix）
新增文件定义了 Provider 适配器：

```python
@register_provider_adapter(
    "aihubmix_chat_completion", "AIHubMix Chat Completion Provider Adapter"
)
class ProviderAIHubMix(ProviderOpenAIOfficial):
    def __init__(self, provider_config: dict, provider_settings: dict) -> None:
        super().__init__(provider_config, provider_settings)
        self.client._custom_headers["APP-Code"] = "KRLC5702"  # type: ignore
```

对外稳定行为（可被插件/系统使用方依赖的部分）：
- **继承关系**：`ProviderAIHubMix` 复用 `ProviderOpenAIOfficial` 的 OpenAI 兼容实现路径，因此其能力边界、请求/响应结构遵循 OpenAI 官方适配器的既有约定。
- **强制追加请求头**：初始化后会向底层 client 的 `_custom_headers` 写入固定键值：
  - `"APP-Code": "KRLC5702"`

架构影响点：
- 这是一个“OpenAI 兼容 provider 的派生适配器”模式：通过继承复用主要协议实现，仅用少量差异化配置（这里是 header）实现对新聚合平台的接入。
- 该差异化发生在 Provider 初始化阶段，因此对上层（Conversation/Agent/Tool Loop）而言，该 provider 与其他 chat_completion provider 一致；差异仅体现在下游 HTTP 请求元数据。

## 变更影响分析
- **对 AI（RAG 消费者/插件作者）**：需要把 `aihubmix_chat_completion` 视为一个可选的 chat provider 类型；在描述“如何选择 provider”时，不应假设只有既有 `openai_*`/`groq_*` 等类型。
- **边界情况：自定义请求头叠加**：该 provider 会在初始化时写入 `APP-Code` 到 client 的 `_custom_headers`。如果同时存在来自配置的 `custom_headers`（模板里提供该字段），需要注意运行时最终 header 集是“继承实现 + 配置注入 + 适配器初始化注入”的叠加结果；本变更可直接确认的是：适配器侧至少会追加 `APP-Code`。
- **可移植性最佳实践**：当插件需要读取/展示 provider 信息时，应以 provider 的 `id/type/provider_type` 为稳定识别字段，而不要依赖某个固定 provider 列表；因为 core 可能持续以“新增 type + dynamic_import_provider 分支 + sources 文件”的方式扩展 provider。
