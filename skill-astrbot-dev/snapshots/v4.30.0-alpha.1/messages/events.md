---
title: 消息事件 (AstrMessageEvent)
type: improvement
status: stable
last_updated: 2024-05-22
related_base: messages/events.md
---

## 概述
`AstrMessageEvent` 是插件处理逻辑的核心上下文对象。在最新版本中，该对象的会话标识属性（`session_id` 与 `unified_msg_origin`）已重构为基于 `MessageSession` 对象的动态属性（Property），增强了会话管理的一致性。

## 核心属性与 Setter 契约

这些属性现在不仅支持读取，还支持通过 Setter 进行动态修改，且修改会自动同步到底层的 `MessageSession` 状态：

- **`event.unified_msg_origin` (UMO)**:
    - **Getter**: 返回格式为 `platform_name:message_type:session_id` 的统一标识符。
    - **Setter**: 允许通过赋值 UMO 字符串来重置事件的会话上下文。内部通过 `MessageSession.from_str(value)` 重新解析并覆盖当前 session 对象。
- **`event.session_id`**:
    - **Getter**: 获取当前会话的唯一 ID。
    - **Setter**: 直接修改当前会话 ID，此变更会立即反映在 `unified_msg_origin` 的输出中。

## 内部实现逻辑

`AstrMessageEvent` 不再在 `__init__` 中静态存储 `session_id` 和 `unified_msg_origin` 字符串，而是统一维护一个 `self.session` (`MessageSession` 类实例)。
- **初始化**: 修正了 `MessageSession` 的拼写错误并确保其在事件创建时被正确初始化。
- **响应式更新**: 通过 Python `@property` 装饰器，确保了 UMO 和 Session ID 始终指向同一个数据源，消除了状态不一致的风险。

## 变更影响分析

1. **动态会话切换**: 插件开发者现在可以在事件处理过程中，通过修改 `event.unified_msg_origin` 动态地将事件“重定向”到另一个会话上下文。这对于实现跨群指令触发或会话劫持逻辑至关重要。
2. **副作用警示**: 修改 `unified_msg_origin` 会导致底层的 `platform_name` 和 `message_type` 同时发生变化。如果仅需修改用户 ID，应优先使用 `event.session_id` 的 setter。
3. **最佳实践**: 在编写需要持久化或比对会话的逻辑时，应始终依赖 `event.unified_msg_origin` 属性，因为它现在是经过 `MessageSession` 校验的权威来源。