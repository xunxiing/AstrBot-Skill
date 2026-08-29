---
name: skill-astrbot-dev
description: Reference + workflow notes for AstrBot plugin development (messages, platform adapters, plugin config, agent system).
metadata:
  short-description: AstrBot dev reference
---

# skill-astrbot-dev

This skill is the source-of-truth index for AstrBot developer docs in this repo (`docs/`).

Goal: when this skill is selected, immediately ground on the minimum required docs + code entrypoints,
avoid duplicated reading, and always prefer code as the final authority.

## When to use

Use this skill when you ask for help with:

- AstrBot plugin structure, decorators/hooks, lifecycle, schema, sessions
- Message model/event flow and message-chain conversion
- Platform adapter interface and message conversion patterns
- Agent topics (tools/providers/personas/subagents/sandbox/cron/context compression)

## Mandatory workflow (use this every time)

1. Start from a single entrypoint (avoid broad loading):
   - Site index: `docs/index.md`
   - Core concepts: `docs/design_standards/core_concepts.md`
2. Pick one topic folder and stay focused:
   - Agent system: `docs/agent/`
   - Plugin config: `docs/plugin_config/`
   - Messages: `docs/messages/`
   - Platform adapters: `docs/platform_adapters/`
3. For Agent Runner (v4.7.0+): `docs/agent/agent-runner.md`
4. If the user targets a specific AstrBot version, cross-check:
   - `docs/snapshots/<version>/`
5. If docs and code disagree, treat code as truth:
   - Core code lives under `astrbotcore/astrbot/core/` (read only the needed files)

## STRONGLY ADVISED: use AstrBot SDK while writing plugins

When writing plugin code, strongly advised to install AstrBot SDK locally and use it for API reference,
signature lookup, and IDE auto-completion.

```powershell
python -m pip install -U astrbot
```

Use SDK symbols first when implementing hooks, provider/context calls, and agent runner integration.
This helps reduce guesswork and signature mismatch.

If AstrBot source code in this repo is available, still treat repo code as higher priority than package docs.

## Plugin project structure (strongly advised)

A standard AstrBot plugin project should include:

- `main.py`: entrypoint. Implement plugin startup and primary features here.
- `metadata.yaml`: plugin metadata (name, version, author, repo, description).
- `README.md`: installation, usage, feature overview, and dev links.
- `.gitignore`: ignore Python cache (`__pycache__`) and IDE config files.
- `LICENSE`: open-source license file.

## `metadata.yaml` minimal template

```yaml
name: astrbot_plugin_helloworld # 插件唯一识别名，最好以 astrbot_plugin_ 前缀开头
display_name: helloworld # 展示名（v4.5.0+）
desc: AstrBot 插件示例。 # 插件简短描述
version: v1.3.0 # 版本号：v1.1.1 或 v1.1
author: Soulter # 作者
repo: https://github.com/Soulter/helloworld # 插件的仓库地址
astrbot_version: ">=4.16,<5" #声明插件要求的 AstrBot 版本范围。
```

## Code rules for plugin implementation

- Use `async def` for handlers/hooks/tool functions.
- Keep `main.py` focused on plugin entry and orchestration; extract complex logic into submodules.
- Add type hints for public methods and hook signatures.
- Do not hardcode provider IDs or secrets; expose configurable fields in `_conf_schema.json`.
- Prefer small, testable functions over large monolithic handler bodies.
- Keep README and metadata consistent with actual plugin behavior and version.
  -If you are writing AstrBot core code instead of plugins, you must submit a PR to https://github.com/AstrBotDevs/AstrBot-docs if the changes require doc updates (for instance: new hooks, new APIs, new features, platform adapter changes, and so on). If you don't see the docs repo, please remind the user to clone the docs-repo and add it to the workspace.
Ensure that a `requirements.txt` file is created in the plugin directory and populated with the necessary dependencies.
plugin i18n is recommanded ,but is still in experiment state use it carefully
It's best to keep the plugin size under 32MB.
For large resources like high-resolution images, it is best to use a CDN instead of hardcoring.
### 

## Hooks: avoid missing / outdated references

There are two different "hook" layers you must not mix up:

- Plugin event hooks (decorators): `docs/plugin_config/hooks.md`
- Agent runner hooks (`BaseAgentRunHooks`): `docs/agent/agent-related-hooks.md`

If you need a complete hook inventory (because context may be truncated), generate it locally:

```powershell
python scripts/generate_hook_inventory.py
```

This writes to `docs/.tmp/hook_inventory/` (gitignored). Use it as a scratchpad for writing/updating docs;
do not reference `.tmp` paths as public documentation URLs.

## High-signal code entrypoints (open only when needed)

- Event hooks registration + signatures: `astrbotcore/astrbot/core/star/register/star_handler.py`
- Event types: `astrbotcore/astrbot/core/star/star_handler.py`
- Agent runners + hook call order: `astrbotcore/astrbot/core/agent/runners/`
- Agent hook interface: `astrbotcore/astrbot/core/agent/hooks.py`
- Main agent build (sandbox/cron/tools): `astrbotcore/astrbot/core/astr_main_agent.py`
- Skills system (AstrBot runtime skills): `astrbotcore/astrbot/core/skills/skill_manager.py`
- Subagents config loading: `astrbotcore/astrbot/core/subagent_orchestrator.py`

## v4.5.7+ New Tool Definition Pattern

推荐使用 dataclass 模式定义 Tool（见 `docs/design_standards/core_concepts.md` 第7节）：

```python
from pydantic.dataclasses import dataclass
from astrbot.core.agent.tool import FunctionTool

@dataclass
class MyTool(FunctionTool):
    name: str = "my_tool"
    description: str = "工具描述"
    parameters: dict = {...}

    async def call(self, context, **kwargs) -> str:
        return "结果"
```

注册：`self.context.add_llm_tools(MyTool())`

装饰器方式仍然支持，但推荐新项目使用 dataclass 模式。

