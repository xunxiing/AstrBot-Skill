# 文转图 (Text to Image)

将文本或 HTML 模板渲染为图片。

## 插件方法（Star）

### `text_to_image`

```python
async def text_to_image(self, text: str, return_url: bool = True) -> str
```

- 内部调用：`html_renderer.render_t2i(...)`
- 使用当前激活模板：`t2i_active_template`
- `return_url=True` 返回可发送的 URL；`False` 返回本地文件路径
- **网络渲染失败会自动 fallback 到本地渲染**

```python
url = await self.text_to_image("你好，AstrBot")
yield event.image_result(url)
```

### `html_render`

```python
async def html_render(self, tmpl: str, data: dict, return_url: bool = True, options: dict | None = None) -> str
```

- 内部调用：`html_renderer.render_custom_template(...)`
- 适合自定义 HTML + Jinja2 模板渲染

```python
tmpl = """
<div style='font-size:28px'>
  <h1>{{ title }}</h1>
  <ul>{% for i in items %}<li>{{ i }}</li>{% endfor %}</ul>
</div>
"""
url = await self.html_render(tmpl, {"title": "Todo", "items": ["吃饭", "睡觉"]})
yield event.image_result(url)
```

## SDK 方法（`html_renderer`）

```python
from astrbot.api import html_renderer
```

### 初始化

```python
await html_renderer.initialize()
```

### 默认文转图

```python
await html_renderer.render_t2i(
    text: str,
    use_network: bool = True,
    return_url: bool = False,
    template_name: str | None = None,
)
```

- `use_network=True` 先走网络渲染；失败时 fallback 到本地渲染
- `return_url=False` 时返回本地路径

### 自定义模板渲染

```python
await html_renderer.render_custom_template(
    tmpl_str: str,
    tmpl_data: dict,
    return_url: bool = False,
    options: dict | None = None,
)
```

## 渲染选项（`html_render` / `render_custom_template`）

`options` 透传给截图参数（Playwright 风格）：

- `timeout`
- `type`: `"jpeg" | "png"`
- `quality`（仅 jpeg）
- `omit_background`（仅 png）
- `full_page`
- `clip`
- `animations`: `"allow" | "disabled"`
- `caret`: `"hide" | "initial"`
- `scale`: `"css" | "device"`

默认值（未传 `options` 时）：

```python
{"full_page": True, "type": "jpeg", "quality": 40}
```

## 模板管理方法

`TemplateManager` 提供模板 CRUD：

- `list_templates()`
- `get_template(name)`
- `create_template(name, content)`
- `update_template(name, content)`
- `delete_template(name)`
- `reset_default_template()`
