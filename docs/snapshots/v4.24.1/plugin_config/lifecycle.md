---
category: plugin_config
---

# 插件生命周期 (Lifecycle)

AstrBot 的插件系统基于**运行时注入**和**动态加载**机制。

### 插件结构规范

一个标准的 AstrBot 插件（Star）通常包含：
- `main.py`: 插件入口，包含继承自 `Star` 的类。
- `metadata.yaml`: 插件元数据（ID、名称、版本、作者等）。
- `_conf_schema.json`: 可选，配置 Schema。
- `requirements.txt`: 可选，依赖定义。
- `logo.png`: 可选，图标。

### 加载流程

1. **扫描**: 扫描 `data/plugins` 目录。
2. **解析**: 读取元数据。
3. **依赖校验**: 检查并提示缺失依赖。
4. **实例化**: 
    - 解析 `_conf_schema.json` 并加载配置实体 `AstrBotConfig`。
    - 实例化插件类，注入 `Context` 和 `AstrBotConfig`。
5. **注册**: 扫描 `@filter` 装饰器方法并注册到事件分发中心。

### 卸载与重载

- 调用插件实例的 `terminate()` 异步方法。
- 清除事件分发中心中该插件的所有 Handler。
- 允许在不重启 Bot 的情况下动态重载。
