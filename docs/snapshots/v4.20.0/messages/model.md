---
category: messages
---

# 消息模型 (AstrBotMessage)

`AstrBotMessage` 是适配器层生成的标准化消息对象，它屏蔽了不同平台（QQ、飞书等）的差异，使插件可以“一次编写，到处运行”。

### AstrBotMessage 结构

在适配器中，必须填充 `AstrBotMessage` 的以下字段：

```python
class AstrBotMessage:
    type: MessageType      # 消息类型（GROUP_MESSAGE 或 FRIEND_MESSAGE）
    self_id: str          # 机器人 ID
    session_id: str       # 会话 ID，决定了上下文隔离
    message_id: str       # 消息 ID
    group_id: str         # 群组 ID（如果是私聊则为空）
    sender: MessageMember # 发送者信息（含 user_id 和 nickname）
    message: List[BaseMessageComponent] # 消息链（组件列表）
    message_str: str      # 纯文本汇总内容
    raw_message: object   # 原始平台消息对象（用于 Debug 或特殊处理）
    timestamp: int        # 时间戳
```

### 属性详解

- **`session_id`**: 核心字段，用于决定 LLM 对话的上下文隔离。
- **`message_str`**: 插件处理逻辑中常用的纯文本内容。
- **`message`**: 结构化消息内容，由各种消息组件组成。
