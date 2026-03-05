---
title: KOOK Platform Adapter
type: feature
status: stable
last_updated: 2026-03-05
related_base: platform_adapters/adapter_interface.md
---

# KOOK 平台适配器 (KOOK Platform Adapter)

AstrBot 官方集成的 KOOK 消息平台适配器，允许机器人接入 KOOK 语音/文字社区。

## 概述

KOOK 适配器实现了标准的 `Platform` 接口，支持文本消息、卡片消息、图片/文件上传及主动消息发送。适配器内置了连接保活、指数退避重连及消息防广播风暴机制。

## 配置项 (Configuration)

在 Dashboard 或配置文件中启用 KOOK 适配器时，需填写以下字段（定义于 `astrbot/core/config/default.py`）：

| 配置键 | 类型 | 说明 |
| :--- | :--- | :--- |
| `kook_bot_token` | string | **必填**。从 KOOK 开发者平台获取的机器人 Token。 |
| `kook_bot_nickname` | string | 可选。若发送者昵称与此值一致，消息将被忽略（防止机器人响应自己的消息）。 |
| `kook_reconnect_delay` | int | 初始重连延迟（秒），默认 1。 |
| `kook_max_reconnect_delay` | int | 最大重连延迟（秒），默认 60。 |
| `kook_max_retry_delay` | int | 重试的最大延迟时间（秒），默认 60。 |
| `kook_heartbeat_interval` | int | 心跳检测间隔（秒），默认 30。 |
| `kook_heartbeat_timeout` | int | 心跳超时时间（秒），默认 6。 |
| `kook_max_heartbeat_failures` | int | 允许的最大心跳失败次数，默认 3。 |
| `kook_max_consecutive_failures` | int | 允许的最大连续连接失败次数，超过后停止重连，默认 5。 |

## 消息处理逻辑

### 支持的消息类型

适配器主要监听并处理以下 KOOK 事件类型（`payload.type`）：
- **Type 9**: 文本消息。
- **Type 10**: 卡片消息（Card Message）。

其他类型消息（如纯语音、系统事件）当前可能被忽略或需进一步适配。

### 防广播风暴 (Bot Nickname Filter)

为了避免机器人响应自己发送的消息（导致无限循环），适配器实现了 `_should_ignore_event_by_bot_nickname` 逻辑：
1. 读取配置项 `kook_bot_nickname`。
2. 获取消息发送者的昵称（`author.nickname` 或 `author.username`）。
3. 进行大小写不敏感的比对。
4. 若匹配，直接丢弃该事件，不进入 AstrBot 事件队列。

**最佳实践**：部署时务必在配置中填写机器人的 KOOK 昵称，尤其是在多机器人共存的频道中。

### 卡片消息解析

适配器支持解析 KOOK 卡片消息。若解析失败，错误信息会被记录到日志，但不会导致适配器崩溃。

## 连接管理 (Connection Management)

适配器在 `KookPlatformAdapter._main_loop` 中实现了健壮的连接管理：

1. **指数退避重连**：连接失败后，等待时间按 `2^consecutive_failures` 增长，直到达到 `kook_max_retry_delay`。
2. **连续失败熔断**：若连续失败次数超过 `kook_max_consecutive_failures`，适配器将停止重连并进入错误状态，防止无效资源消耗。
3. **心跳检测**：通过 `KookClient` 维护 WebSocket 心跳，超时或失败次数过多会触发重连。

## 主动消息发送

实现 `send_by_session` 方法支持主动向指定会话发送消息。内部构建 `KookEvent` 并调用客户端发送接口。

```python
# 插件中主动发送示例
umo = "kook:group:123456789" 
chain = MessageChain().message("Hello KOOK")
await self.context.send_message(umo, chain)
```

## 变更影响分析

1. **新平台标识**：插件开发者现在可以使用 `@filter.platform_adapter_type("kook")` 专门针对 KOOK 平台编写逻辑。
2. **配置兼容性**：旧版本配置加载逻辑已更新以支持新的 `kook` 配置块。若从旧版本升级，需在 Dashboard 重新启用并配置 KOOK 适配器。
3. **消息过滤行为**：由于引入了 `kook_bot_nickname` 过滤机制，若配置错误（如昵称不匹配），机器人可能无法响应消息或出现“鬼畜”（响应自己）。开发者在调试时应优先检查此配置项。
4. **卡片消息支持**：KOOK 特有的卡片消息现在会被转换为 AstrBot 消息链。插件在处理 `event.message` 时可能会收到非标准组件（取决于 `convert_message` 的具体实现，通常映射为 `Plain` 或 `Image`），建议增加容错处理。
5. **重连延迟感知**：在网络不稳定环境下，KOOK 适配器可能会有秒级的重连延迟。插件若依赖实时性极高的功能，需注意此潜在延迟。

## 相关源码入口

- 适配器实现：`astrbot/core/platform/sources/kook/kook_adapter.py`
- 配置定义：`astrbot/core/config/default.py`
- 平台注册：`astrbot/core/platform/manager.py`
