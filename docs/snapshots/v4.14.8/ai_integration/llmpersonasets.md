---
category: ai_integration
---

# 人格管理 (Persona)

人格（Persona）定义了大模型的系统提示词（System Prompt）、预设对话以及关联的工具。

### PersonaManager

`PersonaManager` 负责管理所有的人格设定。

### 核心操作

- `context.persona_manager.get_persona(persona_id) -> Persona`: 获取人格设定。
- `context.persona_manager.get_all_personas() -> List[Persona]`: 获取所有人格。
- `context.persona_manager.create_persona(persona_id, system_prompt, begin_dialogs=None, tools=None) -> Persona`: 创建新的人格。
- `context.persona_manager.update_persona(persona_id, system_prompt=None, begin_dialogs=None, tools=None)`: 更新人格。
- `context.persona_manager.delete_persona(persona_id)`: 删除人格。

### 配置集成

在插件配置 Schema 中，可以使用 `_special: "select_persona"` 让用户从 WebUI 下拉选择已配置的人格。
