# 会话控制 (Session Control)

AstrBot 提供开箱即用的会话控制功能，适用于多轮对话场景（如成语接龙、问答式交互）。

---

## 快速入口

```python
from astrbot.core.utils.session_waiter import session_waiter, SessionController
```

---

## @session_waiter

用于定义一个等待用户输入的异步函数，超时会抛出 `TimeoutError`。

| 参数 | 类型 | 说明 |
|------|------|------|
| `timeout` | float | 必填，超时时间（秒） |
| `record_history_chains` | bool | 是否记录消息历史（默认 False） |

```python
@filter.command("成语接龙")
async def idiom_game(self, event: AstrMessageEvent):
    yield event.plain_result("请发送一个成语~")
    
    @session_waiter(timeout=60)
    async def waiter(controller: SessionController, event: AstrMessageEvent):
        text = event.message_str
        
        if text == "退出":
            await event.send(event.plain_result("已退出游戏~"))
            controller.stop()  # 立即结束会话
            return
        
        if len(text) != 4:
            await event.send(event.plain_result("必须是四字成语！"))
            return  # 返回等待下一次输入
        
        # ...处理逻辑
        controller.keep(timeout=60, reset_timeout=True)  # 重置超时
    
    try:
        await waiter(event)
    except TimeoutError:
        yield event.plain_result("超时了！")
```

---

## SessionController

用于控制会话状态和获取历史消息。

### keep()
保持会话，可选择重置超时时间。

```python
controller.keep(timeout=60, reset_timeout=True)
```

- `reset_timeout=True`: 重置为新的 timeout 值（必须 > 0）
- `reset_timeout=False`: 在剩余时间基础上增加（可 < 0）

### stop()
立即终止会话。

```python
controller.stop()
```

### get_history_chains()
获取已记录的消息历史（需先设置 `record_history_chains=True`）。

```python
history = controller.get_history_chains()  # List[List[Comp.BaseMessageComponent]]
```

---

## 自定义会话隔离（SessionFilter）

默认基于 `sender_id` 识别不同会话。通过继承 `SessionFilter` 可自定义隔离范围（如按群组拦截）：

```python
from astrbot.core.utils.session_waiter import SessionFilter

class GroupFilter(SessionFilter):
    def filter(self, event: AstrMessageEvent) -> str:
        # 按群组 ID 隔离，整个群共用一个会话
        return event.get_group_id() or event.unified_msg_origin

# 使用
await waiter(event, session_filter=GroupFilter())
```

---

## 注意事项

1. 会话内必须使用 `await event.send()` 发消息，不能用 `yield`
2. 超时后会抛出 `TimeoutError`，需用 try/except 捕获
3. 不执行 `stop()` 或 `keep()` 时，函数返回后会话继续保持
4. 可用来实现群内组队功能（群级会话）
