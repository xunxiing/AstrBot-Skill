---
category: agent
---

# Tools（函数调用）

Tool 是让大语言模型调用外部能力（检索、计算、执行命令、文件处理）的机制。

## 两种定义方式

- 类方式：继承 FunctionTool
- 装饰器方式：@filter.llm_tool(...)

## 方式一：类定义 Tool（推荐，v4.5.7+）

`python
from pydantic import Field
from pydantic.dataclasses import dataclass

from astrbot.core.agent.run_context import ContextWrapper
from astrbot.core.agent.tool import FunctionTool, ToolExecResult
from astrbot.core.astr_agent_context import AstrAgentContext


@dataclass
class BilibiliTool(FunctionTool[AstrAgentContext]):
    name: str = "bilibili_videos"
    description: str = "搜索 Bilibili 视频"
    parameters: dict = Field(
        default_factory=lambda: {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "搜索关键词",
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
        return ToolExecResult(result="搜索结果...")
`

**ToolExecResult 返回值格式（v4.22.2）：**

`python
from astrbot.core.agent.tool import ToolExecResult

return ToolExecResult(result="文本结果")
return ToolExecResult(is_error=True, result="错误信息")
return ToolExecResult(result="", image_url="https://...")  # 图片结果
`

## 注册到全局工具池

`python
class MyPlugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self.context.add_llm_tools(BilibiliTool())
`

注册后主对话模型自动感知并调用该 Tool。

## 方式二：装饰器（兼容旧版）

`python
from astrbot.api.event import filter, AstrMessageEvent

@filter.llm_tool(name="get_weather")
async def get_weather(self, event: AstrMessageEvent, location: str):
    """获取天气信息。

    Args:
        location(string): 地点
    """
    resp = self.get_weather_from_api(location)
    yield event.plain_result("天气信息: " + resp)
`

Docstring 中 Args 格式必须是 参数名(类型): 描述。

支持的类型：string、
umber、object、oolean、rray、rray[string]（v4.5.7+）。

## 内部 Tool（不注册全局）

仅在单次 	ool_loop_agent 调用中可见，不进入全局工具池：

`python
from astrbot.core.agent.tool import ToolSet

llm_resp = await self.context.tool_loop_agent(
    event=event,
    chat_provider_id=await self.context.get_current_chat_provider_id(event.unified_msg_origin),
    prompt="请调用 bilibili_videos 工具搜索 AstrBot 教程",
    tools=ToolSet([BilibiliTool()]),
)
`

## Tips

- parameters 必须是合法 JSON Schema
- 装饰器方式必须写规范 docstring（尤其 Args），否则 schema 解析失败
- 推荐新项目使用类定义方式，参数类型检查更严格