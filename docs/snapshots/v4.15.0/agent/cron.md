---
category: agent
---

# Cron

定时执行逻辑或唤醒 AI。AI 任务触发生成 `CronMessageEvent`（继承自 AstrMessageEvent）。

通过 `self.context.cron_manager` 调用。

## 注册 Python 函数（Basic Job）

```python
await cron_mgr.add_basic_job(
    name="任务名",
    cron_expression="*/5 * * * *",
    handler=self.your_method,
    payload={"key": "value"},
    persistent=False,
    description="任务描述",
    handler_params={"extra": "data"},
    enabled=True,
)
```

- `name: str`: 任务唯一标识名
- `cron_expression: str`: 标准 cron 表达式（5 段，`分 时 日 月 周`）
- `handler: Callable`: Python 异步处理函数
- `payload: dict`: 传给 handler 的上下文数据
- `persistent: bool`: 是否持久化（重启后保留，依赖 DB）
- `description: str`: 任务描述（v4.22.2 新增）
- `handler_params: dict`: 额外参数，合并到 payload（v4.22.2 新增）
- `enabled: bool`: 是否启用（v4.22.2 新增）

## 注册 AI 唤醒（Active Agent Job）

```python
await cron_mgr.add_active_job(
    name="AI 定时任务",
    cron_expression="0 8 * * *",
    payload={"session": "UMO", "note": "指令"},
    run_once=False,
    description="每日早报",
)
```

- `name: str`: 任务唯一标识名
- `cron_expression: str`: 标准 cron 表达式
- `payload: dict`: 包含 `session`（UMO）、`note`（唤醒指令）
- `run_once: bool`: 是否只执行一次
- `description: str`: 任务描述（v4.22.2 新增）

## 维护方法

- `delete_job(job_id: str)`: 删除任务
- `list_jobs(job_type: str = None) -> list[CronJob]`: 列出任务（可选过滤 basic/active）
- `update_job(job_id: str, **kwargs) -> CronJob | None`: 更新任务（只支持部分字段）
