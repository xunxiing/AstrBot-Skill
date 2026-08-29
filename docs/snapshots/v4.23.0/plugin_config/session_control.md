---
category: plugin_config
---

# 会话控制 (Session Control)

`session_waiter` 是实现多轮对话状态机的核心机制，常用于问答、验证或连续操作。

### 核心装饰器

- **`@session_waiter(timeout: float, record_history_chains: bool = False)`**
    - 用于定义一个等待用户进一步输入的异步函数。
    - 超时会抛出 `TimeoutError`。

### SessionController 接口

Waiter 函数通常接收一个 `controller: SessionController` 参数：

- `keep(timeout, reset_timeout)`: 保持会话拦截。`reset_timeout=True` 将重置计时。
- `stop()`: 立即终止拦截，恢复正常消息分发。
- `get_history_chains()`: 获取拦截期间的消息历史。

### SessionFilter (自定义会话隔离)

通过继承 `SessionFilter` 并重写 `filter` 方法，可以自定义拦截的范围（如按群组拦截）：

```python
class GroupFilter(SessionFilter):
    def filter(self, event: AstrMessageEvent) -> str:
        return event.get_group_id() or event.unified_msg_origin
```
