---
category: agent
---

# 人格解析与优先级（Persona Resolution）
系统按以下顺序解析 `persona_id`，命中即停止：

1. 会话级：`session_service_config.persona_id`（`umo` 作用域）
2. 对话分支级：`conversation.persona_id`
3. 全局默认：`provider_settings.default_personality`

## 插件可用入口

```python
umo = event.unified_msg_origin
conv_mgr = self.context.conversation_manager
```

## 1设置会话级 persona（最高优先级）

使用 SDK `sp` 读写 `session_service_config`：

```python
from astrbot.api import sp

cfg = await sp.get_async(scope="umo", scope_id=umo, key="session_service_config", default={}) or {}
cfg["persona_id"] = "assistant_default"
await sp.put_async(scope="umo", scope_id=umo, key="session_service_config", value=cfg)
```

## 2设置对话分支级 persona

```python
cid = await conv_mgr.get_curr_conversation_id(umo)
await conv_mgr.update_conversation(umo, conversation_id=cid, persona_id="assistant_default")
```

## 3 显式禁用人格注入

将 `persona_id` 设置为 `"[%None]"`（会话级或分支级都可）：

```python
await conv_mgr.update_conversation(umo, conversation_id=cid, persona_id="[%None]")
```

## 运行时行为要点

- 命中 persona 后会注入：
  - `persona.prompt` -> `system_prompt`
  - `persona._begin_dialogs_processed` -> 上下文前置消息
- `webchat` 平台下，若未命中 persona 且 `persona_id != "[%None]"`，会追加 ChatUI 默认人格提示词。
- 读写 `session_service_config` 时必须先读后改再写回，避免覆盖掉同键下其他字段（如 `llm_enabled` / `tts_enabled`）。
- 会话操作必须使用当前 `umo`，不要跨会话复用 `conversation_id`。