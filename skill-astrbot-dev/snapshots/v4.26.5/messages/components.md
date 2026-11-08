---
category: messages
---

# 消息链组件 (Message Components)

AstrBot 使用消息链（MessageChain）来描述消息结构，它是一个由多个消息段（MessagePart/Component）组成的有序列表。

### 核心组件及其兼容性

| 组件类型 | 描述 | 参数示例 | 平台兼容性建议 |
| :--- | :--- | :--- | :--- |
| `Plain` | 纯文本 | `text="Hello"` | 所有平台支持。 |
| `At` | 提及/艾特 | `user_id="xxx"` | 大多数平台支持。 |
| `Image` | 图片 | `fromFileSystem(path)`, `fromURL(url)` | 所有平台支持。URL 必须以 `http` 或 `https` 开头。 |
| `Record` | 语音 | `file="path/to/wav"` | 广泛支持。目前主要支持 `wav` 格式。 |
| `Video` | 视频 | `fromFileSystem(path)`, `fromURL(url)` | 广泛支持。常用格式为 `mp4` |
| `File` | 文件 | `file="path"`, `name="a.txt"` | 部分平台不支持。 |
| `Face` | 表情 | `id="123"` | 主要在 OneBot v11 (QQ) 平台支持。 |
| `Node/Nodes` | 合并转发节点 | `uin`, `name`, `content` | 仅 OneBot v11 支持。 |
| `Poke` | 戳一戳 | - | 主要在 OneBot v11 支持。 |
| `Reply` | 回复特定消息 | `message_id="xxx"` | 广泛支持。 |

### 消息构建示例

```python
import astrbot.api.message_components as Comp

# 方式 1：手动构建列表
chain = [
    Comp.At(user_id=event.get_sender_id()),
    Comp.Plain(" 来看这张图："),
    Comp.Image.fromURL("https://example.com/image.jpg")
]
yield event.chain_result(chain)

# 方式 2：使用 MessageChain 流式构建
from astrbot.api.event import MessageChain
message_chain = MessageChain().message("Hello!").file_image("path/to/image.jpg")
await self.context.send_message(event.unified_msg_origin, message_chain)
```
