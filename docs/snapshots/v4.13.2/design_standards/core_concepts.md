# AstrBot 核心概念 API 清单

本文档仅列出 AstrBot 插件开发的核心功能 API。

### 1. 装饰器 (Decorators)

- `@register(id, author, description, version, repo_url)`: 注册插件。
- `@filter.command(name, alias, priority)`: 注册指令。支持带参函数。
- `@filter.command_group(name)`: 注册指令组。
- `@filter.event_message_type(type)`: 过滤消息类型 (`ALL`, `PRIVATE_MESSAGE`, `GROUP_MESSAGE`)。
- `@filter.platform_adapter_type(type)`: 过滤平台类型 (如 `AIOCQHTTP`, `TELEGRAM`)。
- `@filter.permission_type(type)`: 校验权限 (如 `ADMIN`)。
- `@filter.regex(pattern)`: 正则匹配。
- `@filter.llm_tool(name)`: 注册为 AI 可调用的工具。
- `@session_waiter(timeout, record_history_chains)`: 等待下一条用户消息。

### 2. 消息组件 (Message Components)

- `Plain(text)`: 纯文本。
- `At(user_id)`: 提及用户。
- `Image.fromFileSystem(path)` / `Image.fromURL(url)`: 图片。
- `Record.fromFileSystem(path)`: 语音。
- `Video.fromFileSystem(path)` / `Video.fromURL(url)`: 视频。
- `File.fromFileSystem(path, name)`: 文件。
- `Face(id)`: 系统表情。
- `Reply(message_id)`: 回复特定消息。
- `Node(uin, name, content)` / `Nodes(nodes)`: 合并转发节点 (部分平台支持)。

### 3. 核心对象与方法

**AstrMessageEvent (事件对象)**

- 消息事件对象，包含消息内容、发送者信息、群组信息等。
- 提供消息发送和结果构建方法。

**Context (核心枢纽)**

- `context.send_message(umo, chain)`: 向指定源主动发送消息。
- `context.get_platform(type)`: 获取指定类型的平台实例。
- `context.get_using_provider(umo)`: 获取当前 LLM 提供商。
- `context.add_llm_tools(*tools)`: 动态注册 AI 工具。

**MessageChain (消息链构建器)**

- `MessageChain().message(text)`: 添加文本。
- `MessageChain().file_image(path)`: 添加图片文件。
- `MessageChain().at(user_id)`: 添加 At。

### 4. 存储与工具 (Storage & Utils)

- `await self.get_kv_data(key, default)`: 获取插件隔离的 KV 数据。
- `await self.put_kv_data(key, value)`: 存储插件隔离的 KV 数据。
- `await self.delete_kv_data(key)`: 删除 KV 数据。
- `await self.html_render(html_text=None, url=None, data=None, options=None)`: 将 HTML 字符串或网页渲染为图片。基于 Playwright。
- `text_to_image(text)`: 将文字转为图片。

### 5. 系统钩子 (Hooks)

- `@filter.on_astrbot_loaded()`: Bot 加载完成。
- `@filter.on_waiting_llm_request()`: 等待 LLM 请求（获取锁前）。
- `@filter.on_llm_request()`: LLM 请求前（可修改请求体）。
- `@filter.on_llm_response()`: LLM 返回后（可修改返回体）。
- `@filter.on_decorating_result()`: 结果发送前（可进行文转图等修饰）。
- `@filter.after_message_sent()`: 消息发送成功后。

### 6. Agent 智能体

- `context.tool_loop_agent(event, chat_provider_id, prompt, tools, max_steps, tool_call_timeout, system_prompt)`: 调用 Agent 和mutiagent
