# 指令注册 (Commands)

AstrBot 基于 `astrbot.api.event.filter` 提供一套装饰器用于注册指令和过滤消息。插件入口为 `self.context`。

---

## 基础注册

### @register
标记插件类，提供基础元数据。

> 不推荐使用，建议通过 `metadata.yaml` 配置插件元数据（更灵活且支持更多字段）。

```python
from astrbot.api.star import register, Star

@register("demo", "Author", "示例插件", "1.0.0")
class DemoPlugin(Star):
    pass
```

### @filter.command
注册指令，支持带参函数和别名。

```python
from astrbot.api.event import filter

@filter.command("hello")
async def hello(self, event: AstrMessageEvent):
    yield event.plain_result("你好！")

# 带参数
@filter.command("add")
async def add(self, event: AstrMessageEvent, a: int, b: int):
    yield event.plain_result(f"结果：{a + b}")

# 别名和优先级
@filter.command("hi", alias=["嗨", "hey"], priority=10)
async def hi(self, event: AstrMessageEvent):
    yield event.plain_result("Hi!")
```

| 参数 | 说明 |
|------|------|
| `name` | 指令名（不含前缀） |
| `alias` | 别名列表 |
| `priority` | 优先级，数值越大越高（默认 0） |

### @filter.command_group
注册指令组，子指令通过 `@组名.command` 注册。

```python
@filter.command_group("manage")
class ManageCommands:
    @manage.command("list")
    async def list_items(self, event):
        yield event.plain_result("列表")
    
    @manage.command("delete")
    async def delete_item(self, event, id: int):
        yield event.plain_result(f"删除 {id}")
```

---

## 消息过滤

过滤器遵循 **AND 逻辑**，所有条件满足时才触发。

| 装饰器 | 说明 | 参数 |
|--------|------|------|
| `@filter.event_message_type(type)` | 消息类型筛选 | `ALL`, `PRIVATE_MESSAGE`, `GROUP_MESSAGE` |
| `@filter.platform_adapter_type(type)` | 平台适配器筛选 | `AIOCQHTTP`, `TELEGRAM`, `GEWECHAT` 等 |
| `@filter.permission_type(type)` | 权限筛选 | `ADMIN`, `MEMBER` |
| `@filter.regex(pattern)` | 正则匹配内容 | 正则字符串 |

```python
@filter.command("admin")
@filter.permission_type(filter.PermissionType.ADMIN)
async def admin_cmd(self, event: AstrMessageEvent):
    yield event.plain_result("管理员专用")

@filter.command("group")
@filter.event_message_type(filter.EventMessageType.GROUP_MESSAGE)
async def group_cmd(self, event: AstrMessageEvent):
    yield event.plain_result("群聊专用")

# 多平台组合（按位或 | ）
@filter.command("multi")
@filter.platform_adapter_type(
    filter.PlatformAdapterType.AIOCQHTTP | filter.PlatformAdapterType.TELEGRAM
)
async def multi_cmd(self, event: AstrMessageEvent):
    yield event.plain_result("多平台")
```

---

## 运行时管理

Dashboard 支持动态修改指令权限和启用状态。装饰器定义的静态配置仅作为初始默认值。

| 优先级 | 来源 |
|--------|------|
| 高 | Dashboard 动态配置 `alter_cmd` |
| 低 | 装饰器静态定义 |

```
alter_cmd -> {plugin_name} -> {handler_name} -> { "permission": "admin" | "member" }
```

> **注意事项**：调试权限问题时优先检查 Dashboard 的动态配置；指令名不应包含空格。
