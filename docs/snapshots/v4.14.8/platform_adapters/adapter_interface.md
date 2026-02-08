---
category: platform_adapters
---

# 平台适配器接口 (Adapter Interface)

平台适配器（Platform Adapter）是将外部消息平台接入 AstrBot 的桥梁。

### 核心类：Platform

开发新适配器必须继承 `Platform` 基类并实现以下方法：

- **`run()`**: 异步阻塞方法。用于启动客户端 SDK 并持续监听消息。
- **`meta() -> PlatformMetadata`**: 返回适配器的元数据（名称、描述）。
- **`send_by_session(session, message_chain)`**: 底层发送接口。通常由 `run` 中捕获的会话对象调用。
- **`convert_message(data) -> AstrBotMessage`**: 核心逻辑。将平台原始数据转换为 AstrBot 标准消息对象。

### 注册适配器

使用装饰器进行注册：

```python
from astrbot.api.platform import register_platform_adapter

@register_platform_adapter("adapter_id", "Adapter Name", "Description")
class MyPlatformAdapter(Platform):
    # ... 实现 ...
```
