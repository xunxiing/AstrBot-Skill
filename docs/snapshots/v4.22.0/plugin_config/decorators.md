---
category: plugin_config
---

# 常用装饰器 (Decorators)

AstrBot 提供了一系列基于 `astrbot.api.event.filter` 的装饰器，用于注册插件和控制消息处理逻辑。

### 注册装饰器

- **`@register(id, author, description, version, repo_url)`**
    - 标记插件类，提供基础元数据（若存在 `metadata.yaml` 则优先级较低）。

### 消息过滤器装饰器

过滤器遵循 **AND 逻辑**，即所有条件均满足时才触发。

| 装饰器 | 参数说明 |
| :--- | :--- |
| `@filter.command(name, alias, priority)` | 注册指令。支持带参函数，如 `def add(self, event, a: int, b: int)`。 |
| `@filter.command_group(name)` | 注册指令组。子指令通过 `@组名.command` 注册。 |
| `@filter.event_message_type(type)` | 过滤消息来源类型（`ALL`, `PRIVATE_MESSAGE`, `GROUP_MESSAGE`）。 |
| `@filter.platform_adapter_type(type)` | 过滤平台类型（`AIOCQHTTP`, `TELEGRAM` 等）。支持按位或 `|`。 |
| `@filter.permission_type(type)` | 校验权限（如 `ADMIN`）。 |
| `@filter.regex(pattern)` | 正则表达式匹配。 |

### 注意事项

- 指令名不应包含空格。
- 优先级 `priority` 默认为 0，数值越大优先级越高。
