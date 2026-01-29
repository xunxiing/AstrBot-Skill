---
category: ai_integration
---

# 会话管理 (Conversation)

`ConversationManager` 负责维护 LLM 对话上下文及历史记录。

### 核心操作

- `new_conversation(umo, content=None, title=None, persona_id=None) -> str`: 在当前会话下新建一条对话分支，返回 UUID。
- `switch_conversation(umo, conversation_id)`: 切换当前会话的活动对话分支。
- `delete_conversation(umo, conversation_id=None)`: 删除对话分支。
- `get_curr_conversation_id(umo) -> str | None`: 获取当前正在使用的对话 ID。
- `get_conversation(umo, conversation_id, create_if_not_exists=False) -> Conversation`: 获取对话对象。
- `get_conversations(umo=None, platform_id=None) -> List[Conversation]`: 获取对话列表。
- `update_conversation(umo, conversation_id, history=None, title=None, persona_id=None)`: 更新对话元数据或历史。
- `get_human_readable_context(umo, conversation_id, page=1, page_size=10)`: 分页获取可读的对话上下文。

### 常用工具

- `add_message_pair(cid, user_msg, assistant_msg)`: 快速向指定对话 ID 同步一对对话记录。
