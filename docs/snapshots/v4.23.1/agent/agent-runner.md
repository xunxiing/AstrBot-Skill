---
category: agent
---

# Agent Runner 架构 (v4.7.0+)

Agent Runner 是 AstrBot 中用于执行 Agent 的组件。从 v4.7.0 起，Dify、Coze、阿里云百炼应用迁移到 Agent Runner 层，解决了与 AstrBot 内置 Agent 功能的冲突。

## 架构理解

- **Chat Provider**: 负责「说话」，是单轮补全接口
- **Agent Runner**: 负责「思考 + 做事」，是循环（感知 → 规划 → 执行 → 观察 → 再规划）

Dify、Coze、百炼应用、DeerFlow 等平台已内置此循环，作为 Agent Runner 接入可避免与 AstrBot 内置 Agent 冲突。

## 支持的 Agent Runner

| Runner | 说明 |
|--------|------|
| AstrBot 内置 | 默认，支持 MCP、知识库、网页搜索 |
| Dify | Dify Agent 应用 |
| Coze | Coze Bot |
| 阿里云百炼应用 | 百炼 Agent 应用 |
| DeerFlow | DeerFlow 智能体 |

## 创建 Agent Runner

WebUI → 模型提供商 → 新增提供商 → Agent 执行器 → 选择平台 → 填写配置

## 切换默认 Agent Runner

WebUI → 配置 → Agent 执行方式 → 选择执行器类型 → 保存

## 插件侧使用

```python
# 获取当前会话使用的 Agent Runner
runner = self.context.get_using_agent_runner(umo=event.unified_msg_origin)

# 或者通过 provider_id 获取
runner = self.context.get_agent_runner_by_id(runner_id="your_runner_id")
```

## 注意事项

- Agent Runner 会调用 Chat Provider 接口
- 切换 Agent Runner 后，部分 AstrBot 功能（MCP、知识库、网页搜索）可能不可用（取决于 Runner 实现）
- AstrBot 内置 Agent Runner 支持全部功能
