---
category: agent
---

# Persona 集管理（插件可用）

Persona 用于控制系统提示词、开场对话、可用 tools/skills。插件侧入口：`self.context.persona_manager`。

## 快速入口

```python
pm = self.context.persona_manager
umo = event.unified_msg_origin
```

## 核心操作（高频）

### 读取

- `get_persona(persona_id: str)`：读取单个 persona。
- `get_all_personas() -> list[Persona]`：列出全部 persona。
- `get_default_persona_v3(umo: str | MessageSession | None = None) -> Personality`：读取默认 persona（按会话配置解析）。

### 新建

- `create_persona(persona_id, system_prompt, begin_dialogs=None, tools=None, skills=None, folder_id=None, sort_order=0) -> Persona`

```python
await pm.create_persona(
    persona_id="astrbot_plugin_writer",
    system_prompt="你是一个技术写作助手。",
    begin_dialogs=["你是谁？", "我是你的写作助手。"],
    tools=None,
    skills=None,
)
```

### 更新

- `update_persona(persona_id, system_prompt=None, begin_dialogs=None, tools=None, skills=None)`

```python
# 只改 prompt 时，先读旧值再回填 tools/skills，避免被重置
old = await pm.get_persona("astrbot_plugin_writer")
await pm.update_persona(
    persona_id="astrbot_plugin_writer",
    system_prompt="你是一个精炼的技术写作助手。",
    tools=old.tools,
    skills=old.skills,
)
```

### 删除

- `delete_persona(persona_id: str) -> None`

## 文件夹管理（按需）

- `create_folder / get_folder / get_folders / get_all_folders`
- `update_folder / delete_folder / get_folder_tree`
- `move_persona_to_folder / get_personas_by_folder / batch_update_sort_order`




## tips

- `create_persona` 和 `update_persona` 参数不完全一致：
  - `create` 有 `folder_id`、`sort_order`；`update` 没有。
- `tools` / `skills` 语义：`None` = 全部可用，`[]` = 全部禁用
- `begin_dialogs` 必须是偶数条
-  `_conf_schema.json`中有选择人设的配置