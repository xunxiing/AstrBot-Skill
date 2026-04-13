---
category: agent
---

# Provider 选择与使用（插件可用）

Provider 是模型能力入口（Chat/STT/TTS/Embedding）

```python
ctx = self.context
umo = event.unified_msg_origin
```

## v4.5.7+ 新增方法

### 获取当前会话使用的 Chat Provider ID

```python
prov_id = await ctx.get_current_chat_provider_id(umo)
```

- `await get_current_chat_provider_id(umo: str) -> str`: 最常用，直接返回当前会话的 chat provider ID

### 简化 LLM 调用

```python
llm_resp = await ctx.llm_generate(
    chat_provider_id=prov_id,
    prompt="Hello!",
    system_prompt="You are a helpful assistant.",
)
print(llm_resp.completion_text)
```

- `await llm_generate(chat_provider_id, prompt, contexts=None, system_prompt=None, tools=None) -> LLMResponse`: 简化的 LLM 调用接口

### 工具循环 Agent

```python
llm_resp = await ctx.tool_loop_agent(
    event=event,
    chat_provider_id=prov_id,
    prompt="搜索 AstrBot 相关信息",
    tools=ToolSet([SearchTool()]),
    max_steps=30,
    tool_call_timeout=60,
)
```

- `await tool_loop_agent(event, chat_provider_id, prompt, tools, system_prompt=None, max_steps=30, tool_call_timeout=60) -> LLMResponse`: 自动处理工具调用循环

## 传统方法

### 当前会话正在使用的 Provider

- `get_using_provider(umo: str | None = None) -> Provider | None`: 拿 chat provider 实例
- `get_using_stt_provider(umo: str | None = None) -> STTProvider | None`
- `get_using_tts_provider(umo: str | None = None) -> TTSProvider | None`

### 按 ID 读取 Provider

- `get_provider_by_id(provider_id: str)`: 按 ID 获取 provider（可能是 chat/stt/tts/embedding/rerank）

```python
prov = ctx.get_provider_by_id("your_provider_id")
```

### 列表查询（用于配置页或校验）

- `get_all_providers() -> list[Provider]`
- `get_all_stt_providers() -> list[STTProvider]`
- `get_all_tts_providers() -> list[TTSProvider]`
- `get_all_embedding_providers() -> list[EmbeddingProvider]`

## v4.7.0+ Agent Runner 相关

```python
# 获取当前会话使用的 Agent Runner
runner = ctx.get_using_agent_runner(umo=event.unified_msg_origin)

# 或者通过 ID 获取
runner = ctx.get_agent_runner_by_id(runner_id="your_runner_id")
```

## `_conf_schema.json` 集成

涉及 provider 选择的插件，建议在 `_conf_schema.json` 暴露配置项：

```json
{
  "provider_id": {
    "description": "选择模型提供商",
    "type": "string",
    "_special": "select_provider"
  }
}
```

## Tips

- 会话内调用必须优先传 `umo`，否则会回退到默认配置，可能拿到错误 provider
- `get_provider_by_id` 返回的不一定是 chat provider，传给 `tool_loop_agent` 前要确保是 chat provider id
- 不要把 provider id 硬编码在代码里，优先从 `_conf_schema.json` 配置读取
