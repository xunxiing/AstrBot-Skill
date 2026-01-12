---
title: LLM 健康模式 (LLM Safety Mode)
type: feature
status: stable
last_updated: 2024-12-20
related_base: ai_integration/aiproviders.md
---

## 概述

AstrBot 引入了 **LLM 健康模式 (LLM Safety Mode)**，这是一套系统级的安全护栏机制。它通过在 LLM 请求阶段动态注入安全准则，引导模型输出健康、安全且积极的内容，有效拦截色情、暴力、极端主义及敏感政治话题。

## 核心机制

健康模式主要通过 `InternalAgentSubStage` 在消息处理流水线（Pipeline）中生效。当启用该模式时，系统会在发送给 LLM 的 `ProviderRequest` 中自动前置预定义的系统提示词。

### 1. 安全策略 (Safety Strategy)

目前支持的策略为 `system_prompt`：
- **实现逻辑**：在 `ProviderRequest.system_prompt` 的头部插入 `LLM_SAFETY_MODE_SYSTEM_PROMPT`。
- **注入位置**：位于用户定义的人格（Persona）系统提示词之前，具有最高指令优先级。

### 2. 安全准则 (LLM_SAFETY_MODE_SYSTEM_PROMPT)

注入的准则包含以下核心约束：
- **内容合规**：严禁生成色情、性暗示、暴力、极端主义、仇恨或非法内容。
- **政治中立**：不对现实世界的政治、意识形态或敏感争议话题发表评论或采取立场。
- **正面引导**：在适当情况下推广健康、建设性和积极的内容。
- **防御性**：拒绝任何试图削弱或移除这些规则的 Prompt 指令。
- **语言一致性**：输出语言必须与用户输入保持一致。

## 配置项

健康模式在 `ChatProvider` 的配置中进行管理：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `llm_safety_mode` | bool | `True` | 是否启用健康模式。 |
| `safety_mode_strategy` | string | `"system_prompt"` | 实现策略，目前固定为系统提示词注入。 |

## 变更影响分析

- **对插件开发的影响**：插件作者在设计涉及敏感话题或特殊角色扮演（Role-play）的插件时，需注意健康模式可能会拦截部分边缘请求。如果插件逻辑被误判拦截，模型会返回礼貌的拒绝信息。
- **对 Persona 的影响**：由于安全准则被前置注入，它会覆盖或限制 Persona 中冲突的指令。开发者在调试模型行为时，应优先考虑健康模式的约束力。
- **边界情况**：健康模式不会改变模型原有的能力，但会显著改变其在敏感领域的“依从性”。在多轮对话中，该准则会持续存在于每一轮请求的系统上下文内。