
# 上下文控制与压缩


## 1 `context.tool_loop_agent(...)`

用于运行 Agent 工具循环，同时传入上下文压缩参数。

```python
await self.context.tool_loop_agent(event=event, chat_provider_id=prov_id, prompt="...", enforce_max_turns=20, truncate_turns=2, llm_compress_keep_recent=6)
```

可用压缩参数（都可选）：

- `enforce_max_turns: int`：最多保留多少轮对话（`-1` 不限制）。
- `truncate_turns: int`：触发截断时一次丢弃多少轮。
- `llm_compress_instruction: str | None`：LLM 压缩时的摘要指令。
- `llm_compress_keep_recent: int`：LLM 压缩时保留最近多少条消息不摘要。
- `llm_compress_provider: Provider | None`：用于压缩摘要的模型 provider。
- `custom_token_counter: TokenCounter | None`：自定义 token 计数器。
- `custom_compressor: ContextCompressor | None`：自定义压缩器。

## 2`context.get_provider_by_id(provider_id)`

用于拿到压缩模型实例，再传给 `llm_compress_provider`。

```python
compress_prov = self.context.get_provider_by_id("openai/gpt-4o-mini")
```

## 3 `context.get_current_chat_provider_id(umo)`

用于获取当前会话正在使用的对话 provider id，常用于给 `tool_loop_agent` 传 `chat_provider_id`。

```python
chat_provider_id = await self.context.get_current_chat_provider_id(event.unified_msg_origin)
```

## 4 `context.get_config(umo)`
用于读取当前会话配置，按需决定压缩参数。
```python
cfg = self.context.get_config(event.unified_msg_origin)
```
## 示例
```python
umo = event.unified_msg_origin
chat_prov = await self.context.get_current_chat_provider_id(umo)
compress_prov = self.context.get_provider_by_id("your_compress_provider_id")
resp = await self.context.tool_loop_agent(event=event, chat_provider_id=chat_prov, prompt="总结最近讨论并给出下一步", enforce_max_turns=24, truncate_turns=2, llm_compress_instruction="保留任务结论、待办、关键约束", llm_compress_keep_recent=8, llm_compress_provider=compress_prov)
```