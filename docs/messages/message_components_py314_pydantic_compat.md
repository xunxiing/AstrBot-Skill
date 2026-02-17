---
title: Message Components 在 Python 3.14 的 Pydantic 兼容性修复
type: improvement
status: stable
last_updated: 2026-02-17
related_base: messages/components.md
---

## 概述
AstrBot Core 对消息链组件（Message Components）的底层模型实现做了兼容性修复，以解决 **Python 3.14** 环境下出现的组件字段异常（commit 指向的现象为：`Plain` 实例可能出现 `text` 属性缺失）。

该修复发生在消息组件定义模块 `astrbot/core/message/components.py`，属于对 **MessageChain / Message Components** 底层数据模型的稳定性增强；对插件作者与平台适配器作者而言，组件对外使用方式（如 `Plain(text=...)`、`event.chain_result([...])`）不应改变，但在 Python 3.14 运行时将获得一致且可预期的字段行为。

## 关键实现变更（对外契约相关）

### 1) Pydantic `BaseModel` 导入按 Python 版本切换
消息组件基类所依赖的 `BaseModel` 在 Python 3.14+ 环境下切换为 `pydantic`（非 `pydantic.v1` shim），以避免新版本 Python + Pydantic 组合下的兼容性问题。

- Python >= 3.14：`from pydantic import BaseModel`
- Python < 3.14：`from pydantic.v1 import BaseModel`

**契约意义**：消息组件作为结构化消息段（MessagePart/Component）的序列化/反序列化基础，将随运行时选择不同的 Pydantic BaseModel 实现；插件/适配器侧不应假设组件一定基于 `pydantic.v1`。

### 2) 各组件的 `type` 字段改为显式类型注解
在多个组件类中，`type` 从简单赋值改为“带注解的字段声明”，例如：

- `class Plain(BaseMessageComponent):`
  - 由 `type = ComponentType.Plain`
  - 调整为 `type: ComponentType = ComponentType.Plain`

同类变更覆盖了 `Face / Record / Video / At / Reply / File / Nodes / Json / Unknown / WechatEmoji` 等。

**契约意义**：在 Pydantic 参与字段推断与模型构建时，组件的 `type` 作为组件判别字段（discriminator-like 的固定值）将以更稳定的方式存在于模型定义中，从而降低“字段缺失/不一致”的风险（该变更与修复 Python 3.14 下 `Plain.text` 异常现象同属一组兼容性修复）。

## 对插件开发与适配器开发的影响

### 插件作者（Star / Handler）
- 继续使用现有消息组件 API：`Plain(text=...)`、`Image.fromURL(...)`、`event.chain_result([...])`、`MessageChain().message(...)`。
- 在 Python 3.14 环境下，消息组件字段（如 `Plain.text`）的可用性与模型行为将更一致。

### 平台适配器作者（Platform Adapter）
- 在 `convert_message` 中构造 `AstrBotMessage.message: list[BaseMessageComponent]` 时，可继续按组件类型填充（`Plain / Image / At ...`）。
- 若适配器或插件**自定义**了类似消息组件（即自建“组件类”并希望进入 MessageChain），应遵循本次变更的字段声明方式：为固定的 `type` 字段提供显式类型注解（形如 `type: ComponentType = ...`），以降低在 Python 3.14 + 新 Pydantic BaseModel 下出现字段推断差异的概率。

## 变更影响分析
1) **运行时差异显式化**：同一套消息组件代码在不同 Python 版本上可能绑定不同的 Pydantic BaseModel（`pydantic` vs `pydantic.v1`）。AI 开发者在排查“组件字段不存在/序列化异常”时，需要把 Python 版本作为一等变量纳入判断。
2) **自定义组件的最佳实践变化**：若第三方扩展自定义 Message Components（与 Core 组件同风格的 Pydantic 模型），在 Python 3.14 环境下应优先采用“显式注解字段”的写法，尤其是 `type` 这类判别字段；仅靠无注解的类属性赋值可能导致在不同 Pydantic/运行时组合下表现不一致。
3) **RAG/工具生成代码的注意点**：面向插件作者生成示例代码时，应避免建议用户在插件侧硬依赖 `pydantic.v1.BaseModel` 来实现组件；对组件的引用应以 AstrBot 提供的 `astrbot.api.message_components`（或 Core 暴露的组件类）为准，以减少跨版本不兼容风险。
