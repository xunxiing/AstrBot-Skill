---
title: Agent 沙箱资源解析机制
type: improvement
status: stable
last_updated: 2024-05-22
related_base: ai_integration/main_agent_logic.md
---

## 概述
AstrBot 增强了 `SendMessageToUserTool` 的资源处理能力，支持自动解析并传输存储在沙箱（Sandbox）环境中的文件。这使得 Agent 在执行代码或生成文件后，能够直接通过路径引用并发送给用户，而无需开发者手动处理跨环境的文件同步。

## 核心逻辑：_resolve_path_from_sandbox
当 Agent 调用发送工具并提供 `path` 参数时，系统执行以下自动化解析流程：

1. **本地优先检查**：首先尝试在宿主机本地文件系统查找路径。若存在，直接使用。
2. **沙箱透明回退**：若本地不存在，系统通过 `get_booter` 获取当前会话关联的沙箱实例（如 Docker 或远程执行环境）。
3. **自动拉取 (Download)**：系统通过沙箱 Shell 校验文件存在性，并将其下载至 `get_astrbot_temp_path()` 指定的本地临时目录。
4. **组件构建**：使用解析后的本地路径构建 `Image`, `Record` 或 `File` 等 `MessageComponent`。
5. **生命周期管理**：消息发送完成后，系统会自动触发 `os.remove` 删除临时文件，确保宿主机存储不被泄露或堆积。

## 变更影响分析

- **跨环境透明性**：AI 开发者在编写 Prompt 或设计 Multi-Agent 协作逻辑时，可以统一使用绝对路径引用沙箱内的生成物（如 `/tmp/chart.png`），核心层会自动处理“沙箱 -> 宿主机 -> 消息平台”的数据流转。
- **解耦存储细节**：插件和 Agent 无需感知文件是存储在本地还是远程沙箱，`SendMessageToUserTool` 承担了资源代理（Proxy）的角色。
- **边界情况**：
    - **I/O 延迟**：发送大文件时会产生“沙箱下载”的额外耗时，可能触发平台发送超时。
    - **清理机制**：临时文件仅在 `file_from_sandbox` 为真时删除，本地原有文件不受影响。
- **最佳实践**：在沙箱工具（如 Python 解释器）生成结果后，应引导 Agent 立即调用 `send_message_to_user` 并传入沙箱内路径，以利用系统的自动清理和传输机制。