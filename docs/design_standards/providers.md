---
category: agent
---

# Provider 选择与使用（插件可用）

Provider 是模型能力入口（Chat/STT/TTS/Embedding/**Rerank**）。

## Provider 类型

AstrBot 支持多种 Provider 类型，通过 `provider_type` 区分：

- `chat`: 对话模型（LLM/VLM）。
- `stt`: 语音转文本。
- `tts`: 文本转语音。
- `embedding`: 文本向量化。
- `rerank`: 文本重排序（用于知识库检索优化）。

```python
ctx = self.context
umo = event.unified_msg_origin
```
### 当前会话正在使用的 Provider

- `get_current_chat_provider_id(umo: str) -> str`：直接拿当前会话 chat provider id（最常用）。
- `get_using_provider(umo: str | None = None) -> Provider | None`：拿 chat provider 实例。
- `get_using_stt_provider(umo: str | None = None) -> STTProvider | None`
- `get_using_tts_provider(umo: str | None = None) -> TTSProvider | None`
- `get_using_rerank_provider(umo: str | None = None) -> RerankProvider | None` (v4.11.2+)

```python
chat_provider_id = await ctx.get_current_chat_provider_id(umo)
```

### 按 ID 读取 Provider

- `get_provider_by_id(provider_id: str)`：按 ID 获取 provider（可能是 chat/stt/tts/embedding/rerank）。

```python
prov = ctx.get_provider_by_id("your_provider_id")
```

### 列表查询（用于配置页或校验）

- `get_all_providers() -> list[Provider]`
- `get_all_stt_providers() -> list[STTProvider]`
- `get_all_tts_providers() -> list[TTSProvider]`
- `get_all_embedding_providers() -> list[EmbeddingProvider]`
- `get_all_rerank_providers() -> list[RerankProvider]` (v4.11.2+)

## Rerank Provider (v4.11.2+)

Rerank Provider 用于对检索到的文档片段进行相关性重排序，通常配合知识库工具使用。

### 核心接口

```python
class RerankProvider:
    async def rerank(
        self,
        query: str,
        documents: list[str],
        top_n: int | None = None,
    ) -> list[RerankResult]
```

- `query`: 用户查询文本。
- `documents`: 待排序的文档片段列表。
- `top_n`: 返回前 N 个最相关的文档。
- `RerankResult`: 包含 `index` (原文档索引) 和 `relevance_score` (相关性分数)。

### 配置项 (Dashboard)

新增支持 **阿里云百炼重排序** (`bailian_rerank`)，配置字段如下：

- `rerank_api_key`: API 密钥（或环境变量 `DASHSCOPE_API_KEY`）。
- `rerank_model`: 模型名称（默认 `qwen3-rerank`）。
- `top_n`: 返回排序后的 top_n 个文档（默认 5）。
- `return_documents`: 是否在结果中返回文档原文（默认 false）。
- `instruct`: 自定义排序任务说明（仅 `qwen3-rerank` 支持）。

## `_conf_schema.json` 集成

涉及 provider 选择的插件，建议在 `_conf_schema.json` 暴露配置项。

## tips

- 会话内调用必须优先传 `umo`，否则会回退到默认配置，可能拿到错误 provider。
- `get_provider_by_id` 返回的不一定是 chat provider，传给 `tool_loop_agent` 前要确保是 chat provider id。
- 不要把 provider id 硬编码在代码里，优先从 `_conf_schema.json` 配置读取。
- Rerank provider 通常由系统内部（如知识库工具）自动调用，插件一般无需直接调用 `rerank` 接口，除非实现自定义检索逻辑。

---

## 变更影响分析

1. **新 Provider 类型**: 系统现在正式支持 `RERANK` 类型的 Provider。插件开发者若实现自定义检索流程，可通过 `context.provider_manager` 获取并调用 Rerank 服务。
2. **知识库增强**: `astr_kb_search` 等官方工具现在可配置使用阿里云百炼进行重排序，提升检索精度。插件开发者无需修改代码，仅需在 Dashboard 配置即可受益。
3. **配置兼容性**: 新增配置项 `rerank_api_key` 等仅在 `provider_type="rerank"` 时生效。旧版本配置加载逻辑已兼容（通过 `manager.py` 的 case 分支处理）。
4. **接口契约**: `RerankProvider.rerank` 方法成为新的标准接口。若开发者自定义 Rerank 适配器，需实现此签名并注册 `@register_provider_adapter(..., provider_type=ProviderType.RERANK)`。