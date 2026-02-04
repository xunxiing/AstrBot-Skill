# 文转图 (Text to Image)

## 基本

AstrBot 支持将文字渲染成图片。

```python
@filter.command("image")  # 注册一个 /image 指令，接收 text 参数。
async def on_aiocqhttp(self, event: AstrMessageEvent, text: str):
    url = await self.text_to_image(text)  # text_to_image() 是 Star 类的一个方法。
    # path = await self.text_to_image(text, return_url = False)  # 如果你想保存图片到本地
    yield event.image_result(url)
```


AstrBot 支持使用 HTML + Jinja2 的方式来渲染文转图模板。

```python
# 自定义的 Jinja2 模板，支持 CSS
TMPL = """
<div style="font-size: 32px;">
    <h1 style="color: black">Todo List</h1>
    <ul>
        {% for item in items %}
            <li>{{ item }}</li>
        {% endfor %}
    </ul>
</div>
"""

@filter.command("todo")
async def custom_t2i_tmpl(self, event: AstrMessageEvent):
    options = {}  # 可选择传入渲染选项。
    url = await self.html_render(TMPL, {"items": ["吃饭", "睡觉", "玩原神"]}, options=options)  # 第二个参数是 Jinja2 的渲染数据
    yield event.image_result(url)
```

## 图片渲染选项

参考 Playwright 的 screenshot API。

- `timeout` (float, optional)
- `type` (Literal["jpeg", "png"], optional):
- `quality` (int, optional): 截图质量，仅适用于 JPEG
- `omit_background` (bool, optional): 是否允许隐藏默认的白色背景，这样就可以截透明图了，仅适用于 PNG 格式。
- `full_page` (bool, optional)
- `clip` (dict, optional): 截图后裁切的区域。参考 Playwright screenshot API。
- `animations`: (Literal["allow", "disabled"], optional): 是否允许播放 CSS 动画。
- `caret`: (Literal["hide", "initial"], optional): 当设置为 hide 时，截图时将隐藏文本插入符号，默认为 hide。
- `scale`: (Literal["css", "device"], optional): 页面缩放设置。

