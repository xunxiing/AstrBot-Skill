---
title: Agent 沙箱与代码执行 (Sandbox Architecture)
type: feature
status: stable
last_updated: 2024-12-20
related_base: ai_integration/agent.md
---

## 概述

AstrBot 引入了核心级的沙箱架构 (Sandbox Architecture)，取代了原有的插件式 Python 解释器。该架构允许 AI Agent 在隔离的环境中执行代码、操作文件和运行 Shell 命令。沙箱能力通过 `InternalAgentStage` 自动注入到 LLM 请求流中，无需用户手动触发。

## 核心机制：InternalAgentStage 注入

沙箱能力的开启由 `InternalAgentStage` 阶段控制。当全局配置 `sandbox.enable` 为真时，系统会在构建 `ProviderRequest` 时执行以下逻辑：

1. **工具集注入**：向 `req.func_tool` (ToolSet) 强制注册以下核心工具：
    - `PYTHON_TOOL`: 执行 Python 代码并返回输出（支持 iPython 渲染）。
    - `EXECUTE_SHELL_TOOL`: 执行标准 Shell 命令。
    - `FILE_UPLOAD_TOOL`: 将本地文件上传至沙箱环境。
    - `FILE_DOWNLOAD_TOOL`: 从沙箱环境下载生成的文件。
2. **提示词增强**：向 `system_prompt` 追加 `SANDBOX_MODE_PROMPT`，指导 LLM 如何在沙箱中引用文件路径和处理逻辑。
3. **多模态上下文关联**：当消息包含 `Image` 或 `File` 组件时，系统会自动向 `req.extra_user_content_parts` 注入附件的本地绝对路径元数据，使 LLM 能够通过沙箱工具直接处理这些文件。

## 沙箱驱动配置 (Sandbox Drivers)

目前主要支持 `shipyard` 驱动，其配置项位于 `provider_settings.sandbox`：

- `booter`: 驱动类型（当前固定为 `shipyard`）。
- `shipyard_endpoint`: 远程沙箱服务地址。
- `shipyard_access_token`: 鉴权令牌。
- `shipyard_ttl`: 沙箱会话存活时间。
- `shipyard_max_sessions`: 最大并发会话数。

## 数据流向

1. **输入**：`AstrMessageEvent` 携带附件（图片/文件）。
2. **预处理**：`InternalAgentStage` 识别附件并记录本地路径。
3. **请求构建**：注入沙箱工具定义 + 路径元数据 -> `ProviderRequest`。
4. **LLM 决策**：LLM 决定调用 `PYTHON_TOOL` 处理特定路径的文件。
5. **执行**：`ShipyardSandboxClient` 调用远程 API 执行代码。
6. **反馈**：执行结果（文本/图片）返回给 LLM 或直接装饰到最终结果中。

## 变更影响分析

- **对 AI 消费者的影响**：AI 现在拥有了“感知本地文件路径”的能力。在编写 Prompt 或工具调用逻辑时，AI 不再需要猜测文件位置，而是可以直接引用系统注入的路径标识。
- **边界情况**：若沙箱连接失败或 `shipyard_access_token` 无效，`InternalAgentStage` 会捕获异常并回退到无沙箱模式，但 LLM 可能会因为工具缺失而产生幻觉。
- **最佳实践**：开发者在开发涉及文件处理的插件时，应优先依赖核心沙箱工具而非自行实现本地执行逻辑，以确保环境隔离和安全性。