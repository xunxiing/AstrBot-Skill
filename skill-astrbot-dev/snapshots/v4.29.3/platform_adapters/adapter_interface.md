# Platform Adapter

平台适配器将外部消息平台接入 AstrBot。插件可注册自定义适配器。

## 注册适配器

`@register_platform_adapter(adapter_name="id", desc="描述", default_config_tmpl={"key": "value"}, adapter_display_name="显示名", logo_path="logo.png", support_streaming_message=True)`

## Platform 基类

继承 `Platform` 并实现以下方法：

### 必须实现

- `run() -> Coroutine`: 异步阻塞方法，启动客户端 SDK 并持续监听消息。
- `meta() -> PlatformMetadata`: 返回适配器元数据。
- `send_by_session(session: MessageSession, message_chain: MessageChain)`: 通过会话发送消息。

### 可选重写

- `terminate()`: 终止平台运行。
- `get_client() -> object`: 获取平台客户端对象。
- `webhook_callback(request) -> Any`: 统一 Webhook 回调入口。

### 辅助方法

- `commit_event(event: AstrMessageEvent)`: 提交事件到事件队列。
- `unified_webhook() -> bool`: 是否使用统一 Webhook 模式。
- `get_stats() -> dict`: 获取平台统计信息。
- `record_error(message: str, traceback_str: str | None)`: 记录错误。
- `clear_errors()`: 清除错误记录。

### 属性

- `config: dict`: 平台配置（用户填写的 default_config_tmpl）。
- `status: PlatformStatus`: 运行状态（PENDING/RUNNING/ERROR/STOPPED）。
- `errors: list[PlatformError]`: 错误列表。
- `last_error: PlatformError | None`: 最近错误。

## PlatformMetadata

```python
PlatformMetadata(
    name="adapter_id",           # 平台类型标识
    description="适配器描述",
    id="adapter_id",             # 唯一标识符
    default_config_tmpl={},      # 默认配置模板
    adapter_display_name="显示名", # WebUI 显示名称
    logo_path="logo.png",        # Logo 路径（相对于插件目录）
    support_streaming_message=True,  # 是否支持流式消息
    support_proactive_message=True,  # 是否支持主动消息
)
```

## AstrBotMessage

适配器必须填充以下字段：

```python
AstrBotMessage(
    type=MessageType.GROUP_MESSAGE,  # GROUP_MESSAGE / FRIEND_MESSAGE / OTHER_MESSAGE
    self_id="bot_id",                # 机器人 ID
    session_id="session_id",         # 会话 ID（决定上下文隔离）
    message_id="msg_id",             # 消息 ID
    group=Group(group_id="123"),     # 群组信息（私聊为 None）
    sender=MessageMember(user_id="uid", nickname="昵称"),
    message=[Plain(text="内容")],    # 消息链
    message_str="纯文本内容",         # 纯文本汇总
    raw_message=original_data,       # 原始平台消息
    timestamp=1234567890,            # 时间戳
)
```

### 属性

- `group_id: str`: 群组 ID（私聊返回空字符串）。

## MessageType 枚举

- `MessageType.GROUP_MESSAGE`: 群组消息
- `MessageType.FRIEND_MESSAGE`: 私聊消息
- `MessageType.OTHER_MESSAGE`: 其他消息

## MessageMember

```python
MessageMember(user_id="uid", nickname="昵称")
```

## Group

```python
Group(
    group_id="123",
    group_name="群名",
    group_avatar="头像URL",
    group_owner="群主ID",
    group_admins=["admin1", "admin2"],
    members=[MessageMember(...)],
)
```

## MessageSession

```python
MessageSession(
    platform_name="adapter_id",  # 平台 ID
    message_type=MessageType.GROUP_MESSAGE,
    session_id="session_id",
)
# 字符串格式: "platform_id:message_type:session_id"
```

### 方法

- `MessageSession.from_str(session_str)`: 从字符串解析。

## AstrMessageEvent

事件基类，平台适配器需继承并实现 `send()` 方法。

### 核心属性

- `message_str: str`: 纯文本消息。
- `message_obj: AstrBotMessage`: 完整消息对象。
- `platform_meta: PlatformMetadata`: 平台元数据。
- `session: MessageSession`: 会话对象。
- `unified_msg_origin: str`: UMO（格式: `platform_id:message_type:session_id`）。
- `session_id: str`: 会话 ID。
- `role: str`: 用户角色（"member" / "admin"）。
- `is_wake: bool`: 是否唤醒。
- `is_at_or_wake_command: bool`: 是否 At 或唤醒词。
- `call_llm: bool`: 是否调用 LLM。

### 获取信息方法

- `get_platform_name() -> str`: 获取平台类型。
- `get_platform_id() -> str`: 获取平台 ID。
- `get_message_str() -> str`: 获取消息文本。
- `get_message_outline() -> str`: 获取消息概要（图片转 `[图片]`）。
- `get_messages() -> list[BaseMessageComponent]`: 获取消息链。
- `get_message_type() -> MessageType`: 获取消息类型。
- `get_session_id() -> str`: 获取会话 ID。
- `get_group_id() -> str`: 获取群组 ID。
- `get_self_id() -> str`: 获取机器人 ID。
- `get_sender_id() -> str`: 获取发送者 ID。
- `get_sender_name() -> str`: 获取发送者昵称。
- `is_private_chat() -> bool`: 是否私聊。
- `is_wake_up() -> bool`: 是否唤醒。
- `is_admin() -> bool`: 是否管理员。

### 消息发送方法

- `send(message: MessageChain)`: 发送消息到平台。
- `send_streaming(generator: AsyncGenerator, use_fallback: bool)`: 发送流式消息。
- `react(emoji: str)`: 添加表情回应。
- `get_group(group_id: str | None) -> Group | None`: 获取群组数据。

### 结果设置方法

- `set_result(result: MessageEventResult | str)`: 设置事件结果。
- `stop_event()`: 终止事件传播。
- `continue_event()`: 继续事件传播。
- `is_stopped() -> bool`: 是否已终止。
- `should_call_llm(call_llm: bool)`: 是否调用 LLM。
- `get_result() -> MessageEventResult | None`: 获取结果。
- `clear_result()`: 清除结果。

### 快捷构建结果

- `make_result() -> MessageEventResult`: 创建空结果。
- `plain_result(text: str) -> MessageEventResult`: 文本结果。
- `image_result(url_or_path: str) -> MessageEventResult`: 图片结果。
- `chain_result(chain: list) -> MessageEventResult`: 消息链结果。

### LLM 请求

- `request_llm(prompt: str, func_tool_manager=None, tool_set=None, session_id="", image_urls=None, contexts=None, system_prompt="", conversation=None) -> ProviderRequest`: 创建 LLM 请求。

### 额外信息

- `set_extra(key, value)`: 设置额外信息。
- `get_extra(key: str | None, default=None) -> Any`: 获取额外信息。
- `clear_extra()`: 清除额外信息。

## MessageChain

消息链，用于构建和发送消息。

### 构建方法

- `message(text: str)`: 添加文本。
- `at(name: str, qq: str | int)`: 添加 At。
- `at_all()`: 添加 AtAll。
- `url_image(url: str)`: 添加网络图片。
- `file_image(path: str)`: 添加本地图片。
- `base64_image(base64_str: str)`: 添加 base64 图片。
- `use_t2i(use_t2i: bool)`: 设置是否使用文本转图片。

### 工具方法

- `get_plain_text(with_other_comps_mark: bool) -> str`: 获取纯文本。
- `squash_plain()`: 合并所有 Plain 消息段。

## MessageEventResult

继承 MessageChain，增加事件控制。

### 方法

- `stop_event()`: 终止事件传播。
- `continue_event()`: 继续事件传播。
- `is_stopped() -> bool`: 是否终止。
- `set_async_stream(stream: AsyncGenerator)`: 设置异步流。
- `set_result_content_type(typ: ResultContentType)`: 设置结果类型。
- `is_llm_result() -> bool`: 是否 LLM 结果。

## 消息组件

### Plain

`Plain(text="文本内容")`

### Image

```python
Image.fromURL("https://example.com/img.jpg")
Image.fromFileSystem("/path/to/image.jpg")
Image.fromBase64("base64_data")
Image.fromBytes(bytes_data)
```

- `convert_to_file_path() -> str`: 转换为本地路径。
- `convert_to_base64() -> str`: 转换为 base64。
- `register_to_file_service() -> str`: 注册到文件服务。

### Record

```python
Record.fromFileSystem("/path/to/audio.wav")
Record.fromURL("https://example.com/audio.wav")
Record.fromBase64("base64_data")
```

- `convert_to_file_path() -> str`: 转换为本地路径。
- `convert_to_base64() -> str`: 转换为 base64。
- `register_to_file_service() -> str`: 注册到文件服务。

### Video

```python
Video.fromFileSystem("/path/to/video.mp4")
Video.fromURL("https://example.com/video.mp4")
```

- `convert_to_file_path() -> str`: 转换为本地路径。
- `register_to_file_service() -> str`: 注册到文件服务。

### File

`File(name="文件名", file="/path/to/file", url="https://...")`

- `get_file(allow_return_url: bool) -> str`: 异步获取文件。
- `register_to_file_service() -> str`: 注册到文件服务。

### At / AtAll

```python
At(qq="user_id", name="昵称")
AtAll()
```

### Reply

`Reply(id="message_id", chain=[...], sender_id="uid", sender_nickname="昵称", time=timestamp, message_str="文本")`

### Face

`Face(id=123)`

### Node / Nodes

```python
Node(uin="qq号", name="昵称", content=[Plain("内容")])
Nodes(nodes=[Node(...), Node(...)])
```

### Forward

`Forward(id="forward_id")`

### Poke

`Poke(type="poke_type")`

### Json

`Json(data={"key": "value"})`

### WechatEmoji

`WechatEmoji(md5="md5值", md5_len=长度, cdnurl="CDN链接")`

## 完整示例

```python
from astrbot.api.platform import (
    Platform, AstrBotMessage, MessageMember, MessageType,
    PlatformMetadata, register_platform_adapter
)
from astrbot.api.event import AstrMessageEvent, MessageChain
from astrbot.core.platform.astr_message_event import MessageSesion

@register_platform_adapter("myplatform", "我的平台适配器", default_config_tmpl={
    "token": "",
    "enable": False,
})
class MyPlatformAdapter(Platform):
    def __init__(self, platform_config: dict, platform_settings: dict, event_queue: asyncio.Queue):
        super().__init__(platform_config, event_queue)
        self.settings = platform_settings

    def meta(self) -> PlatformMetadata:
        return PlatformMetadata(name="myplatform", description="我的平台", id=self.config.get("id", "myplatform"))

    async def run(self):
        async def on_message(data):
            abm = await self.convert_message(data)
            await self.handle_msg(abm)
        # 启动客户端监听...

    async def convert_message(self, data: dict) -> AstrBotMessage:
        abm = AstrBotMessage()
        abm.type = MessageType.GROUP_MESSAGE
        abm.session_id = data["session_id"]
        abm.message_id = data["message_id"]
        abm.sender = MessageMember(user_id=data["user_id"], nickname=data["nickname"])
        abm.message_str = data["content"]
        abm.message = [Plain(text=data["content"])]
        abm.raw_message = data
        return abm

    async def handle_msg(self, message: AstrBotMessage):
        event = MyPlatformEvent(
            message_str=message.message_str,
            message_obj=message,
            platform_meta=self.meta(),
            session_id=message.session_id,
            client=self.client,
        )
        self.commit_event(event)

    async def send_by_session(self, session: MessageSesion, message_chain: MessageChain):
        # 实现发送逻辑...
        await super().send_by_session(session, message_chain)

class MyPlatformEvent(AstrMessageEvent):
    def __init__(self, message_str, message_obj, platform_meta, session_id, client):
        super().__init__(message_str, message_obj, platform_meta, session_id)
        self.client = client

    async def send(self, message: MessageChain):
        for comp in message.chain:
            if isinstance(comp, Plain):
                await self.client.send_text(self.get_sender_id(), comp.text)
        await super().send(message)
```

## 注意事项

- `run()` 必须是阻塞方法，持续监听消息。
- `convert_message()` 必须正确设置 `session_id`，它决定 LLM 上下文隔离。
- `commit_event()` 用于提交事件到队列，不可遗漏。
- 事件类必须实现 `send()` 方法，并在最后调用 `await super().send(message)`。
