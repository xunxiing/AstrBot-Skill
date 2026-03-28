---
category: agent
---

# Agent 注册（register_agent）

把子智能体注册成 handoff tool，供主模型在工具调用阶段转交任务。

## 何时使用

- 推荐优先：`docs/agent/subagents.md`（配置式，支持 `provider_id`、运维更稳定）。
- 再用 `register_agent`：需要在插件代码里动态组装 Agent 或动态挂载 run hooks。

## API

```python
register_agent(name: str, instruction: str, tools: list[str | FunctionTool] | None = None, run_hooks: BaseAgentRunHooks | None = None)
```

## 最小示例

```python
from astrbot.core.star.register.star_handler import register_agent

@register_agent(
    name="writer",
    instruction="你是技术写作子智能体，输出精简、可执行内容。",
    tools=["get_weather"],
)
async def writer_agent(event):
    return None
```

## 给该 Agent 追加专属工具

```python
@writer_agent.llm_tool(name="rewrite_text")
async def rewrite_text(event, text: str):
    """重写文本。

    Args:
        text(string): 原文
    """
    return f"rewrite: {text}"
```

## 当前执行路径（按源码）

- `register_agent` 会创建 `Agent` + `HandoffTool`，并加入全局工具列表。
- 运行时 handoff 走 `tool_loop_agent(...)`，核心来自 `instruction/tools/run_hooks`。
- 当前实现中，`@register_agent` 装饰的函数体不会作为 handoff 主执行入口。

## tips

- `register_agent` 属于 core 注册接口，不在 `astrbot.api.event.filter` 导出。
- `tools=["..."]` 里的字符串工具名必须已注册；未注册会被忽略，不会自动报错。
- 想给子智能体单独指定 `provider_id`，优先走配置式 `subagents`。
- `@writer_agent.llm_tool(...)` 的 docstring 必须写 `Args` 类型（例如 `text(string)`），否则 schema 解析会失败。
