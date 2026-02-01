---
title: MainAgent 核心逻辑与请求预处理
type: refactor
status: stable
last_updated: 2024-05-22
related_base: ai_integration/agent.md
---

## 概述

AstrBot 的 LLM 请求处理逻辑已从插件层（原 `process_llm_request.py`）完全下沉至核心层的 `MainAgent`。这一重构实现了请求装饰的中心化，确保了人格（Persona）、技能（Skills）和系统安全策略在所有 LLM 调用链路中的一致性。

## 核心配置：MainAgentBuildConfig

`MainAgent` 的行为由 `MainAgentBuildConfig` 驱动，关键字段包括：

- **上下文管理**：
    - `max_context_length`: 限制上下文总长度。
    - `context_limit_reached_strategy`: 达到限制时的策略，如 `truncate_by_turns` 或 `llm_compress`。
    - `llm_compress_keep_recent`: 压缩时保留的最近轮数（默认 6）。
- **工具模式**：
    - `tool_schema_mode`: `full` 或 `skills-like`。
    - `add_cron_tools`: 是否注入定时任务工具。
- **安全策略**：
    - `llm_safety_mode`: 启用系统级安全 System Prompt 注入。

## 请求增强逻辑 (`_ensure_persona_and_skills`)

在构建 `ProviderRequest` 时，`MainAgent` 会自动执行以下增强：

1. **人格检索优先级**：
    - 优先匹配 UMO 级别的 Session 配置。
    - 其次匹配会话级 `persona_id`。
    - 最后回退至默认人格或 WebChat 特殊人格 (`_chatui_default_`)。
2. **Prompt 注入结构**：
    - **Persona Instructions**: 注入 `# Persona Instructions` 块。
    - **Begin Dialogs**: 将预设对话插入上下文头部。
    - **Skill Prompts**: 根据运行环境（Local/Sandbox）动态构建。在 `local` 模式下，自动注入 `LOCAL_EXECUTE_SHELL_TOOL` 和 `LOCAL_PYTHON_TOOL`。
3. **模板替换**：支持在 `prompt_prefix` 中使用 `{{prompt}}` 占位符进行动态替换。

## 主动式后台任务与工具执行

`FunctionToolExecutor` 经过重构，支持“主动式 Agent”反馈模式：

- **任务唤醒**：后台任务（如 Cron）触发时，不再直接发送文本，而是通过 `build_main_agent` 构建临时 Agent 实例。
- **上下文恢复**：从 `Conversation` 历史中恢复上下文并序列化注入 System Prompt，使 Agent 具备记忆。
- **反馈链路**：
    - 注入 `BACKGROUND_TASK_RESULT_WOKE_SYSTEM_PROMPT` 提示词。
    - 强制添加 `SEND_MESSAGE_TO_USER_TOOL` 工具。
    - Agent 通过 `step_until_done` 运行，利用工具调用向用户反馈执行结果，而非依赖直接输出。

## 变更影响分析

- **开发者透明化**：插件开发者无需再手动处理人格注入或技能过滤，核心层会自动根据当前会话上下文完成 `ProviderRequest` 的修饰。
- **后台任务交互性**：定时任务或异步工具现在可以像真人一样“思考”并决定如何通过 `SEND_MESSAGE_TO_USER_TOOL` 回复用户，支持更复杂的自动化场景。
- **工具命名变更**：定时任务相关工具已重命名（如 `create_cron_job` 变更为 `create_future_task`），以符合主动式任务的语意。