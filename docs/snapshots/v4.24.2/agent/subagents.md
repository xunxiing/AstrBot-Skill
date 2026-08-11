---
category: agent
---

# Subagents（子智能体 / Handoff）

Subagent 是给主 Agent 使用的 handoff 工具。主模型通过 `transfer_to_<name>` 把任务转交给子智能体执行。
`from astrbot.api import agent`（详见 `docs/agent/agent-registration.md`）

## 配置式（推荐）

### 最小配置

```json
{
  "subagent_orchestrator": {
    "main_enable": true,
    "remove_main_duplicate_tools": false,
    "router_system_prompt": "You are a task router...",
    "agents": [
      {
        "enabled": true,
        "name": "writer",
        "public_description": "负责技术文档整理与重写",
        "persona_id": null,
        "system_prompt": "你是文档子智能体，输出精简且结构化。",
        "provider_id": "openai_gpt4o_mini",
        "tools": ["search_docs", "rewrite_text"]
      }
    ]
  }
}
```

### `agents[]` 字段（源码对齐）

- `enabled`: 是否启用
- `name`: 子智能体名；工具名会生成为 `transfer_to_<name>`
- `public_description`: 暴露给主模型的工具描述（决定主模型是否愿意调用）
- `persona_id`: 可选；存在时优先使用 persona 的 `system_prompt/begin_dialogs/tools`
- `system_prompt`: 未命中 persona 时使用
- `provider_id`: 可选；子智能体专用 chat provider 覆盖
- `tools`: 子智能体可用工具名列表（字符串）

## 运行规则

- `main_enable=true` 时，主 Agent 会把所有 handoff 工具加入工具集。
- `remove_main_duplicate_tools=true` 时，会把“已分配给子智能体”的同名工具从主 Agent 工具集移除。
- `router_system_prompt` 会拼接到主 Agent 的 `system_prompt`。
- `provider_id` 不为空时，handoff 执行优先用该 provider；否则回退当前会话 provider。

## SDK/代码式（高级）

```python
from astrbot.api import agent

@agent(name="writer", instruction="你是写作子智能体。")
async def writer_agent(event):
    return None
```

> 代码式注册、`run_hooks`、专属工具挂载见：`docs/agent/agent-registration.md`

## MUST

- `name` 必须非空，且在同一实例中保持唯一。
- `public_description` 必须写“适用任务”，不要写空泛人设。
- `tools` 必须显式写成字符串列表（不要依赖隐式行为）。


