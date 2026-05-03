# Plugin Development Workflow

## 1. Scaffold or Inspect

Expected plugin layout:

```text
astrbot_plugin_example/
├── main.py
├── metadata.yaml
├── _conf_schema.json        # optional but recommended for settings/secrets
├── requirements.txt         # optional dependencies
├── README.md
├── LICENSE                  # recommended for publishable plugins
├── .gitignore               # ignore __pycache__, venvs, IDE state, logs
└── tools/                   # optional LLM FunctionTool classes
```

Minimum `metadata.yaml` fields:

```yaml
name: astrbot_plugin_example
display_name: Example
desc: Short user-facing description.
version: v0.1.0
author: YourName
repo: https://github.com/owner/astrbot_plugin_example
```

Optional metadata: `support_platforms: [...]`, `tags: [...]`, `social_link: ...`, `astrbot_version: ">=4.5.0"`.

Before scaffolding from memory, skim the structured reference entrypoint `references/offline/xunxiing-AstrBot-Skill/docs/REFERENCE.md` and the core concept map `references/offline/xunxiing-AstrBot-Skill/docs/design_standards/core_concepts.md`.

## 2. Implement the Plugin Class

```python
from astrbot.api import logger
from astrbot.api.event import AstrMessageEvent, filter
from astrbot.api.star import Context, Star

class ExamplePlugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)

    @filter.command("hello")
    async def hello(self, event: AstrMessageEvent):
        """Say hello to the sender."""
        logger.info("hello command triggered")
        yield event.plain_result(f"Hello, {event.get_sender_name()}!")

    async def terminate(self):
        """Clean up background tasks/resources when unloaded."""
```

Rules:
- Handler methods live on the `Star` subclass and include `self` plus `event` unless the hook explicitly documents otherwise.
- Use `async def` for handlers and hooks; avoid blocking network/file calls.
- Include short docstrings for commands/tools because AstrBot surfaces them to users and agents.

## 3. Listen to Events

Common filters:
- `@filter.command("name")` for slash-style commands.
- `@filter.command_group("group")` then `@group.command("sub")` for grouped commands.
- `@filter.on_full_match(...)`, `@filter.on_prefix(...)`, `@filter.on_keyword(...)`, `@filter.on_regex(...)` for text triggers.
- `@filter.event_message_type(...)` to restrict private/group/all message types.
- `@filter.permission_type(...)` for permission-gated non-tool handlers.

Special hooks such as `on_llm_request`, `on_llm_response`, `on_decorating_result`, and `after_message_sent` should send with `await event.send(...)` instead of yielding results.

Do not mix hook layers:
- Plugin event hooks/decorators: `references/offline/xunxiing-AstrBot-Skill/docs/plugin_config/hooks.md`.
- Agent runner hooks (`BaseAgentRunHooks`): `references/offline/xunxiing-AstrBot-Skill/docs/agent/agent-related-hooks.md`.

## 4. Work With Messages

- Plain text input: `event.message_str`.
- Full message chain: `event.message_obj.message`.
- Raw platform payload: `event.message_obj.raw_message` for debugging and adapter-specific details.
- Components: import `astrbot.api.message_components as Comp` and build chains such as `Comp.Plain(...)`, `Comp.At(...)`, `Comp.Image(...)`, `Comp.Record(...)`, `Comp.Video(...)`, `Comp.Reply(...)`.

Passive replies usually yield a result:

```python
yield event.plain_result("done")
```

For richer output, return/yield message-chain results or call `event.chain_result([...])` when available in the target version. Active sends require a platform/session target; inspect existing plugin patterns or official docs before implementing.

## 5. Add Configuration

Use `_conf_schema.json` for editable plugin config. Prefer schema fields for API keys, feature toggles, limits, prompt templates, and provider/tool names. In code, read the config through the plugin/context pattern used by the target AstrBot version; never hard-code secrets or deployment-specific IDs.

Use `StarTools.get_data_dir()` for persistent plugin files. Treat the returned value as a `Path`.

## 6. Session and Conversation Control

- Use `event.unified_msg_origin` to identify the current conversation origin when working with `conversation_manager`.
- Check `platform_settings.unique_session` behavior if the plugin relies on exact session IDs.
- Use the official `SessionController` patterns for custom session grouping; avoid inventing incompatible IDs.
- For conversation history, access `self.context.conversation_manager` and await its async methods.

## 7. AI Calls and Tools

Provider calls:
- Prefer provider/context abstractions documented for the target AstrBot version.
- Pass the relevant tools if the call should use plugin/MCP tools; get the LLM tool manager from context when needed.
- Surface provider/model selection as config when users may have multiple providers.

Function tools:
- Prefer dataclass/class-based tools by subclassing `FunctionTool` and registering via `self.context.add_llm_tools(...)` on supported versions.
- For v4.5.7+ targets, cross-check the dataclass pattern in `references/offline/xunxiing-AstrBot-Skill/docs/design_standards/core_concepts.md`.
- For `@filter.llm_tool`, include a parseable docstring and typed parameters matching the documented JSON parameter schema.
- Do not combine `@filter.permission_type` with `@filter.llm_tool`; it is ineffective.

## 8. HTML-to-Image

Use AstrBot's text-to-image/HTML rendering helpers documented in the plugin guide when replies are too long or need layout. Keep templates local to the plugin, sanitize user-provided HTML/text, and provide a plain-text fallback for platforms that cannot send images.

## 9. MCP and Skill Integration Basics

- MCP tools are managed by AstrBot and can appear in the LLM tool manager; do not reimplement an MCP server inside a plugin unless the user asks.
- If a plugin depends on MCP tools, document setup commands and required environment variables in `README.md` and config schema.
- AstrBot Skills are uploaded as zipped skill folders and may execute in Local or Sandbox environments; plugins should treat them as agent capabilities, not as trusted local code.

## 10. Debug and Validate

- Log through `astrbot.api.logger`.
- During message parsing bugs, inspect both `event.message_obj.message` and `event.message_obj.raw_message`.
- Test command registration, config defaults, permission behavior, reload/unload via `terminate`, and platform-specific component support.
- Run `scripts/check_astrbot_plugin.py <plugin_dir>` for static structure checks.

When writing README/API docs for AI consumption, use `references/offline/xunxiing-AstrBot-Skill/docs4agent/REFERENCE.md`: keep docs minimal, code-first, structured, and focused on exact callable APIs.
