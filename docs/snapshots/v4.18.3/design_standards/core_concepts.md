# AstrBot 核心概念 API 清单

本文档仅列出 AstrBot 插件开发的核心功能 API。

### 1. 装饰器 (Decorators)

- `@register(id, author, description, version, repo_url)`: 注册插件。
- `@filter.command(name, alias, priority)`: 注册指令。支持带参函数。
- `@filter.command_group(name)`: 注册指令组。
- `@filter.event_message_type(type)`: 过滤消息类型 (`ALL`, `PRIVATE_MESSAGE`, `GROUP_MESSAGE`)。
- `@filter.platform_adapter_type(type)`: 过滤平台类型 (如 `AIOCQHTTP`, `TELEGRAM`)。
- `@filter.permission_type(type)`: 校验权限 (如 `ADMIN`)。
- `@filter.regex(pattern)`: 正则匹配。
- `@filter.llm_tool(name)`: 注册为 AI 可调用的工具。
- `@session_waiter(timeout, record_history_chains)`: 等待下一条用户消息。

### 2. 消息组件 (Message Components)

- `Plain(text)`: 纯文本。
- `At(user_id)`: 提及用户。
- `Image.fromFileSystem(path)` / `Image.fromURL(url)`: 图片。
- `Record.fromFileSystem(path)`: 语音。
- `Video.fromFileSystem(path)` / `Video.fromURL(url)`: 视频。
- `File.fromFileSystem(path, name)`: 文件。
- `Face(id)`: 系统表情。
- `Reply(message_id)`: 回复特定消息。
- `Node(uin, name, content)` / `Nodes(nodes)`: 合并转发节点 (部分平台支持)。

### 3. 核心对象与方法

**AstrMessageEvent (事件对象)**

- 消息事件对象，包含消息内容、发送者信息、群组信息等。
- 提供消息发送和结果构建方法。

**Context (核心枢纽)**

- `context.send_message(umo, chain)`: 向指定源主动发送消息。
- `context.get_platform(type)`: 获取指定类型的平台实例。
- `context.get_using_provider(umo)`: 获取当前 LLM 提供商。
- `context.add_llm_tools(*tools)`: 动态注册 AI 工具。

**v4.5.7+ 新增 LLM API**

```python
umo = event.unified_msg_origin
prov_id = await self.context.get_current_chat_provider_id(umo)
```

- `await context.get_current_chat_provider_id(umo) -> str`: 获取当前会话使用的 chat provider ID。
- `await context.llm_generate(chat_provider_id, prompt, contexts=None, system_prompt=None, tools=None) -> LLMResponse`: 简化的 LLM 调用。
- `await context.tool_loop_agent(event, chat_provider_id, prompt, tools, system_prompt=None, max_steps=30, tool_call_timeout=60) -> LLMResponse`: 工具循环 Agent。

**MessageChain (消息链构建器)**

- `MessageChain().message(text)`: 添加文本。
- `MessageChain().file_image(path)`: 添加图片文件。
- `MessageChain().at(user_id)`: 添加 At。

### 4. 存储与工具 (Storage & Utils)

- `await self.get_kv_data(key, default)`: 获取插件隔离的 KV 数据。
- `await self.put_kv_data(key, value)`: 存储插件隔离的 KV 数据。
- `await self.delete_kv_data(key)`: 删除 KV 数据。
- `await self.html_render(html_text=None, url=None, data=None, options=None)`: 将 HTML 字符串或网页渲染为图片。基于 Playwright。
- `text_to_image(text)`: 将文字转为图片。

### 5. 系统钩子 (Hooks)

Hooks 分为两层，不建议在"概念清单"里重复列举具体 hook 名单（容易过时）：

- 插件事件钩子（`@filter.on_*`）：见 `docs/plugin_config/hooks.md`
- Agent 运行钩子（`BaseAgentRunHooks`）：见 `docs/agent/agent-related-hooks.md`

### 6. Agent 智能体

- Agent 相关能力（tools / providers / persona / sandbox / cron / subagents）：见 `docs/agent/`
- `context.tool_loop_agent(...)`: 调用工具循环 Agent（可结合子智能体 handoff）
- v4.7.0+ Agent Runner 架构：见 `docs/agent/agent-runner.md`

### 7. Tool 定义 (v4.5.7+ 推荐)

推荐使用 dataclass 模式定义 Tool：

```python
from pydantic import Field
from pydantic.dataclasses import dataclass
from astrbot.core.agent.tool import FunctionTool
from astrbot.core.agent.run_context import ContextWrapper
from astrbot.core.astr_agent_context import AstrAgentContext

@dataclass
class MyTool(FunctionTool[AstrAgentContext]):
    name: str = "my_tool"
    description: str = "工具描述"
    parameters: dict = Field(default_factory=lambda: {
        "type": "object",
        "properties": {"query": {"type": "string", "description": "参数描述"}},
        "required": ["query"],
    })

    async def call(self, context: ContextWrapper[AstrAgentContext], **kwargs) -> str:
        return "结果"
```

### 8. 多智能体 (Multi-Agent) v4.5.7+

使用 agent-as-tool 模式实现多智能体：

```python
@dataclass
class SubAgentTool(FunctionTool[AstrAgentContext]):
    name: str = "sub_agent"
    description: str = "子智能体描述"
    parameters: dict = Field(default_factory=lambda: {...})

    async def call(self, context: ContextWrapper[AstrAgentContext], **kwargs) -> str:
        ctx = context.context.context
        event = context.context.event
        llm_resp = await ctx.tool_loop_agent(
            event=event,
            chat_provider_id=await ctx.get_current_chat_provider_id(event.unified_msg_origin),
            prompt=kwargs["query"],
            tools=ToolSet([SomeTool()]),
            max_steps=30,
        )
        return llm_resp.completion_text
```
