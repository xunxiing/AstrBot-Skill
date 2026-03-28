---
category: agent
---

# Provider 选择与使用（插件可用）

Provider 是模型能力入口（Chat/STT/TTS/Embedding）



```python
ctx = self.context
umo = event.unified_msg_origin
```
### 当前会话正在使用的 Provider

- `get_current_chat_provider_id(umo: str) -> str`：直接拿当前会话 chat provider id（最常用）。
- `get_using_provider(umo: str | None = None) -> Provider | None`：拿 chat provider 实例。
- `get_using_stt_provider(umo: str | None = None) -> STTProvider | None`
- `get_using_tts_provider(umo: str | None = None) -> TTSProvider | None`

```python
chat_provider_id = await ctx.get_current_chat_provider_id(umo)
```

### 按 ID 读取 Provider

- `get_provider_by_id(provider_id: str)`：按 ID 获取 provider（可能是 chat/stt/tts/embedding/rerank）。

```python
prov = ctx.get_provider_by_id("your_provider_id")
```

### 列表查询（用于配置页或校验）

- `get_all_providers() -> list[Provider]`
- `get_all_stt_providers() -> list[STTProvider]`
- `get_all_tts_providers() -> list[TTSProvider]`
- `get_all_embedding_providers() -> list[EmbeddingProvider]`

## `_conf_schema.json` 集成

涉及 provider 选择的插件，建议在 `_conf_schema.json` 暴露配置项：
## tips

- 会话内调用必须优先传 `umo`，否则会回退到默认配置，可能拿到错误 provider。
- `get_provider_by_id` 返回的不一定是 chat provider，传给 `tool_loop_agent` 前要确保是 chat provider id。
- 不要把 provider id 硬编码在代码里，优先从 `_conf_schema.json` 配置读取。