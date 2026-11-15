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

### Pipeline 阶段顺序（排障关键）

消息进入 pipeline 后按以下阶段依次执行（源码：`astrbot/core/pipeline/stage_order.py`）：

```
WakingCheckStage → WhitelistCheckStage → SessionStatusCheckStage → RateLimitStage
→ ContentSafetyCheckStage → PreProcessStage → ProcessStage → ResultDecorateStage → RespondStage
```

### Hook 时序（v4.24.1 验证）

- `on_llm_request`：ProcessStage 内、Agent 调用模型**之前**触发。
  插件通过 `request.extra_user_content_parts` 注入提示词内容。
- Agent 运行：`tool_loop_agent_runner` 执行工具循环；此处 LLM 报错会触发
  provider fallback（日志：`Switched from ... to fallback chat provider`）。
- `on_llm_response`：LLM 返回后、ResultDecorateStage **之前**触发。
  **注意：其他插件（TTS、图片摘要等）可能在此阶段替换 result chain。**
  需要 LLM 文本时应在此从 `response.completion_text` 或 `event.get_result().chain`
  捕获，不要等到 `on_decorating_result`。
- `on_decorating_result`：ResultDecorateStage 内、发送前触发。
  若此前 `on_llm_response` 插件把 chain 替换为非 Plain 组件（Record/Image/Video），
  此时 `result.get_plain_text()` 可能为空字符串。
  Hook 按注册优先级执行；handler 可清空结果或调用 `event.stop_event()` 终止传播。
- `after_message_sent`：消息实际发送后触发。
- 流式输出（`STREAMING_RESULT`）会跳过 ResultDecorateStage，
  依赖结果装饰的 hook 在流式模式下可能不生效。
