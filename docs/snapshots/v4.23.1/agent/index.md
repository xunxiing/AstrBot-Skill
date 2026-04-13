---
category: agent
---

# Agent 系统概览

在 AstrBot 中，“Agent”指的是：**指令/系统提示（instructions）+ 工具（tools）+ 模型提供商（providers）+ 运行时能力（上下文管理 / 子智能体 / 沙盒 / 定时任务）** 的组合。

本目录把原先以 “LLM” 为中心的内容重组为 “Agent” 视角：LLM/VLM/Embedding 等都被视为 Provider 能力的一部分，工具与运行时能力决定了 Agent 的上限与安全边界。

## 你大概率会从这里开始

- 需要让模型调用工具：`docs/agent/tools.md`
- 需要选模型/Embedding/STT/TTS：`docs/agent/providers.md`
- 需要控制上下文与压缩：`docs/agent/context-compression.md`
- 需要 Hook（事件钩子/Agent 钩子）：`docs/agent/agent-related-hooks.md`
- 需要子智能体：`docs/agent/subagents.md`
- 需要代码方式注册子智能体：`docs/agent/agent-registration.md`
- 需要沙盒（computer use）：`docs/agent/sandbox.md`
- 需要定时任务（主动能力）：`docs/agent/cron.md`
- **v4.7.0+ Agent Runner 架构（Dify/Coze/DeerFlow）**：`docs/agent/agent-runner.md`

## 最短示例：工具循环 Agent

```python
llm_resp = await self.context.tool_loop_agent(
    event=event,
    chat_provider_id=prov_id,
    prompt="把这段需求拆成 3 个可执行步骤，并给出每步输出。",
    tools=ToolSet([MyTool()]),
    max_steps=10,
    tool_call_timeout=60,
    system_prompt="你是一个严谨的工程助手。",
)
```

### 关键参数（只记这几个就够用）

- `chat_provider_id`：对话模型 provider id（LLM/VLM 的入口通常在这里）
- `tools`：可用工具集合（`FunctionTool` / handoff tool / 运行时注入工具）
- `max_steps`：限制循环次数，避免无限工具调用
- `tool_call_timeout`：单个工具调用超时
- `system_prompt`：定义 Agent 角色、边界与输出格式

## 相关源码入口（以代码为准）

- Agent runner（工具循环）：`astrbotcore/astrbot/core/agent/runners/tool_loop_agent_runner.py`
- Agent hooks 接口：`astrbotcore/astrbot/core/agent/hooks.py`
- 主 Agent 构建（沙盒/定时工具注入/安全模式等）：`astrbotcore/astrbot/core/astr_main_agent.py`
