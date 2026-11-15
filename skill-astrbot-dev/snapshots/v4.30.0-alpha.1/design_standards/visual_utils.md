---
category: design_standards
---

# 视觉与渲染工具 (Visual Utils)

AstrBot 提供了一些工具函数，帮助插件实现更丰富的视觉表现，如 HTML 渲染图片。

### 1. HTML 渲染 (html_render)

AstrBot 内置了基于 **Playwright** 的 HTML 渲染引擎，支持将 HTML 字符串（支持 Jinja2 模板）或远程网页渲染为图片。

#### `await self.html_render(html_text: str = None, url: str = None, data: dict = None, options: dict = None) -> str`

- **参数**:
    - `html_text`: Jinja2 格式的 HTML 模板字符串。
    - `url`: 目标网页的 URL。如果提供了 `url`，将优先使用 `url` 而忽略 `html_text`。
    - `data`: 传入模板的变量字典（仅在提供 `html_text` 时有效）。
    - `options`: 渲染选项（映射自 Playwright API）。
        - `viewport`: 视口大小，例如 `{"width": 800, "height": 600}`。
        - `selector`: 等待并截图指定的 CSS 选择器对应的元素。
        - `wait_until`: 等待页面加载的状态。可选值：`"commit"`, `"domcontentloaded"`, `"load"`, `"networkidle"` (默认)。
        - `timeout`: 截图超时时间（毫秒）。
        - `type`: 图片格式，`"jpeg"` 或 `"png"`。
        - `quality`: 仅 JPEG 有效 (0-100)。
        - `omit_background`: 是否透明背景 (仅 PNG)。
        - `full_page`: 是否截取整页 (默认为 True，如果指定了 `selector` 则失效)。
        - `clip`: 裁切区域 `{"x": 0, "y": 0, "width": 100, "height": 100}`。
        - `animations`: `"allow"` 或 `"disabled"`。
        - `scale`: `"css"` 或 `"device"`。
- **返回值**: 渲染后的图片本地路径。

#### 使用示例

##### 渲染 HTML 模板

```python
TMPL = """
<div style="padding: 20px; background-color: #f0f0f0;">
    <h1 style="color: #333;">Hello {{ name }}!</h1>
    <p>This is rendered via AstrBot HTML Render.</p>
</div>
"""

@filter.command("hello_render")
async def hello_render(self, event: AstrMessageEvent):
    # 渲染 HTML 字符串并传入数据
    image_path = await self.html_render(html_text=TMPL, data={"name": event.get_sender_id()})
    
    # 将结果作为图片发送
    yield event.image_result(image_path)
```

##### 渲染远程网页

```python
@filter.command("screenshot")
async def screenshot(self, event: AstrMessageEvent, site_url: str):
    # 渲染指定 URL，并设置视口大小
    image_path = await self.html_render(
        url=site_url, 
        options={"viewport": {"width": 1280, "height": 720}, "wait_until": "networkidle"}
    )
    yield event.image_result(image_path)
```

#### 转换为 Image 组件

`html_render` 返回的是图片的本地路径。你可以使用 `event.image_result(path)` 快速发送，也可以手动构建 `Image` 组件：

```python
from astrbot.api.message_components import Image

image_path = await self.html_render(url="...")
image_comp = Image.fromFileSystem(image_path)

# 放入消息链发送
# yield event.chain_result([Plain("这是截图："), image_comp])
```

### 2. 文字转图片 (text_to_image)

#### `text_to_image(text: str, return_url: bool = True) -> str`

- **说明**: 简单的文字转图片工具。
- **参数**:
    - `text`: 要转换的文字内容。
    - `return_url`: 是否返回 URL 格式。
- **返回值**: 图片的路径或 URL。
