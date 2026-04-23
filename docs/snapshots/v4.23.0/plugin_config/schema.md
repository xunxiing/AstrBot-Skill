---
category: plugin_config
---

# 配置 Schema (`_conf_schema.json`)

AstrBot 通过 Schema 实现配置的自动解析与 WebUI 可视化渲染。

### 配置定义

在插件目录下添加 `_conf_schema.json` 文件，定义配置项的 Schema。

### 字段说明

| 字段名 | 说明 |
| :--- | :--- |
| `type` | **必填**。支持 `string`, `text`, `int`, `float`, `bool`, `object`, `list`, `dict`, `template_list` |
| `description` | 配置描述 |
| `hint` | 提示语，右侧问号图标悬浮显示 |
| `obvious_hint` | 是否醒目显示 |
| `default` | 默认值 |
| `options` | 下拉列表可选项 |
| `items` | `object` 类型的子 Schema |
| `editor_mode` | 启用代码编辑器 (Monaco Editor) |
| `editor_language` | 代码编辑器语言，默认 `json` |
| `editor_theme` | 代码编辑器主题，`vs-light` 或 `vs-dark` |
| `_special` | 调用内置数据：`select_provider`, `select_provider_tts`, `select_provider_stt`, `select_persona` |
| `invisible` | 是否隐藏，默认 `false` |

### 高级类型

- **`text`**: 多行文本输入
- **`dict`**: 键值对配置，支持 `template_schema` 定义子项
- **`template_list`**: 多组重复配置（v4.10.4+）

### `template_list` 类型

用于保存多组重复配置，如多个 API 供应商或多套人设。

```json
{
  "providers": {
    "type": "template_list",
    "description": "API 供应商列表",
    "templates": {
      "openai": {
        "name": "OpenAI",
        "items": {
          "api_key": {"description": "API Key", "type": "string", "default": "sk-xxxx"},
          "model": {"description": "模型名称", "type": "string", "default": "gpt-3.5-turbo"}
        }
      }
    }
  }
}
```

存储格式（包含 `__template_key` 字段）：

```json
{
  "providers": [
    {"__template_key": "openai", "api_key": "sk-xxxx", "model": "gpt-3.5-turbo"}
  ]
}
```

### 在插件中使用

```python
from astrbot.api import AstrBotConfig

@register("config", "Soulter", "一个配置示例", "1.0.0")
class ConfigPlugin(Star):
    def __init__(self, context: Context, config: AstrBotConfig):
        super().__init__(context)
        self.config = config
        # self.config.save_config()  # 保存配置
```

配置更新时，AstrBot 会自动添加缺失的默认值、移除不存在的配置项。
