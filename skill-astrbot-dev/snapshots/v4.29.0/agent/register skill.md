---
category: agent
---

# Skills（随插件提供）

插件可以在自己的目录下提供 `skills/` 文件夹。AstrBot 加载插件后会自动把其中合法的 Skill 纳入 Skill Manager，来源会显示为对应插件。

## 目录结构

插件包含多个 Skill：

```
your_plugin/
  metadata.yaml
  main.py
  skills/
    web-search-helper/
      SKILL.md
    report-writer/
      SKILL.md
```

如果 `skills/` 本身就是一个 Skill：

```
your_plugin/
  skills/
    SKILL.md
```

AstrBot 自动发现合法的 Skill（包含 `SKILL.md`），并将其注册到 Skill Manager。
