---
category: design_standards
---

# 消息流转模型

AstrBot 的消息处理遵循一个清晰的流转过程。

### 核心流程图

1. **接收**: 平台适配器（Platform）接收原始消息。
2. **转换**: 调用 `convert_message` 将其封装为 `AstrBotMessage`。
3. **提交**: 封装为 `AstrMessageEvent` 后通过 `self.commit_event(event)` 提交到事件队列。
4. **分发**: `PlatformManager` 按优先级将事件分发给所有插件的 Handler。
5. **处理**: 插件执行业务逻辑。
    - 若调用 `event.stop_event()`，流程在此终止。
6. **LLM 交互**: 若消息未被拦截，且符合 AI 触发条件，调用配置的 LLM。
7. **结果装饰**: 发送前调用 `on_decorating_result` 钩子。
8. **回复**: 调用 `event.send()` 或 `yield`，触发适配器的 `send` 方法。
9. **发送**: 适配器调用平台 SDK 发送消息。
