---
category: storage
---

# 文件存储规范

对于大文件、日志或插件特有的资源文件，AstrBot 建议遵循以下存储规范。

### 目录规范

所有插件特有的文件应存储在以下目录：
`data/plugin_data/{plugin_name}/`

### 获取存储路径

建议在插件中使用以下方式获取路径，以确保兼容性：

```python
from astrbot.core.utils.astrbot_path import get_astrbot_data_path

# 获取插件专属数据目录
plugin_data_path = get_astrbot_data_path() / "plugin_data" / self.name
plugin_data_path.mkdir(parents=True, exist_ok=True) # 确保目录存在
```

### 注意事项

- 不要将大文件直接存储在 `docs/` 或插件根目录下。
- 建议定期清理不再使用的临时文件。
