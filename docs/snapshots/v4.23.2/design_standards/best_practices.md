---
category: design_standards
---

# AI 插件开发最佳实践

为了确保插件的稳定性、安全性和易用性，建议遵循以下实践方案。

### 1. 异常处理

务必捕获可能的异常，并给用户明确的反馈。

```python
try:
    # 逻辑代码
except TimeoutError:
    yield event.plain_result("⌛ 会话已超时，请重新开始。")
except Exception as e:
    logger.error(f"插件执行出错: {e}")
    yield event.plain_result(f"❌ 发生错误: {e}")
finally:
    event.stop_event() # 已经处理过错误，通常建议停止事件继续传播
```

### 2. 平台差异化

虽然 AstrBot 提供了统一模型，但在调用底层 SDK 功能（如 `call_action`）时，需进行环境检查：

```python
if event.get_platform_name() == "aiocqhttp":
    # 调用 OneBot 特有 API
    pass
```

### 3. 工具 (Tools) 开发

- 推荐使用 `agent-as-tool` 模式。
- 完善 Docstring，这直接决定了大模型对工具的理解能力。
- 尽量保持工具功能的单一性。

### 4. 资源清理

在插件卸载时，应在 `terminate()` 方法中清理定时器、数据库连接或文件句柄。
