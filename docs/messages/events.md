---
title: 消息事件 (AstrMessageEvent)
type: improvement
status: stable
last_updated: 2025-02-12
related_base: messages/events.md
---

## 概述
`AstrMessageEvent` 是插件处理逻辑的核心上下文对象。除了会话标识管理外，现已引入原生状态反馈机制，允许机器人向用户发送“正在输入”或“正在上传”的视觉提示。

## 核心属性与方法

### 1. 状态反馈 API
- **`await event.send_typing()`**:
    - **功能**: 触发平台侧的“正在输入”或“正在处理”状态指示器。
    - **自动触发**: 在核心流水线的 `agent_sub_stages` 中，系统会在发起 LLM 请求前自动调用此方法，以降低用户的感知延迟。
    - **平台适配**: 这是一个虚方法，由具体平台适配器（如 Telegram）实现。若平台不支持，则静默忽略。

### 2. 核心属性 (Property)
- **`event.unified_msg_origin` (UMO)**: 统一会话标识符，支持 Getter/Setter 以实现动态会话切换。
- **`event.session_id`**: 当前会话的唯一 ID。

## 平台实现细节 (以 Telegram 为例)
Telegram 适配器对 `send_typing` 进行了深度集成，支持根据消息链内容自动切换状态：
- **状态映射**: 
    - `Plain` -> `typing` (正在输入)
    - `Image` -> `upload_photo` (正在上传图片)
    - `Record` -> `upload_voice` (正在上传语音)
    - `File` -> `upload_document` (正在上传文件)
- **流式节流 (Throttling)**: 在 `send_streaming` 模式下，系统以 0.5 秒为间隔节流发送状态更新，确保在长文本生成期间状态不中断，同时避免触发 Telegram 的频率限制 (Rate Limit)。

## 变更影响分析

- **感知延迟优化**: AI 开发者现在可以依赖系统自动触发的 `send_typing` 来提升 UX，无需在插件逻辑中手动实现“正在思考”的文字回复。
- **适配器开发契约**: 适配器作者应重写 `send_typing` 方法。在处理媒体文件发送时，建议遵循 `发送上传状态 -> 执行发送 -> 恢复输入状态` 的模式（参考 `_send_media_with_action` 逻辑）。
- **流式输出边界**: 在流式传输过程中，状态反馈会自动与消息编辑逻辑同步。开发者若自定义流式生成器，应注意状态反馈的节流时间，避免高频调用导致平台封禁。