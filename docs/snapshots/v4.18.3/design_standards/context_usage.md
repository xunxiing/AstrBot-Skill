---
category: design_standards
---

# Context 对象使用规范

`Context` 对象是 AstrBot 的能力中枢，在插件初始化时通过 `__init__` 注入。它是插件与系统核心交互的唯一桥梁。

### 重要属性

通过 `self.context` 可以访问各个管理器：

- `self.context.conversation_manager`: 会话管理器。
- `self.context.persona_manager`: 人格管理器。
- `self.context.platform_manager`: 平台管理器。
- `self.context.provider_manager`: 提供商管理器。

### 核心方法

#### 消息与平台相关
- `send_message(umo: str, message_chain: MessageChain)`: 向指定源主动发送消息。
- `get_platform(platform_type: PlatformAdapterType)`: 获取指定类型的平台实例。

#### AI 与工具相关
- `add_llm_tools(*tools)`: 动态注册函数工具。
- `get_using_provider(umo)`: 获取当前使用的 LLM 提供商。

#### 配置与插件
- `get_config(umo=None)`: 获取当前配置。
- `get_all_stars()`: 获取所有已加载插件的元数据。
