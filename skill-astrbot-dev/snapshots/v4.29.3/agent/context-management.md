# 上下文管理（Context Management）

AstrBot 的上下文管理涵盖对话分支维护、运行时上下文压缩、请求注入和持久化历史操作。以下按插件开发者的使用链路组织：读取/创建对话 → 操作历史 → 注入上下文 → 压缩策略 → 已知限制。

---

## 1. 会话与对话分支

插件通过 `self.context.conversation_manager` 管理会话分支，会话标识统一使用 `event.unified_msg_origin`（`umo`）。

### ConversationManager 可用方法

- `new_conversation(unified_msg_origin, platform_id=None, content=None, title=None, persona_id=None) -> str`
  新建对话并将当前会话切换到该分支，返回 `conversation_id`。

- `switch_conversation(unified_msg_origin, conversation_id)`
  切换当前会话到指定的对话分支。

- `delete_conversation(unified_msg_origin, conversation_id=None)`
  删除指定对话分支；不传 `conversation_id` 时删除当前分支。

- `get_curr_conversation_id(unified_msg_origin) -> str | None`
  获取当前分支 ID。

- `get_conversation(unified_msg_origin, conversation_id, create_if_not_exists=False) -> Conversation | None`
  读取对话对象。

- `get_conversations(unified_msg_origin=None, platform_id=None) -> list[Conversation]`
  列出分支。

- `update_conversation(unified_msg_origin, conversation_id=None, history=None, title=None, persona_id=None, token_usage=None)`
  覆盖式更新历史、标题、人格等。`history` 须为 OpenAI 格式 `list[dict]`。

- `add_message_pair(cid, user_message, assistant_message)`
  向指定分支追加一组 user/assistant 消息。

- `get_human_readable_context(unified_msg_origin, conversation_id, page=1, page_size=10) -> tuple[list[str], int]`
  获取分页后的可读上下文字符串。

### Conversation 数据类字段

```python
@dataclass
class Conversation:
    platform_id: str        # 平台标识
    user_id: str            # 用户/会话标识
    cid: str                # 对话分支 ID（UUID）
    history: str            # 对话历史（JSON 字符串，OpenAI 格式）
    title: str | None       # 对话标题
    persona_id: str | None  # 关联人格 ID
    created_at: int         # 创建时间戳
    updated_at: int         # 更新时间戳
```

### 最小示例

```python
conv_mgr = self.context.conversation_manager
umo = event.unified_msg_origin

# 获取当前分支
cid = await conv_mgr.get_curr_conversation_id(umo)

# 新建分支
new_cid = await conv_mgr.new_conversation(umo, title="新分支")

# 读取历史
conv = await conv_mgr.get_conversation(umo, cid)
import json
history = json.loads(conv.history)  # list[dict]

# 追加消息对
from astrbot.core.agent.message import UserMessageSegment, AssistantMessageSegment, TextPart
user_msg = UserMessageSegment(content=[TextPart(text="你好")])
assistant_msg = AssistantMessageSegment(content=[TextPart(text="你好")])
await conv_mgr.add_message_pair(cid=cid, user_message=user_msg, assistant_message=assistant_msg)
```

---

## 2. 上下文压缩策略

AstrBot 在请求 LLM 前自动执行上下文压缩，策略由 `context_limit_reached_strategy` 决定。

### 压缩策略类型

| 策略 | 说明 |
|------|------|
| `truncate_by_turns` | 按对话轮次截断，直接丢弃最老的 `truncate_turns` 轮 |
| `llm_compress` | 使用 LLM 生成摘要，保留最近 `llm_compress_keep_recent` 条消息 |

### 配置项（`context_limit_reached_strategy` 相关）

- `max_context_length`：最大保留轮数，`-1` 不限制（**默认 50**）
- `dequeue_context_length`：触发截断时一次丢弃的轮数（**默认 10**）
- `llm_compress_instruction`：LLM 压缩时的摘要指令
- `llm_compress_keep_recent`：LLM 压缩时保留最近多少条不摘要（**默认 10**）
- `llm_compress_provider_id`：指定压缩用的 Provider ID，为空时自动回退到当前聊天 Provider

### PR #8226 影响

- **请求时上下文保护**：压缩不再修改持久化的 `run_context.messages`，仅在副本上处理。
- **默认值变更**：
  - `max_context_length`: `-1` → `50`
  - `dequeue_context_length`: `1` → `10`
  - `llm_compress_keep_recent`: `6` → `10`
- **对插件的影响**：
  - 压缩行为变化可能导致插件获取到的历史与预期不同。
  - 如果插件依赖历史内容做后续处理，建议显式传入压缩参数。

### 在 `tool_loop_agent` 中使用

```python
await self.context.tool_loop_agent(
    event=event,
    chat_provider_id=prov_id,
    prompt="...",
    enforce_max_turns=20,       # 最多保留 20 轮
    truncate_turns=2,           # 截断时丢弃 2 轮
    llm_compress_instruction="保留任务结论",
    llm_compress_keep_recent=8,
    llm_compress_provider=compress_prov,
)
```

### 获取当前 Provider ID

```python
chat_provider_id = await self.context.get_current_chat_provider_id(event.unified_msg_origin)
compress_prov = self.context.get_provider_by_id("openai/gpt-4o-mini")
```

---

## 3. 请求时上下文注入

插件可通过 `@filter.on_llm_request()` 拦截并修改 LLM 请求。

### ProviderRequest 关键属性

| 属性 | 类型 | 用途 |
|------|------|------|
| `system_prompt` | `str` | 系统提示词（请求最前） |
| `prompt` | `str \| None` | 本轮用户输入 |
| `extra_user_content_parts` | `list[ContentPart]` | 用户消息后的额外内容 |
| `contexts` | `list[dict]` | OpenAI 格式完整上下文 |

### 注入方式对比

#### 3.1 系统提示词（`system_prompt`）
- **适用**：稳定、长期有效的角色设定或全局规则
- **风险**：每轮变化的内容会破坏模型服务端提示词缓存，导致成本和首 token 延迟增加 7-20 倍

#### 3.2 动态内容（`extra_user_content_parts`）
- **适用**：每轮变化的动态上下文（时间、状态、短期记忆）
- **优势**：不影响缓存命中，追加在用户消息之后
- **临时内容**：调用 `.mark_as_temp()` 仅参与本轮请求、不持久化到历史

```python
from astrbot.core.agent.message import TextPart

@filter.on_llm_request()
async def add_dynamic_context(self, event: AstrMessageEvent, req: ProviderRequest):
    part = TextPart(text=f"<context>当前时间：{datetime.now()}</context>")
    part.mark_as_temp()  # 不写入对话历史
    req.extra_user_content_parts.append(part)
```

#### 3.3 完整上下文替换（`contexts`）
- **适用**：直接替换 OpenAI 格式的消息历史
- **风险**：较高，需谨慎维护消息结构完整性

---

## 4. JSON 消息格式

### 4.1 OpenAI 格式（Conversation.content）

```json
[
  { "role": "system", "content": "系统提示词" },
  { "role": "user", "content": "用户输入" },
  {
    "role": "assistant",
    "content": "助手回复",
    "tool_calls": [
      {
        "id": "call_xxx",
        "type": "function",
        "function": { "name": "tool_name", "arguments": "{}" }
      }
    ]
  },
  { "role": "tool", "content": "工具结果", "tool_call_id": "call_xxx" }
]
```

### 4.2 ContentPart 类型

| 类型 | 结构 | 说明 |
|------|------|------|
| `text` | `{"type": "text", "text": "..."}` | 文本内容 |
| `image_url` | `{"type": "image_url", "image_url": {"url": "..."}}` | 图片 URL（base64 或 http） |

### 4.3 完整 Message 模型

```python
class Message(BaseModel):
    role: Literal["system", "user", "assistant", "tool", "_checkpoint"]
    content: str | list[ContentPart] | CheckpointData | None
    tool_calls: list[ToolCall] | list[dict] | None = None
    tool_call_id: str | None = None
```

---

## 5. 已知限制

### 5.1 ContextManager 不可直接访问
`ContextManager` 是核心内部组件，插件**无法**直接实例化或调用。插件只能通过 `tool_loop_agent` 的参数间接控制压缩行为。

### 5.2 覆盖式更新风险
`update_conversation` 会**覆盖整个** `history` 字段，操作前需先读取完整历史，修改后再写回。容易因格式错误导致对话损坏。

### 5.3 自定义 ContentPart 不支持
`ContentPart` 注册表是核心内部的，插件**无法**注册新的 ContentPart 类型（如自定义的 `compact` 类型）。

### 5.4 精细操作缺失
`ConversationManager` 目前不提供以下操作：
- 删除单条消息
- 插入消息到指定位置
- 按条件查询消息
- 修改单条消息（必须覆盖整个 history）

### 5.5 插件可操作的范围

| 操作 | 方法 | 说明 |
|------|------|------|
| 读取历史 | `get_conversation` + `json.loads` | ✅ 支持 |
| 覆盖历史 | `update_conversation(..., history=...)` | ✅ 支持，风险高 |
| 追加消息对 | `add_message_pair` | ✅ 支持 |
| 运行时注入 | `@filter.on_llm_request()` | ✅ 支持，不持久化 |
| 自定义压缩 | `custom_compressor` 参数 | ❌ 内部预留，未暴露 |
| 精细增删改 | — | ❌ 不支持 |

---

## MUST

- 所有分支操作必须使用当前 `umo`，严禁跨会话复用 `conversation_id`。
- 更新 `history` 时必须传完整的 OpenAI 格式 `list[dict]`，确保 `tool_call_id` 等字段正确。
- 动态内容（时间、状态、记忆片段）必须使用 `extra_user_content_parts`，避免修改 `system_prompt` 破坏缓存。
- 覆盖 `history` 前务必读取原历史，避免丢失数据。
