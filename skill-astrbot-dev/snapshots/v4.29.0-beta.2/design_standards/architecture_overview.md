---
category: design_standards
---

# 核心架构综述

AstrBot 采用基于**插件化 (Plugin-based)** 和 **事件驱动 (Event-driven)** 的架构。其核心（Core）负责协调各个管理器（Manager），并通过 `Context` 对象向插件（Star）暴露能力。

### 核心管理器分工

- **`PluginManager`**: 负责插件的加载、卸载、重载以及元数据管理。
- **`PlatformManager`**: 管理所有已接入的消息平台适配器，负责分发事件。
- **`ProviderManager`**: 管理大语言模型（LLM）、语音识别（STT）、语音合成（TTS）等服务提供商。
- **`ConversationManager`**: 管理用户会话历史、上下文存储及切换。
- **`PersonaManager`**: 管理人格设定（Persona），包括系统提示词（System Prompt）和工具配置。

### 核心设计原则

1. **解耦**: 核心系统与平台适配器、AI 提供商、插件之间高度解耦。
2. **统一模型**: 所有的平台消息都被转化为统一的 `AstrBotMessage` 模型。
3. **插件化**: 功能尽可能通过插件实现，核心仅提供基础调度能力。
