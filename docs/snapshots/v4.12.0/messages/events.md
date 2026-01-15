---
category: messages
---

# 消息事件 (AstrMessageEvent)

插件的处理函数（Handler）接收的首个参数即为 `AstrMessageEvent`。它封装了 `AstrBotMessage` 并提供了大量快捷方法。

### 重要属性

- `event.message_obj`: 原始 `AstrBotMessage` 对象。
- `event.message_str`: 消息纯文本内容。
- `event.unified_msg_origin` (umo): 统一消息源标识符。

### 获取信息方法

- `event.get_sender_id() -> str`: 获取发送者 ID。
- `event.get_sender_name() -> str`: 获取发送者昵称。
- `event.get_group_id() -> str`: 获取群组 ID（若有）。

### 响应方法 (被动回复)

在 Handler 中使用 `yield` 快速回复：

- `event.send(message_result)`: 发送消息回复（异步）。
- `event.plain_result(text) -> MessageEventResult`: 快速创建纯文本返回结果。
- `event.image_result(path_or_url) -> MessageEventResult`: 快速创建图片返回结果。
- `event.chain_result(chain) -> MessageEventResult`: 通过消息链创建返回结果。
- `event.make_result() -> MessageEventResult`: 创建一个空的返回结果容器。

### 事件控制

- `event.stop_event()`: 停止事件传播，后续插件和核心流程将不再处理此事件。
