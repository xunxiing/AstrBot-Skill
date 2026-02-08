---
title: 消息组件平台兼容性更新 (v4.14.6)
type: improvement
status: stable
last_updated: 2026-02-08
related_base: messages/components.md
---

## 概述
在 v4.14.6 版本中，飞书 (Lark) 平台适配器完成了对核心多媒体组件的对齐，增强了插件在生产力工具场景下的表现力。

## 变更详情
飞书适配器现已支持以下 `MessageComponent` 的下行发送：
- **`Image`**: 支持通过 `Image.fromFileSystem(path)` 与 `Image.fromURL(url)` 发送图片。
- **`Video`**: 支持通过 `Video.fromFileSystem(path)` 与 `Video.fromURL(url)` 发送视频消息。
- **`File`**: 支持通过 `File.fromFileSystem(path, name)` 发送文件。

## 变更影响分析
1. **逻辑简化**: 开发者在构建 `MessageChain` 时，可以减少针对飞书平台的条件分支逻辑（如以往可能需要将文件转为 HTTP 链接），实现更纯粹的“一次编写，到处运行”。
2. **功能对齐**: 飞书平台在多媒体处理能力上已与 OneBot (QQ) 和 Telegram 等主流适配器对齐，适合开发文档分发、视频摘要或图像生成类插件。
3. **最佳实践**: 尽管适配器已支持组件，AI 开发者在设计插件时仍应考虑飞书平台对文件上传大小的潜在限制（通常由平台 API 决定），建议对超大文件保留链接回退机制。
4. **会话性能**: 配合核心对 WebChat 和企业微信会话队列的生命周期优化，多媒体消息的并发发送稳定性得到了进一步提升。