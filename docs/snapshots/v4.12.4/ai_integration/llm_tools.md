---
category: ai_integration
---

# 函数调用与工具 (Function Calling / Tools)

AstrBot 支持大模型调用插件定义的方法，即 Function Calling 能力。

### 定义方式 A：使用装饰器 (推荐用于简单逻辑)

```python
@filter.llm_tool(name="get_weather")
async def get_weather(self, event: AstrMessageEvent, location: str):
    """获取天气信息。
    Args:
        location(string): 地点描述
    """
    yield event.plain_result(f"{location} 的天气是...")
```

- **解析**: AstrBot 会解析函数的 **Docstring** 来生成 Tool 的 Schema。
- **限制**: 必须包含 `event: AstrMessageEvent` 参数。

### 定义方式 B：使用 `@dataclass` (推荐用于复杂工具)

```python
from dataclasses import dataclass, field
from astrbot.api.all import FunctionTool, AstrAgentContext, ToolExecResult, ContextWrapper

@dataclass
class MyTool(FunctionTool[AstrAgentContext]):
    name: str = "tool_name"
    description: str = "工具描述"
    parameters: dict = field(default_factory=lambda: {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "搜索关键词"}
        },
        "required": ["query"]
    })

    async def call(self, context: ContextWrapper[AstrAgentContext], **kwargs) -> ToolExecResult:
        # 实现逻辑
        return "结果字符串"
```

### 注册与调用

- **注册工具**: 在插件 `__init__` 中使用 `self.context.add_llm_tools(MyTool())`。
