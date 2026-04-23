---
category: agent
---
# AstrBot 官方 Tool 列表

 AstrBot Core 内置工具

## Computer Use

- `astrbot_execute_shell`（`computer_use_runtime=sandbox|local`）：执行 Shell 命令。
  - 示例参数：`{"command":"pwd","background":false}`
- `astrbot_execute_ipython`（`computer_use_runtime=sandbox`）：在沙盒 IPython 执行代码。
  - 示例参数：`{"code":"print(1+1)","silent":false}`
- `astrbot_execute_python`（`computer_use_runtime=local`）：在本地 Python 执行代码（仅管理员）。
  - 示例参数：`{"code":"print(1+1)","silent":false}`
- `astrbot_upload_file`（`computer_use_runtime=sandbox`）：上传本地文件到沙盒。
  - 示例参数：`{"local_path":"C:/tmp/a.txt"}`
- `astrbot_download_file`（`computer_use_runtime=sandbox`）：从沙盒下载文件。
  - 示例参数：`{"remote_path":"/workspace/out.txt","also_send_to_user":true}`

## Knowledge Base

- `astr_kb_search`（`kb_agentic_mode=true`）：检索知识库内容。
  - 示例参数：`{"query":"AstrBot provider isolation"}`

## Cron / Proactive Task

- `create_future_task`（`add_cron_tools=true`）：创建未来任务（周期或一次性）。
  - 示例参数：`{"note":"明早提醒我同步日报","cron_expression":"0 9 * * *"}`
- `delete_future_task`（`add_cron_tools=true`）：删除未来任务。
  - 示例参数：`{"job_id":"cron_xxx"}`
- `list_future_tasks`（`add_cron_tools=true`）：列出未来任务。
  - 示例参数：`{"job_type":"active_agent"}`

## Proactive Message

- `send_message_to_user`（平台支持主动消息时注入）：主动向用户发送消息。
  - 示例参数：`{"messages":[{"type":"plain","text":"任务已完成"}]}`

## Dynamic Handoff Tool

- `transfer_to_<agent_name>`（`subagent_orchestrator.main_enable=true`）：将任务移交给子智能体。
  - 示例参数：`{"input":"请处理这段文本并给出结构化结论"}`
