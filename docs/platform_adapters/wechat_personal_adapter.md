---
title: 微信个人号适配器 (WeChat Personal Account Adapter)
type: feature
status: stable
last_updated: 2025-02-08
related_base: platform_adapters/adapter_interface.md
---

## 概述
AstrBot v4.22.0 正式引入了**微信个人号**（WeChat Personal Account）适配器。该适配器基于微信官方提供的接入能力，支持通过二维码扫码登录，并针对个人号的消息流与媒体处理进行了深度优化，确保了在微信生态下的原生交互体验。

## 核心配置与契约
- **配置元数据**: 适配器配置由 `PERSONAL_WECHAT_CONFIG_METADATA` 定义，主要包含基础服务地址与启用开关。
- **基础服务配置**: `weixin_oc_base_url` 用于指定微信官方接口的后端服务地址，是适配器通信的核心端点。
- **登录流**: 采用 `QR-code driven setup`。适配器启动后会生成登录二维码，用户扫码后完成身份绑定，无需手动配置复杂的 Token 或密钥。
- **消息模型适配**:
    - **私聊**: 自动映射为 `MessageType.FRIEND_MESSAGE`。
    - **群聊**: 自动映射为 `MessageType.GROUP_MESSAGE`。
    - **UMO 标识**: `session_id` 保持与微信内部标识符一致，确保 UMO (`platform:type:session_id`) 在跨平台场景下的唯一性。

## 媒体处理增强
- **消息流重构**: 针对微信平台的媒体传输特性，重构了消息流处理逻辑，显著提升了图片、视频等二进制组件的接收与发送稳定性。
- **生命周期管理**: 配合 v4.22.0 引入的临时文件管理机制，微信媒体文件在转发或处理后会自动进入清理流程，优化了磁盘占用。

## 变更影响分析
- **开发者适配**: 插件开发者无需修改业务逻辑即可支持微信个人号。但需注意，微信平台对高频消息和长文本较为敏感，建议在插件层增加必要的文本聚合或摘要逻辑。
- **边界情况**: 微信官方接口可能对某些特殊消息类型（如小程序卡片、特殊表情）有不同的解析方式。开发者可通过 `event.message_obj.raw_message` 获取原始数据进行兜底处理。
- **最佳实践**: 鉴于微信个人号的交互特性，建议在回复长文本时优先使用 `text_to_image` 或进行分段发送，以降低被平台识别为异常账号的风险。