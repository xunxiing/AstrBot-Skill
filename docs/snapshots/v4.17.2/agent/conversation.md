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