---
title: LINE 适配器媒体解析安全规范
type: improvement
status: stable
last_updated: 2025-02-08
related_base: platform_adapters/adapter_interface.md
---

## 概述
LINE 平台适配器对媒体组件（Image, Record, Video, File）的 URL 解析逻辑进行了安全性强化。系统现在强制要求外部链接必须使用 HTTPS 协议才能被直接引用，否则将通过内部服务进行中转。

## 核心逻辑变更
在 `line_event.py` 的解析流程中，针对以下组件的 URL 处理逻辑已更新：
- **协议校验收紧**：在 `_resolve_image_url`, `_resolve_record_url`, `_resolve_video_url`, `_resolve_file_url` 等方法中，取消了对 `http://` 前缀的直接支持。
- **HTTPS 准入**：仅当 URL 以 `https://` 开头时，适配器才会将其视为可直接使用的远程资源并返回原始 URL。
- **强制注册机制**：任何以 `http://` 开头或指向本地文件系统的路径，将触发 `segment.register_to_file_service()` 调用。该机制会将资源注册到 AstrBot 的文件服务中，生成符合平台要求的安全访问链接。

## 内部机制分析
该变更位于适配器层的事件处理逻辑中，通过静态解析方法对 `MessageComponent` 的属性进行预处理。其核心在于确保外发给 LINE 平台的消息体中，所有媒体 URL 均符合现代 Web 安全标准（HTTPS）。

## 变更影响分析
- **插件开发者影响**：如果插件发送的资源托管在仅支持 HTTP 的服务器上，这些资源现在会通过 AstrBot 核心的文件服务进行中转。开发者无需修改代码，但应知晓这可能引入额外的流量开销或延迟。
- **系统一致性**：此变更对齐了 LINE 平台对加密传输的偏好，减少了因协议不匹配导致的消息发送失败（400 Bad Request）。
- **AI 开发者建议**：在为 LINE 平台构建消息链时，应优先提供 HTTPS 链接以获得最佳性能。如果资源为本地文件，系统会自动处理注册逻辑，开发者保持使用 `fromFileSystem` 即可。