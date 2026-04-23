---
category: plugin_config
---

# 事件钩子 (Hooks)

事件钩子用于在 AstrBot 核心执行流程的关键节点介入（例如：LLM 请求前后、工具调用前后、发送消息前后）。

> 事件钩子是“插件事件系统”的一部分，和 Agent 运行钩子（`BaseAgentRunHooks`）不是同一套机制。  
> Agent 运行钩子见：`docs/agent/agent-related-hooks.md`

## 使用方式

```python
from astrbot.api.event import filter, AstrMessageEvent

@filter.on_astrbot_loaded()
async def on_loaded(self):
    ...
```

### 重要限制与最佳实践

- 事件钩子通常不支持与指令/过滤器混用（例如：`@filter.command`、`@filter.command_group`、`@filter.event_message_type`、`@filter.platform_adapter_type`、`@filter.permission_type`）。
- 大多数事件钩子不建议用 `yield` 发送消息：如果要发消息，请直接调用 `await event.send(...)`。
- 事件钩子应当短小、幂等、可失败（失败只影响当前 hook，不应导致整个机器人崩溃）。

## 核心钩子清单

下面列出对外暴露的常用事件钩子（按执行流程排序）。签名写法以核心实现为准（参考源码：`astrbotcore/astrbot/core/star/register/star_handler.py`）。

### 1) 生命周期

- `@filter.on_astrbot_loaded()`
  - 触发：AstrBot 加载完成
  - 建议签名：`async def on_astrbot_loaded(self) -> None`

- `@filter.on_platform_loaded()`
  - 触发：平台加载完成
  - 建议签名：`async def on_platform_loaded(self) -> None`

### 2) LLM 请求前后

- `@filter.on_waiting_llm_request()`
  - 触发：确定要调用 LLM，但尚未获取会话锁之前（适合提示“思考中/排队中”）
  - 建议签名：`async def on_waiting_llm(self, event: AstrMessageEvent) -> None`

- `@filter.on_llm_request()`
  - 触发：LLM 请求发送前（可修改请求内容）
  - 建议签名：`async def on_llm_request(self, event: AstrMessageEvent, request: ProviderRequest) -> None`
  - 常见用途：
    - 注入/调整 `system_prompt`
    - 根据平台/会话动态切换模型或工具策略（请保持可解释、可回滚）

- `@filter.on_llm_response()`
  - 触发：LLM 请求完成后（可读取/修饰返回结果）
  - 建议签名：`async def on_llm_response(self, event: AstrMessageEvent, response: LLMResponse) -> None`

### 3) 工具调用前后（Function Calling / Tools Use）

- `@filter.on_using_llm_tool()`
  - 触发：函数工具调用前
  - 建议签名：`async def on_using_tool(self, event: AstrMessageEvent, tool: FunctionTool, tool_args: dict | None) -> None`
  - 常见用途：
    - 记录审计日志 / 埋点
    - 根据会话状态拒绝某些工具（需配合工具层做硬限制）

- `@filter.on_llm_tool_respond()`
  - 触发：函数工具调用后
  - 建议签名：`async def on_tool_respond(self, event: AstrMessageEvent, tool: FunctionTool, tool_args: dict | None, tool_result: CallToolResult | None) -> None`
  - 常见用途：
    - 对工具结果做脱敏/裁剪
    - 追加提示，让 LLM 更好地总结工具输出

### 4) 发送消息前后

- `@filter.on_decorating_result()`
  - 触发：发送消息前（用于“装饰”即将发送的消息链）
  - 建议签名：`async def on_decorating_result(self, event: AstrMessageEvent) -> None`
  - 常见用途：
    - 文转图、追加后缀、统一格式化输出
  - 注意：这里的职责是“改 `event.get_result().chain`”，不是发消息；如需主动发送请使用 `event.send()`。

- `@filter.after_message_sent()`
  - 触发：消息成功发送到平台后
  - 建议签名：`async def after_message_sent(self, event: AstrMessageEvent) -> None`

## 相关文档与源码

- Agent 运行钩子：`docs/agent/agent-related-hooks.md`
- `filter` 对外导出位置：`astrbotcore/astrbot/api/event/filter/__init__.py`
- Hook 注册实现：`astrbotcore/astrbot/core/star/register/star_handler.py`
- 事件类型枚举：`astrbotcore/astrbot/core/star/star_handler.py`
