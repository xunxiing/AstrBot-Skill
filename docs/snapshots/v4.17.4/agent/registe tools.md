# Tools（函数调用）
Tool 是让大语言模型调用外部能力（检索、计算、执行命令、文件处理）的机制。
## 两种定义方式
- 类方式：继承 `FunctionTool`
- 装饰器方式：`@filter.llm_tool(...)`
## 方式一：类定义 Tool

```python
from pydantic import Field
from pydantic.dataclasses import dataclass

from astrbot.core.agent.run_context import ContextWrapper
from astrbot.core.agent.tool import FunctionTool, ToolExecResult
from astrbot.core.astr_agent_context import AstrAgentContext


@dataclass
class BilibiliTool(FunctionTool[AstrAgentContext]):
    name: str = "bilibili_videos"
    description: str = "A tool to fetch Bilibili videos."
    parameters: dict = Field(
        default_factory=lambda: {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "Keywords to search for Bilibili videos.",
                }
            },
            "required": ["keywords"],
        }
    )

    async def call(
        self,
        context: ContextWrapper[AstrAgentContext],
        **kwargs,
    ) -> ToolExecResult:
        return "1. 视频标题：如何使用 AstrBot\n视频链接：xxxxxx"
```

## 注册到 AstrBot（全局可调用）

如果希望主对话中的模型自动感知并调用该 Tool，需要注册到全局工具池。

```python
class MyPlugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self.context.add_llm_tools(BilibiliTool())
```

兼容旧版本（不推荐新项目继续使用）：

```python
tool_mgr = self.context.provider_manager.llm_tools
tool_mgr.func_list.append(BilibiliTool())
```

## 方式二：装饰器定义并注册

```python
from astrbot.api.event import filter, AstrMessageEvent

@filter.llm_tool(name="get_weather")
async def get_weather(self, event: AstrMessageEvent, location: str):
    """获取天气信息。

    Args:
        location(string): 地点
    """
    resp = self.get_weather_from_api(location)
    yield event.plain_result("天气信息: " + resp)
```

`Args` 中格式必须是 `参数名(类型): 描述`。

支持类型：

- `string`
- `number`
- `object`
- `boolean`
- `array`
- `array[string]`（4.5.7+）

## 不注册也可内部使用

如果 Tool 只用于插件内部流程（例如你自己调用 `tool_loop_agent`），可以不注册全局，直接传 `ToolSet`。

```python
from astrbot.core.agent.tool import ToolSet

llm_resp = await self.context.tool_loop_agent(
    event=event,
    chat_provider_id=await self.context.get_current_chat_provider_id(event.unified_msg_origin),
    prompt="请调用 bilibili_videos 工具搜索 AstrBot 教程",
    tools=ToolSet([BilibiliTool()]),
)
```

这种方式下 Tool 只在这次调用中可见，不会进入全局 `llm_tools`。

## tips
- `parameters` 必须是合法 JSON Schema。
- 装饰器方式必须写规范 docstring（尤其 `Args`），否则 schema 解析失败。