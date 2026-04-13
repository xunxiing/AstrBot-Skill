
Cron是用于通过定时任务执行逻辑或唤醒AI的功能。AI 任务触发会生成 `CronMessageEvent`识别并拦截由定时任务触发的 AI 回复
## 插件开发 API
通过 `self.context.cron_manager` 调用：
### 1. 注册Python函数
```python
await cron_mgr.add_basic_job(name="任务名", cron_expression="*/5 * * * *", handler=self.your_method, payload={"key": "value"}, persistent=False)
```
### 2.注册AI唤醒
```python
await cron_mgr.add_active_job(name="AI 任务", cron_expression="0 8 * * *", payload={"session": "UMO", "note": "指令"}, run_once=False)
```
### 3. 维护方法
- `delete_job(job_id: str)`: 删除
- `list_jobs(job_type: str = None)`: 列表
- `update_job(job_id: str, **kwargs)`: 更新
