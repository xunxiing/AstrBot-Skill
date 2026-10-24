---
title: Telegram 媒体组处理机制 (Telegram Media Group Handling)
type: feature
status: stable
last_updated: 2025-02-08
related_base: platform_adapters/adapter_interface.md
---

## 概述

Telegram 平台在发送包含多张图片或视频的“相册”（Media Group）时，会将其拆分为多个独立的 Update 发送。AstrBot 的 Telegram 适配器实现了缓存与防抖机制，将这些碎片化的消息合并为单个 `AstrMessageEvent`，从而保证插件逻辑的一致性。

## 核心逻辑与参数

### 1. 收集与防抖机制
适配器通过 `media_group_id` 识别属于同一相册的消息，并使用 `APScheduler` 进行异步调度处理：
- **`telegram_media_group_timeout` (默认 2.5s)**: 防抖延迟。每收到该组内的一条新消息，计时器都会重置。这是收集所有媒体项的窗口期。
- **`telegram_media_group_max_wait` (默认 10.0s)**: 硬性超时上限。防止因消息流持续不断导致的无限延迟，达到此时间后将强制触发合并处理。

### 2. 消息合并策略
在 `process_media_group` 方法中，系统执行以下合并逻辑：
- **基础元数据**: 以媒体组的第一条消息作为基准，保留其 `message_str`（通常是相册的 Caption）、回复关系（Reply Chain）和会话上下文。
- **组件聚合**: 遍历组内所有后续消息，调用 `convert_message` 提取其媒体组件（如 `Image`, `Video`, `File`），并将其 `extend` 到基准消息的 `message` 列表（MessageChain）中。
- **事件分发**: 合并完成后，仅提交一个封装了完整 `MessageChain` 的 `AstrMessageEvent` 到事件循环。

## 关键方法签名

- `handle_media_group_message(update, context)`: 拦截带有 `media_group_id` 的消息并管理缓存与调度任务。
- `process_media_group(media_group_id)`: 核心合并函数，负责从缓存提取数据、重组 `AstrBotMessage` 并触发 `handle_msg`。

## 变更影响分析

- **插件开发者**: 
    - **事件密度变化**: 针对 Telegram 平台的相册消息，插件现在只会接收到一个 `AstrMessageEvent`。开发者应预期 `event.message` 列表中可能包含多个 `Image` 或 `Video` 组件。
    - **响应延迟**: 处理 Telegram 相册消息时会有至少 2.5s 的固有延迟，这是为了确保媒体收集完整，属于预期行为。
- **适配器开发者**: 
    - 此机制展示了处理“流式/碎片化”平台消息的标准范式：`缓存 -> 防抖调度 -> 组件合并 -> 统一分发`。在接入类似具有媒体组概念的平台（如 Discord）时应参考此实现。
- **边界情况**: 
    - 如果相册中的不同图片带有不同的文字说明（虽然 Telegram UI 通常只允许一个 Caption），目前逻辑仅保留第一条消息的文本。 
    - 超过 `max_wait` 后到达的消息将被视为独立消息处理。