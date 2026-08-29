# 配置 Schema (`_conf_schema.json`)

AstrBot 通过 Schema 实现配置的自动解析与 WebUI 可视化。在插件目录添加 `_conf_schema.json` 文件定义配置结构。

---

## 基础字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | **必填** | `string`, `text`, `int`, `float`, `bool`, `object`, `list`, `dict`, `template_list`, `file` |
| `description` | string | 配置描述 |
| `hint` | string | 悬浮提示 |
| `obvious_hint` | bool | 是否显眼显示 hint |
| `default` | 任意 | 默认值 |
| `options` | list | 下拉选项列表 |
| `invisible` | bool | 是否隐藏（默认 false） |

---

## 特殊类型

### text
多行文本输入，可拖拽调整高度。

### dict
键值对编辑，支持 `template_schema` 定义子项：

```json
{
  "custom_params": {
    "type": "dict",
    "description": "自定义参数",
    "template_schema": {
      "temperature": {
        "type": "float",
        "default": 0.6,
        "slider": {"min": 0, "max": 2, "step": 0.1}
      }
    }
  }
}
```

### template_list
多组重复配置（v4.10.4+）：

```json
{
  "providers": {
    "type": "template_list",
    "description": "API 供应商列表",
    "templates": {
      "openai": {
        "name": "OpenAI",
        "items": {
          "api_key": {"type": "string", "default": "sk-xxxx"},
          "model": {"type": "string", "default": "gpt-4"}
        }
      }
    }
  }
}
```

存储格式（带 `__template_key` 标识）：

```json
{
  "providers": [
    {"__template_key": "openai", "api_key": "sk-xxx", "model": "gpt-4"}
  ]
}
```

### file
文件上传（v4.13.0+）：

```json
{
  "uploads": {
    "type": "file",
    "description": "上传文件",
    "file_types": [".pdf", ".docx"],
    "default": []
  }
}
```

文件存储位置：`data/plugins/<plugin_name>/files/<config_key>/`

---

## 内置选择器

通过 `_special` 字段调用 AstrBot 内置的数据选择（v4.0.0+）：

| 值 | 返回类型 | 说明 |
|-----|---------|------|
| `select_provider` | string | 选择模型提供商 |
| `select_provider_tts` | string | 选择 TTS 提供商 |
| `select_provider_stt` | string | 选择 STT 提供商 |
| `select_persona` | string | 选择人格 |
| `select_knowledgebase` | list | 选择知识库（多选） |

示例：

```json
{
  "model": {
    "type": "string",
    "description": "默认模型",
    "_special": "select_provider"
  },
  "persona": {
    "type": "string",
    "description": "使用的人格",
    "_special": "select_persona"
  },
  "kb_list": {
    "type": "list",
    "description": "知识库列表",
    "_special": "select_knowledgebase",
    "default": []
  }
}
```

---

## 在插件中使用

```python
from astrbot.api import AstrBotConfig

class MyPlugin(Star):
    def __init__(self, context: Context, config: AstrBotConfig):
        super().__init__(context)
        self.config = config
        
        # 读取配置
        api_key = self.config.get("api_key")
        
        # 保存配置（修改后调用）
        # self.config.save_config()
```

---

## 配置更新机制

- 自动添加缺失的默认值
- 自动移除 Schema 中不存在的配置项
- 更新 `_conf_schema.json` 后重载插件生效
