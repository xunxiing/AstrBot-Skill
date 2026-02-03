---
title: Computer Use 运行时架构 (Computer Use Runtime)
type: feature
status: stable
last_updated: 2026-02-03
related_base: design_standards/architecture_overview.md
---

## 概述

AstrBot 引入了统一的 **Computer Use** 运行时模型，旨在整合原有的沙箱 (Sandbox) 和技能执行 (Skills Runtime) 逻辑。该架构定义了 Agent 如何与其执行环境交互，包括代码执行 (Python)、终端操作 (Shell) 以及第三方技能插件的加载。

## 核心配置契约

系统废弃了分散的 `sandbox.enable` 和 `skills.runtime` 配置，统一由全局配置项 `computer_use_runtime` 控制：

- **`none`**: 禁用所有执行环境。LLM 将被显式告知无法使用 Shell/Python 工具。
- **`local`**: 本地运行时。Agent 将挂载本地执行工具（如 `LOCAL_PYTHON_TOOL`, `LOCAL_EXECUTE_SHELL_TOOL`）。
- **`sandbox`**: 沙箱运行时。Agent 所有的执行操作将路由至配置的沙箱端点（如 Shipyard）。

## 逻辑链路与组件交互

### 1. 构建配置 (MainAgentBuildConfig)
`MainAgentBuildConfig` 现在承载 `computer_use_runtime` 字段，作为 Agent 构建阶段的权威数据源。该值在 `InternalAgentStage` 初始化时从系统设置中提取。

### 2. 工具挂载逻辑 (Tool Mounting)
`build_main_agent` 根据运行时类型动态挂载工具集：
- 当运行时为 `local` 时，通过 `_apply_local_env_tools` 挂载原生 Python 和 Shell 执行工具。
- 当运行时为 `sandbox` 时，通过 `_apply_sandbox_tools` 将执行请求代理至远端沙箱。

### 3. 提示词动态注入 (System Prompt Injection)
`_ensure_persona_and_skills` 方法会根据当前运行时状态调整 `system_prompt`：
- **有效运行时 (`local`/`sandbox`)**: 调用 `build_skills_prompt` 生成已加载技能的描述文档并注入 Context。
- **禁用状态 (`none`)**: 注入特定的防御性提示词，引导 LLM 在用户请求执行代码时，告知用户需在 WebUI 开启 Computer Use 功能。

## 关键类与方法签名

- `astrbot.core.astr_main_agent.build_main_agent(config: MainAgentBuildConfig)`: 负责 Agent 的实例化与工具链挂载。
- `_apply_local_env_tools(agent_context)`: 内部方法，用于注册本地执行能力的 `FunctionTool`。
- `_ensure_persona_and_skills(umo, session, request: ProviderRequest)`: 核心注入逻辑，确保 `ProviderRequest` 中的系统提示词与当前运行时环境对齐。

## 变更影响分析

- **工具可用性感知**: AI 开发者在编写技能或工具时，应意识到工具的可用性现在受 `computer_use_runtime` 强约束。如果运行时设为 `none`，即使工具已注册，也不会被挂载到 MainAgent。
- **执行环境隔离**: 所有的 Computer Use 操作现在具有统一的入口，方便未来扩展更多的 Runtime 类型（如 Docker 容器、云端运行时）。
- **安全提示机制**: LLM 获得了关于自身“能力边界”的显式上下文，这减少了 Agent 在环境未准备好时尝试生成代码导致的静默失败。 
- **API 兼容性**: `get_skills()` 等 Dashboard 接口现在返回 `computer_use_runtime` 状态，AI 客户端或前端组件应据此显示环境状态警告。