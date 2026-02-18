---
title: Record 组件的 text 字段（语音文本保留与平台回退 Caption）
type: improvement
status: stable
last_updated: 2026-02-18
related_base: messages/components.md
---

## 概述
`Record`（语音）消息组件新增可选字段 `text: str | None`，用于**保留语音对应的原始文本内容**（例如 TTS 源文本）。该字段主要服务于“平台发送语音失败时的回退策略”，使系统在回退为“文件/文档发送”时仍可携带可读的说明文字（caption）。

该变更属于对消息组件契约的向后兼容扩展：不填写 `text` 不影响既有逻辑。

## 对外契约（Message Component）
### `Record` 新增字段
在 `Record` 组件上新增：

- `text: str | None = None`
  - 语义：语音的原始文本内容（例如 TTS 的源文本）。
  - 用途：在平台不支持/不允许发送语音的场景下，可作为回退消息的 caption/说明文本。

插件作者/适配器作者在构造 `Record` 时可以选择性填充该字段；未填充时应视为“没有可用的原始文本”。

## 系统数据流：从结果装饰到平台发送
### 1) 结果装饰阶段透传原始文本
在结果装饰流水线中，当系统构造 `Record(...)` 组件时，会把源组件的 `comp.text` 透传到 `Record.text`，从而让下游平台发送逻辑可以获取到这段原始文本。

这意味着：如果上游组件（例如某个生成语音的组件/步骤）提供了 `text`，则该文本会在最终 `Record` 上被保留下来。

### 2) Telegram 平台：语音发送失败时回退为 document，并使用 `Record.text` 作为 caption
Telegram 适配器在发送 `Record` 时，新增了专用的回退发送助手：

- 当尝试发送 `send_voice` 触发 `telegram.error.BadRequest`，且错误信息包含 `Voice_messages_forbidden`（用户隐私设置禁止接收语音）时：
  - 系统会回退改用 `send_document` 发送同一音频文件。
  - 回退发送时的 `caption` 使用 `Record.text`（流式发送路径中可能使用 `Record.text` 或本次 delta 文本）。

该行为对插件侧可见的结果是：在 Telegram 上，原本“语音消息”在特定用户隐私配置下会变成“音频文件（document）+ caption”。

## 变更影响分析
1) **消息组件契约扩展（对 AI 开发者/RAG 的影响）**：在理解 `Record` 组件时，除了 `file/url` 等媒体定位字段，还应将 `Record.text` 视为“语音的可读文本语义”，用于跨平台一致性与回退展示。

2) **平台差异与边界情况（Telegram）**：
   - 发送语音并非总是成功；Telegram 在 `Voice_messages_forbidden` 情况下会被适配器自动回退成 document。
   - 若插件希望在回退场景仍能让用户理解音频含义，应在生成/构造 `Record` 时尽量填充 `text`（例如写入 TTS 源文本）。

3) **适配器实现最佳实践（对适配器作者）**：当平台存在“媒体类型被禁止/不可用”的场景时，推荐保留媒体的原始语义文本（如 `Record.text`），以便在 fallback（改发 document/file）时提供 caption，从而降低用户困惑与信息丢失。
