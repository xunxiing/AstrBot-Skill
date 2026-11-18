Agent Runner 是 AstrBot 中用于执行 Agent 的组件。

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
