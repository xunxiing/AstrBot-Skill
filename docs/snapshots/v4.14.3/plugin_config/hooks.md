---
category: plugin_config
---

# 事件钩子 (Hooks)

钩子用于在 AstrBot 核心执行流程的关键节点介入。

### 核心钩子

- **`@filter.on_astrbot_loaded()`**
    - 触发：Bot 初始化完成。
- **`@filter.on_waiting_llm_request()`**
    - 触发：在获取会话锁前。适合发送“思考中...”等中间提示。
- **`@filter.on_llm_request()`**
    - 触发：LLM 请求发送前。可拦截并修改 `ProviderRequest`。
- **`@filter.on_llm_response()`**
    - 触发：LLM 请求完成后。可拦截并修改 `LLMResponse`。
- **`@filter.on_decorating_result()`**
    - 触发：结果发送前。用于消息修饰（如文转图、添加后缀）。
- **`@filter.after_message_sent()`**
    - 触发：消息成功发送至平台后。

### 限制

钩子通常不支持与指令过滤器（如 `@filter.command`）混用。
