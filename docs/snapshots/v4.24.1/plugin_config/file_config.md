---
title: 插件文件配置系统 (Plugin File Config)
type: feature
status: stable
last_updated: 2024-05-22
related_base: plugin_config/schema.md
---

## 概述
AstrBot 引入了原生的文件配置支持，允许插件开发者在 `_conf_schema.json` 中定义文件类型的配置项。该系统集成了 Dashboard 文件上传、路径安全清洗及自动化存储管理，使插件能够以标准化的方式管理模型权重、静态资源或本地数据库文件。

## Schema 定义
在插件的 `_conf_schema.json` 中，可以通过以下字段定义文件配置项：
- **`type`**: 必须设置为 `"file"`。
- **`file_types`**: (可选) 字符串数组，定义允许的文件后缀名白名单（例如 `[".jpg", ".png", ".onnx"]`）。
- **`description`**: 配置项描述，将显示在 Dashboard 的上传控件旁。

## 存储与路径逻辑
1. **物理存储**: 上传的文件统一存储在 `data/plugins/<plugin_name>/files/<config_key_path>/` 目录下。其中 `<config_key_path>` 是配置项在 Schema 中的点号路径（dot-path），确保了不同配置项间的文件隔离。
2. **路径安全**: 系统通过 `sanitize_filename` 强制清洗文件名以防止路径穿越攻击，并使用 `normalize_rel_path` 确保跨平台路径的一致性。
3. **配置引用**: 存入插件 `config.json` 的值为相对于插件数据目录的规范化路径（始终以 `files/` 开头）。

## 核心校验机制
- **`validate_config`**: 在配置保存前，核心系统会强制执行校验逻辑，确保所有 `file` 类型的路径均指向合法的插件内部存储区域，并符合后缀名白名单。
- **`MAX_FILE_BYTES`**: 系统级限制上传文件大小，默认为 500MB。

## 变更影响分析
- **资源管理标准化**: 开发者不再需要手动编写文件上传接口或处理复杂的 `multipart/form-data` 逻辑，只需通过 `self.config` 即可获取已就绪的本地文件路径。
- **安全性增强**: 统一的路径清洗和校验机制消除了插件开发者自行处理文件路径时可能引入的任意文件读写漏洞。
- **AI 开发者适配**: 在为 AstrBot 编写插件 Schema 时，AI 助手应优先推荐使用 `type: "file"` 来处理外部资源依赖，而非要求用户手动填写绝对路径。注意，保存配置时必须通过 `validate_config` 校验，否则配置将无法持久化。