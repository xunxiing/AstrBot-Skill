---
category: agent
---

# Sandbox（插件可用）

Sandbox 是 Agent 的计算机使用运行时（shell/python/文件上传下载）。

## 快速入口

```python
ctx = self.context
umo = event.unified_msg_origin
```
## 底层方法（给 booter/工具实现使用）

- `get_booter(context, session_id)`
- `get_local_booter()`
- `booter.shell.exec(command, cwd=None, env=None, timeout=30, shell=True, background=False)`
- `booter.python.exec(code, kernel_id=None, timeout=30, silent=False)`
- `booter.upload_file(path, file_name)`
- `booter.download_file(remote_path, local_path)`
- `booter.available()`

## UMO 与当前 Sandbox 的绑定规则

- 当前会话标识使用 `event.unified_msg_origin`。
- 工具执行时用 `event.unified_msg_origin` 调用 `get_booter(...)` 获取当前会话 booter。
- `get_booter` 内部按 `session_id` 缓存：`session_booter[session_id]`。
- 若缓存实例 `available()` 为 false，会先移除再重建。
- `get_booter` 会读取 `context.get_config(umo=session_id)`，因此会话级配置可生效。

## 配置键（常用）

- `provider_settings.computer_use_runtime`: `none | local | sandbox`
- `provider_settings.sandbox.booter`: `shipyard | boxlite`
- `provider_settings.sandbox.shipyard_endpoint`
- `provider_settings.sandbox.shipyard_access_token`
- `provider_settings.sandbox.shipyard_ttl`
- `provider_settings.sandbox.shipyard_max_sessions`

## 易翻车点

- `shipyard_endpoint` 或 `shipyard_access_token` 缺失时，sandbox 工具不会注入。
- `astrbot_execute_shell` 要求 `admin` 角色，否则返回 permission denied。
- `astrbot_download_file(..., also_send_to_user=True)` 会发送后删除本地临时文件。
- `local` 与 `sandbox` 是两套运行时：`local` 走 `get_local_booter()`，`sandbox` 走 `get_booter(..., umo)`。

