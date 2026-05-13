# Persona 管理与解析指南

`PersonaManager` 负责加载、缓存并提供所有人格的 CRUD 接口，兼容 AstrBot 4.x 前的 v3 格式。插件入口：

```python
pm = self.context.persona_manager
conv_mgr = self.context.conversation_manager
umo = event.unified_msg_origin
```

---

## 核心操作

### 1. 读取
* **`get_persona(persona_id: str) -> Persona`**
  * 异常：不存在抛 `ValueError`
* **`get_all_personas() -> list[Persona]`**

### 2. 新建
* **`create_persona(persona_id, system_prompt, begin_dialogs=None, tools=None, skills=None, folder_id=None, sort_order=0) -> Persona`**
  * `begin_dialogs`: 必为偶数条（user/assistant 交替）。
  * `tools` / `skills`: `None` = 全部可用，`[]` = 全部禁用。
  * 异常：ID 已存在抛 `ValueError`

```python
await pm.create_persona(
    persona_id="astrbot_plugin_writer",
    system_prompt="你是一个技术写作助手。",
    begin_dialogs=["你是谁？", "我是你的写作助手。"]
)
```

### 3. 更新
* **`update_persona(persona_id, system_prompt=None, begin_dialogs=None, tools=None, skills=None) -> Persona`**
  * 注意：无 `folder_id` 与 `sort_order` 参数。若仅改 prompt，需先读旧值回填 tools/skills，避免被重置为默认。
  * 异常：ID 不存在抛 `ValueError`

```python
old = await pm.get_persona("astrbot_plugin_writer")
await pm.update_persona(
    persona_id="astrbot_plugin_writer",
    system_prompt="你是一个精炼的技术写作助手。",
    tools=old.tools,
    skills=old.skills,
)
```

### 4. 删除
* **`delete_persona(persona_id: str) -> None`**
  * 异常：ID 不存在抛 `ValueError`

---

## 文件夹管理（core）

* **查询**：`get_folder`, `get_folders`, `get_all_folders`, `get_folder_tree`, `get_personas_by_folder`
* **修改**：`create_folder`, `update_folder`, `delete_folder`
* **排序与移动**：`move_persona_to_folder`, `batch_update_sort_order`

---

## 人格解析与优先级

系统按以下顺序解析，**命中即停止**：
1. **会话级**：`session_service_config.persona_id`（`umo` 作用域）
2. **对话分支级**：`conversation.persona_id`
3. **全局默认**：`provider_settings.default_personality`

### 1. 设置会话级 Persona
读写 `session_service_config` 必须**先读后写**，避免覆盖同键下的 `llm_enabled` / `tts_enabled`：

```python
from astrbot.api import sp

cfg = await sp.get_async(scope="umo", scope_id=umo, key="session_service_config", default={}) or {}
cfg["persona_id"] = "assistant_default"
await sp.put_async(scope="umo", scope_id=umo, key="session_service_config", value=cfg)
```

### 2. 设置对话分支级 Persona

```python
cid = await conv_mgr.get_curr_conversation_id(umo)
await conv_mgr.update_conversation(umo, conversation_id=cid, persona_id="assistant_default")
```

### 3. 显式禁用人格注入
支持会话级或分支级：

```python
await conv_mgr.update_conversation(umo, conversation_id=cid, persona_id="[%None]")
```

### 4. 获取默认人格
* **`get_default_persona_v3(umo: str | MessageSession | None = None) -> Personality`**
  * 解析会话配置并返回 v3 人格对象。未指定或不存在则回退至 `DEFAULT_PERSONALITY`。

---

## 运行时机制与注意项

* **注入逻辑**：命中后，`persona.prompt` 注入为系统提示词；`_begin_dialogs_processed` 注入为上下文前置消息。
* **Webchat 回退机制**：若未命中 persona 且不为 `"[%None]"`，会自动追加 ChatUI 的默认人格提示词。
* **会话隔离**：必须使用当前 `umo` 操作，严禁跨会话复用 `conversation_id`。
* **UI 暴露**：可通过插件的 `_conf_schema.json` 暴露人设选择配置项。