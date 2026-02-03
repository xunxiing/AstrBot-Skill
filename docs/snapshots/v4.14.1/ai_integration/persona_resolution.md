---
title: 人格解析与优先级逻辑 (Persona Resolution)
type: improvement
status: stable
last_updated: 2024-05-22
related_base: ai_integration/llmpersonasets.md
---

## 概述

AstrBot 在构建 LLM 请求时，会根据一套严格的优先级逻辑来确定当前会话应使用的人格设定（Persona）。最新变更强化了会话级别的控制能力，并引入了显式禁用机制。

## 人格选择优先级 (Priority Chain)

系统按以下顺序检索 `persona_id`，一旦命中则停止：

1. **会话服务配置 (Session Service Config)**: 最高优先级。存储在 `umo` 作用域下的 `session_service` 配置中。
2. **对话分支设定 (Conversation Setting)**: 第二优先级。存储在特定 `Conversation` 对象的 `persona_id` 属性中。
3. **全局默认设定 (Global Config)**: 最低优先级。读取插件配置中的 `default_personality` 字段。

## 显式禁用机制 (`[%None]`)

开发者或用户可以通过将 `persona_id` 设置为字符串 `"[%None]"` 来显式禁用人格注入：
- 当检测到该值时，系统将跳过所有系统提示词（System Prompt）和预设对话（Begin Dialogs）的注入逻辑。
- 这对于需要纯净 LLM 上下文的插件逻辑至关重要。

## 平台特定行为：Webchat (网页聊天)

针对 `webchat` 平台（即 WebUI 聊天界面），系统存在特殊的注入逻辑：
- **自动注入**: 如果当前未显式禁用人格（即 `persona_id != "[%None]"`），系统会自动应用 `_chatui_default_` 人格。
- **提示词合并**: `CHATUI_SPECIAL_DEFAULT_PERSONA_PROMPT` 已合并了追问/总结逻辑，确保 Web 界面交互的连贯性。

## 变更影响分析

- **上下文一致性**: 插件开发者在通过 `context.conversation_manager` 修改对话时，应注意 `persona_id` 的赋值。若希望跟随全局设置，应设为 `None`；若希望完全不使用人格，应设为 `"[%None]"`。
- **Web 适配器开发**: 如果开发类似 Webchat 的交互式适配器，应参考其 `persona_id` 强制覆盖逻辑，以保证 UI 侧的引导体验一致。
- **调试建议**: 当发现 LLM 输出带有非预期的系统提示词时，应首先检查 `event.get_platform_name()` 是否为 `webchat`，其次检查会话服务配置中的 `persona_id` 状态。