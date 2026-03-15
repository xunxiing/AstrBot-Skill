---
title: QQ 官方平台表情解析机制 (QQ Official Face Parsing)
type: improvement
status: stable
last_updated: 2025-03-15
related_base: platform_adapters/adapter_interface.md
---

## 概述

QQ 官方平台（QQ Official Bot）在接收表情或贴纸消息时，原始数据以类似 XML 的标签格式呈现（例如 `<faceType=4,faceId="",ext="...">`）。为了使大语言模型（LLM）能够理解这些非文本内容，AstrBot 的 QQ 官方适配器实现了自动解析机制，将这些加密的标签转换为可读的文本描述。

## 核心逻辑与实现

### 1. 标签识别与提取
适配器通过 `_parse_face_message` 方法对消息内容进行正则匹配，识别所有符合 `<faceType=\d+[^>]*>` 模式的表情标签。

### 2. Base64 数据解码
表情标签中的 `ext` 字段包含了 Base64 编码的 JSON 数据。解析流程如下：
- **提取**: 从标签中提取 `ext` 属性值。
- **解码**: 使用 `base64.b64decode` 解码字符串。
- **解析**: 将解码后的 JSON 字符串解析为字典，提取其中的 `text` 字段（例如 `[满头问号]`）。

### 3. 文本替换策略
解析后的描述将以 `[表情:描述内容]` 的格式替换原始标签。如果解析失败，则回退为默认的 `[表情]` 占位符。此逻辑会同时应用于 `abm.message_str` 和 `abm.message` 链中的 `Plain` 组件。

## 变更影响分析

- **LLM 上下文增强**: 此变更直接解决了 LLM 无法理解 QQ 官方平台表情的问题。AI 开发者在编写提示词（Prompt）或处理逻辑时，可以预期 `event.message_str` 中包含语义化的表情描述，从而允许模型对用户的表情反馈做出响应。
- **数据流一致性**: 这种预处理发生在适配器层（Adapter Layer），确保了进入插件系统的 `AstrMessageEvent` 已经是经过清洗和增强的。插件开发者无需在业务代码中手动处理 QQ 官方平台的特殊 XML 标签。
- **边界情况**: 如果 `ext` 字段缺失或格式非法，系统将保留 `[表情]` 标记以维持消息结构的完整性，避免因解析异常导致消息内容丢失。