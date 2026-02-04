---
name: skill-astrbot-dev
description: Reference + workflow notes for AstrBot plugin development (messages, platform adapters, plugin config, AI integration).
metadata:
  short-description: AstrBot dev reference
---

# skill-astrbot-dev

This skill provides a compact reference set for developing AstrBot plugins and integrations.

## When to use

Use this skill when you ask for help with:
- AstrBot plugin structure, decorators/hooks, lifecycle, schema, sessions
- Message model/event flow and message-chain conversion
- Platform adapter interface and message conversion patterns
- AI integration topics (agents/tools/providers/persona sets)

## Quick entry points

- Overview: `index.md`
- Plugin config: `plugin_config/`
- Messages: `messages/`
- Platform adapters: `platform_adapters/`
- AI integration: `ai_integration/`
- Storage utilities: `Storage & Utils/`
- Version snapshots: `snapshots/`

## How I will use these docs

When you ask a question, I will:
1. Pick the most relevant entry point above.
2. Cross-reference any snapshot under `snapshots/` if you specify a target AstrBot version.
3. Provide implementation guidance consistent with the referenced docs.
