---
title: Subagent 编排与工具继承逻辑优化
type: improvement
status: stable
last_updated: 2025-02-09
related_base: agent/subagents.md
---

## 概述

AstrBot 优化了主智能体（Main Agent）与子智能体（Subagent）之间的工具集管理逻辑。此次变更明确了主智能体在开启编排模式（Subagent Orchestration）时，不再仅仅充当“路由”角色，而是可以同时保留自身工具并集成子智能体的转交工具（Handoff Tools）。

## 关键逻辑变更

### 1. 工具集并行与合并机制
在 `_ensure_persona_and_skills` 流程中，系统现在会首先解析并注入当前人设（Persona）关联的工具集。随后，如果启用了子智能体编排：
- **工具合并**：子智能体的 `transfer_to_<name>` 工具会被追加（Add）到主智能体的工具池中，而不是替换掉原有工具。
- **显式合并逻辑**：通过 `req.func_tool.merge(persona_toolset)` 确保了人设定义的工具与运行时注入的工具能够正确共存。

### 2. 精细化的重复工具移除
当配置项 `remove_main_duplicate_tools` 为 `true` 时，逻辑进行了修正：
- 系统会遍历所有已分配给子智能体的工具名。
- 如果这些工具存在于主智能体的工具池中，且**不是**转交工具（Handoff Tool），则会从主智能体中移除。
- 这确保了“专业任务归子智能体，通用任务留主智能体”的隔离原则，同时避免了主智能体失去转交能力。

### 3. 编排模式语义更新
官方配置与 UI 描述已同步更新：
- `main_enable = True` 的语义从“主 LLM 只负责分派”转变为“主 LLM 可直接使用自身工具，也可通过 handoff 分派”。这标志着主智能体能力的回归。

## 变更影响分析

- **架构设计**：开发者现在可以设计“混合型” Agent 架构。主智能体可以处理基础的、高频的本地工具调用，而将复杂的、特定领域的逻辑封装在子智能体中，两者不再是互斥关系。
- **配置副作用**：如果开发者希望实现完全的“路由模式”（即主智能体不具备任何直接操作能力），必须通过人设（Persona）清空主智能体的工具列表，或确保所有工具都已分配给子智能体并开启 `remove_main_duplicate_tools`。
- **AI 开发者提示**：在为 AstrBot 编写编排逻辑时，AI 助手应意识到主智能体的 `system_prompt` 依然有效，且其工具调用能力是 `Persona Tools + Handoff Tools - Duplicate Tools` 的并集。