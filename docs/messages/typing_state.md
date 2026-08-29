---
title: 正在输入状态管理 (Typing State Management)
type: feature
status: stable
last_updated: 2024-03-27
related_base: messages/events.md
---

## 概述
AstrBot 引入了标准化的“正在输入中 (Typing)”状态生命周期管理机制。该功能允许平台适配器在 LLM 生成响应的耗时阶段向终端用户展示动态反馈，并通过核心 Pipeline 确保状态的自动开启与闭环清理。

## 核心 API 契约

### 1. AstrMessageEvent 接口
所有继承自 `AstrMessageEvent` 的事件对象现在必须支持以下异步方法：
- `await event.send_typing()`: 向平台发送“正在输入”信号。在支持的平台上（如微信个人号），这通常会启动一个心跳维持任务。
- `await event.stop_typing()`: 显式停止“正在输入”信号。核心 Pipeline 会在处理结束时自动调用此方法。

### 2. 状态模型 (TypingSessionState)
系统内部使用 `TypingSessionState` 维护会话级的输入状态，包含：
- `owners`: 一个存储事件唯一标识 (`_typing_owner_id`) 的集合。采用**引用计数**逻辑，只有当所有关联事件都停止输入时，平台才会真正关闭状态。
- `keepalive_task`: 自动续期协程，负责在 `refresh_after` 到期前刷新平台 Ticket。
- `cancel_task`: 延迟取消任务，用于优化高并发场景下的状态抖动。

## 自动触发机制 (Pipeline)
在 `internal.py` 的 Agent 执行链路中，系统已集成自动化逻辑：
1. **触发**：在 LLM 请求 (`on_llm_request`) 发起前，自动调用 `event.send_typing()`。
2. **保障**：通过 `try...finally` 块确保无论 LLM 响应成功、超时或抛出异常，均会执行 `event.stop_typing()` 清除状态。

## 平台适配器实现规范 (以 weixin_oc 为例)
适配器在实现此功能时应遵循以下逻辑：
- **配置项**：暴露 `typing_keepalive_interval` (心跳间隔) 和 `typing_ticket_ttl` (凭证有效期)。
- **并发安全**：使用 `asyncio.Lock` 保护 `TypingSessionState` 的修改，防止多条并发消息竞争导致状态机混乱。
- **清理**：在适配器 `terminate` 时，必须强制执行 `_cleanup_typing_tasks` 以释放所有挂起的协程资源。

## 变更影响分析
- **插件开发者**：通常无需手动调用 `send_typing`，核心 Pipeline 已处理。但在执行耗时极长的自定义插件逻辑（非 LLM 请求）时，可手动调用 `event.send_typing()` 提升用户体验。
- **适配器开发者**：必须实现引用计数逻辑。如果简单地在 `stop_typing` 时直接关闭状态，会导致并发对话中其他仍在处理的事件失去“正在输入”提示。
- **边界情况**：若平台 API 频率受限，心跳间隔不应低于 1s。系统已通过 `try-except` 隔离了状态发送失败对主消息流的影响。