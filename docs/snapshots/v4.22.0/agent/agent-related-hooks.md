---
category: agent
---
# Agent Related Hooks

 Agent 请求/工具循环直接相关的 hooks。

## Plugin Hooks

### LLM 请求阶段

- `@filter.on_waiting_llm_request()`
- `@filter.on_llm_request()`
- `@filter.on_llm_response()`

```python
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.api.provider import ProviderRequest, LLMResponse

@filter.on_waiting_llm_request()
async def on_waiting(self, event: AstrMessageEvent) -> None: ...

@filter.on_llm_request()
async def on_req(self, event: AstrMessageEvent, request: ProviderRequest) -> None: ...

@filter.on_llm_response()
async def on_resp(self, event: AstrMessageEvent, response: LLMResponse) -> None: ...
```

### Tool 调用阶段

- `@filter.on_using_llm_tool()`
- `@filter.on_llm_tool_respond()`

```python
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.core.agent.tool import FunctionTool
from mcp.types import CallToolResult

@filter.on_using_llm_tool()
async def on_tool_start(self, event: AstrMessageEvent, tool: FunctionTool, tool_args: dict | None) -> None: ...

@filter.on_llm_tool_respond()
async def on_tool_end(self, event: AstrMessageEvent, tool: FunctionTool, tool_args: dict | None, tool_result: CallToolResult | None) -> None: ...
```

### 结果发送阶段

- `@filter.on_decorating_result()`
- `@filter.after_message_sent()`

```python
from astrbot.api.event import filter, AstrMessageEvent

@filter.on_decorating_result()
async def on_decorating(self, event: AstrMessageEvent) -> None: ...

@filter.after_message_sent()
async def after_sent(self, event: AstrMessageEvent) -> None: ...
```

## Agent Runner Hooks

用于 `context.tool_loop_agent(..., agent_hooks=...)` 的运行期扩展。

```python
from astrbot.core.agent.hooks import BaseAgentRunHooks
from astrbot.core.agent.run_context import ContextWrapper
from astrbot.core.agent.tool import FunctionTool
from astrbot.core.provider.entities import LLMResponse
import mcp

class MyAgentHooks(BaseAgentRunHooks):
    async def on_agent_begin(self, run_context: ContextWrapper) -> None: ...
    async def on_tool_start(self, run_context: ContextWrapper, tool: FunctionTool, tool_args: dict | None) -> None: ...
    async def on_tool_end(self, run_context: ContextWrapper, tool: FunctionTool, tool_args: dict | None, tool_result: mcp.types.CallToolResult | None) -> None: ...
    async def on_agent_done(self, run_context: ContextWrapper, llm_response: LLMResponse) -> None: ...
```

## 主 Agent 默认映射关系

- `on_tool_start` -> `@filter.on_using_llm_tool()`
- `on_tool_end` -> `@filter.on_llm_tool_respond()`
- `on_agent_done` -> `@filter.on_llm_response()`

## MUST

- Hook 处理函数必须使用 `async def`。
