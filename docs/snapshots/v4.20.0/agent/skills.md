# Skills（能力包）
## 简介

Skill 是给 Agent 用的本地能力包：一个目录 + `SKILL.md`（可带 `scripts/`、`assets/`、参考文档）。

主 Agent 会把已启用 Skill 的名称、描述、入口文件路径注入系统提示词，让模型知道“有哪些可调用的本地能力”。

## 插件侧入口

当前没有 `self.context.skill_manager` 这类快捷入口，按需直接使用 `SkillManager`：

```python
from astrbot.core.skills.skill_manager import SkillManager
```

## SkillManager 方法

### 查询

- `list_skills(active_only: bool = False, runtime: str = "local", show_sandbox_path: bool = True) -> list[SkillInfo]`

```python
skills = SkillManager().list_skills(active_only=True, runtime="sandbox")
```

### 启停

- `set_skill_active(name: str, active: bool) -> None`

```python
SkillManager().set_skill_active("docs4agent", True)
```

### 删除

- `delete_skill(name: str) -> None`

```python
SkillManager().delete_skill("legacy_skill")
```

### 安装（zip）

- `install_skill_from_zip(zip_path: str, overwrite: bool = True) -> str`

```python
skill_name = SkillManager().install_skill_from_zip("D:/tmp/my_skill.zip", overwrite=True)
```

## Agent 注入链路

- 主 Agent 根据 `provider_settings.computer_use_runtime` 选择 runtime。
- 调用 `SkillManager().list_skills(active_only=True, runtime=runtime)` 获取技能列表。
- 调用 `build_skills_prompt(skills)` 把技能信息注入 system prompt。
- 若当前 persona 配置了 `skills` 白名单，则会再做一次过滤。

## MUST

- Skill 目录必须包含 `SKILL.md`。
- zip 安装包必须是“单一顶层目录”，且禁止绝对路径与 `..` 路径。
- skill 目录名必须匹配 `^[A-Za-z0-9._-]+$`。