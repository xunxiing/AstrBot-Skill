---
category: messages
---

# 统一消息源 (Unified Message Origin)

统一消息源（Unified Message Origin，简称 **UMO**）是 AstrBot 识别跨平台会话的核心标识。

### 格式

UMO 是一个格式如下的字符串：
`platform_id:message_type:session_id`

- **`platform_id`**: 平台 ID（如 `aiocqhttp`, `qqofficial`）。
- **`message_type`**: 消息类型（`group` 或 `private`）。
- **`session_id`**: 会话 ID（群号或用户 ID）。

### 用途

1. **会话识别**: 唯一标识一个消息来源。
2. **主动发送**: 通过 `context.send_message(umo, message_chain)` 向指定的源发送消息。
3. **获取方式**: 在插件中通过 `event.unified_msg_origin` 获取。
