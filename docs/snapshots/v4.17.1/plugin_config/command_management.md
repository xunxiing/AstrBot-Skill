---
title: 动态指令管理与权限覆盖 (Dynamic Command Management)
type: feature
status: stable
last_updated: 2024-05-22
related_base: plugin_config/decorators.md
---

## 概述
AstrBot 引入了动态指令管理机制，允许在运行时通过 Dashboard 或 API 修改指令的元数据（如名称、启用状态）和执行权限。这意味着插件代码中通过装饰器（如 `@filter.permission_type`）定义的静态配置现在仅作为“初始默认值”，系统支持持久化的运行时覆盖。

## 核心逻辑与 API

### 1. 权限动态更新 (`update_command_permission`)
该服务函数负责修改特定指令的处理权限。其核心流程如下：
- **定位处理函数**：通过 `handler_full_name` 检索指令描述符。
- **持久化配置**：将权限变更写入全局 KV 存储中的 `alter_cmd` 字典。存储结构为 `alter_cmd -> {plugin_name} -> {handler_name} -> { "permission": "admin" | "member" }`。
- **运行时滤镜注入**：
    - 遍历指令关联的 `event_filters`。
    - 如果存在 `PermissionTypeFilter`，则直接更新其 `permission_type` 属性。
    - 如果不存在，则在滤镜列表首位插入一个新的 `PermissionTypeFilter` 实例。

### 2. 权限类型映射
- `admin`: 映射为 `PermissionType.ADMIN`。
- `member`: 映射为 `PermissionType.MEMBER`。

## 数据流向
1. **配置加载**：插件加载时，系统会读取 `alter_cmd` 中的持久化设置并应用到指令实例。
2. **实时生效**：通过 Dashboard 修改权限后，后端会同步更新内存中的 `handler.event_filters`，无需重启插件即可生效。

## 变更影响分析
- **权限判定优先级**：动态配置（`alter_cmd`） > 装饰器静态定义。AI 开发者在调试权限问题时，应优先检查全局配置而非仅查看源码中的 `@filter.permission_type`。
- **滤镜链可变性**：指令的 `event_filters` 列表现在是动态可变的。插件开发者不应假设滤镜列表在插件生命周期内保持不变。
- **副作用**：修改权限会直接影响 `AstrMessageEvent` 的分发逻辑。如果一个指令被动态设为 `ADMIN`，则非管理员发送的消息将在 `PermissionTypeFilter` 阶段被拦截，不会进入插件业务逻辑。