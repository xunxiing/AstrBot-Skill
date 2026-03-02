---
title: 平台预回应机制 (Pre-acknowledgment Reactions)
type: feature
status: stable
last_updated: 2025-02-08
related_base: platform_adapters/adapter_interface.md
---

## 概述
预回应机制（Pre-acknowledgment）是 AstrBot 核心流水线（Pipeline）中的一项功能，允许机器人在接收到消息后、进入复杂的插件逻辑或 LLM 请求之前，立即在原消息上添加“表情回应”（Reaction）。这旨在提供即时的交互反馈，告知用户系统已成功接收指令并正在处理。

## 核心逻辑与实现
该功能在核心流水线的预处理阶段（`preprocess_stage`）执行，具有极高的响应优先级。

- **执行位置**: `astrbot.core.pipeline.preprocess_stage.stage.py`。
- **支持平台**: 目前已支持 `telegram`, `lark`, 以及新增的 `discord`。
- **触发条件**: 当事件进入预处理阶段且对应平台的 `pre_ack_emoji.enable` 配置为 `true` 时触发。

## 配置契约
预回应功能通过 `Chat Provider` 的平台特异性配置（`platform_specific`）进行管理：

| 配置项 | 类型 | 描述 |
| :--- | :--- | :--- |
| `platform_specific.<platform>.pre_ack_emoji.enable` | bool | 是否启用该平台的预回应功能。 |
| `platform_specific.<platform>.pre_ack_emoji.emojis` | list[str] | 预回应使用的表情列表（支持 Unicode 或平台特定的表情标识符）。 |

## 变更影响分析

1. **交互一致性**: 新增对 Discord 平台的预回应支持，使得 Discord 适配器在处理耗时任务（如长文本生成或复杂工具调用）时，能像 Telegram 一样提供即时的视觉反馈。
2. **配置隔离**: 预回应配置位于 `platform_specific` 下，这意味着开发者可以为不同平台设置不同的表情偏好（例如 Telegram 受限于固定 Reaction 集，而 Discord 支持更广泛的 Unicode 表情）。
3. **副作用与边界**: 
    - **并发竞争**: 预回应是在 `preprocess_stage` 触发的，如果插件逻辑中也包含 `event.react()` 操作，可能会导致消息上出现多个表情。
    - **权限要求**: 适配器必须确保 Bot 账号在目标频道/群组中拥有“添加反应”的权限，否则该功能会静默失败或记录错误。
4. **AI 开发者提示**: 在编写涉及长时间异步操作的插件时，可以依赖此核心功能来处理基础的“已读”反馈，而无需在插件内部手动实现初始的 `react` 逻辑。