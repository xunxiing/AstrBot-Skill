---
category: agent
---

# 会话与对话分支（Conversation）

插件侧通过 `self.context.conversation_manager` 管理会话分支；会话标识使用 `event.unified_msg_origin`（`umo`）。

## 插件可用入口

```python
conv_mgr = self.context.conversation_manager
umo = event.unified_msg_origin
```

## ConversationManager 可用方法

- `register_on_session_deleted(callback: Callable[[str], Awaitable[None]]) -> None`：注册会话删除后的级联清理回调。
- `new_conversation(unified_msg_origin: str, platform_id: str | None = None, content: list[dict] | None = None, title: str | None = None, persona_id: str | None = None) -> str`：新建分支并切换为当前分支。
- `switch_conversation(unified_msg_origin: str, conversation_id: str) -> None`：切换当前分支。
- `delete_conversation(unified_msg_origin: str, conversation_id: str | None = None) -> None`：删除指定分支；不传 `conversation_id` 时删除当前分支。
- `delete_conversations_by_user_id(unified_msg_origin: str) -> None`：删除该会话下全部分支。
- `get_curr_conversation_id(unified_msg_origin: str) -> str | None`：读取当前分支 ID。
- `get_conversation(unified_msg_origin: str, conversation_id: str, create_if_not_exists: bool = False) -> Conversation | None`：读取分支对象。
- `get_conversations(unified_msg_origin: str | None = None, platform_id: str | None = None) -> list[Conversation]`：列出分支。
- `get_filtered_conversations(page: int = 1, page_size: int = 20, platform_ids: list[str] | None = None, search_query: str = "", **kwargs) -> tuple[list[Conversation], int]`：分页 + 条件过滤。
- `update_conversation(unified_msg_origin: str, conversation_id: str | None = None, history: list[dict] | None = None, title: str | None = None, persona_id: str | None = None, token_usage: int | None = None) -> None`：更新历史/标题/persona/token_usage。
- `add_message_pair(cid: str, user_message: UserMessageSegment | dict, assistant_message: AssistantMessageSegment | dict) -> None`：向指定分支追加一组 user/assistant 消息。
- `get_human_readable_context(unified_msg_origin: str, conversation_id: str, page: int = 1, page_size: int = 10) -> tuple[list[str], int]`：获取分页后的可读上下文。

## 最小示例

```python
cid = await self.context.conversation_manager.get_curr_conversation_id(event.unified_msg_origin)
```

```python
cid = await self.context.conversation_manager.new_conversation(event.unified_msg_origin, title="新分支")
```

```python
await self.context.conversation_manager.update_conversation(event.unified_msg_origin, conversation_id=cid, title="重命名", persona_id="assistant_default")
```

```python
contexts, total_pages = await self.context.conversation_manager.get_human_readable_context(event.unified_msg_origin, cid, page=1, page_size=10)
```

## MUST

- 所有分支操作必须使用当前会话的 `umo`，不要跨会话复用 `conversation_id`。
- 更新历史时必须传 OpenAI 风格 `list[dict]` 消息结构。

---

## LLM 请求提示词注入

通过 `@filter.on_llm_request()` 拦截并修改 LLM 请求。

```python
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.api.provider import ProviderRequest

@filter.on_llm_request()
async def on_req(self, event: AstrMessageEvent, req: ProviderRequest):
    # 修改系统提示词（仅稳定内容）
    req.system_prompt += "\n\n[全局规则] 回答必须简洁。"
```

### ProviderRequest 关键属性

| 属性 | 类型 | 用途 |
|------|------|------|
| `system_prompt` | `str` | 系统提示词（请求最前） |
| `prompt` | `str \| None` | 本轮用户输入 |
| `extra_user_content_parts` | `list[ContentPart]` | 用户消息后的额外内容 |
| `contexts` | `list[dict]` | OpenAI 格式完整上下文 |

### 1. 系统提示词（system_prompt）

* **`system_prompt += ...`**
  * 适合追加**稳定、长期有效**的角色设定或全局规则。
  * **警告**：每轮变化的内容（时间、好感度、记忆片段）会破坏模型服务端提示词缓存，导致成本和首 token 延迟增加 7-20 倍。

### 2. 动态内容（extra_user_content_parts）

* **`req.extra_user_content_parts.append(...)`**
  * 适合追加每轮变化的**动态上下文**（当前时间、状态面板、短期记忆）。
  * 追加在用户消息之后，**不影响缓存命中**。
  * 仅参与本轮请求、不持久化到历史：调用 `.mark_as_temp()`（`>= v4.24.0`）。

```python
from astrbot.core.agent.message import TextPart

@filter.on_llm_request()
async def add_dynamic_context(self, event: AstrMessageEvent, req: ProviderRequest):
    part = TextPart(
        text=(
            "<context>\n"
            f"当前时间：{datetime.now()}\n"
            "好感度：72\n"
            "</context>"
        )
    )
    part.mark_as_temp()  # 不写入对话历史
    req.extra_user_content_parts.append(part)
```

### 3. 完整上下文替换（contexts）

* **`req.contexts = [...]`**
  * 直接替换 OpenAI 格式的消息历史。
  * 风险较高，需谨慎维护消息结构完整性。