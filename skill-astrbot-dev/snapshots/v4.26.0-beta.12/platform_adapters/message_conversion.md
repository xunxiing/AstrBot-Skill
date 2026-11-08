---
category: platform_adapters
---

# 消息转换逻辑 (Message Conversion)

`convert_message` 是适配器中最关键的方法，它负责将平台原始的消息格式映射到 AstrBot 的统一模型。

### 转换要求

在 `convert_message` 中，必须填充 `AstrBotMessage` 的以下核心字段：

1. **`type`**: 识别是 `GROUP_MESSAGE` 还是 `FRIEND_MESSAGE`。
2. **`session_id`**: 设置会话隔离。
3. **`message_str`**: 提取纯文本内容。
4. **`message`**: 将平台各段消息（如图片、表情）映射为 AstrBot 的 `MessageComponent` 列表。
5. **`sender`**: 提取发送者的 ID 和昵称。
6. **`raw_message`**: 保存原始对象。

### 提交事件

转换完成后，需将其封装为 `AstrMessageEvent` 并提交：

```python
async def handle_raw_message(self, data):
    bot_msg = self.convert_message(data)
    event = AstrMessageEvent(bot_msg, self) # 或子类
    self.commit_event(event)
```
