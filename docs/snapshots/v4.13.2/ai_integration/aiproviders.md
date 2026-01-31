---
category: ai_integration
---

# AI 提供商管理 (Providers)

AstrBot 支持多种 AI 能力提供商，包括大语言模型 (LLM)、语音识别 (STT)、语音合成 (TTS) 和嵌入模型 (Embedding)。

### ProviderManager

`ProviderManager` 负责管理所有已配置的服务提供商。

### 获取提供商 (Context 方法)

- `context.get_using_provider(umo: str) -> AbstractProvider`: 获取当前会话正在使用的 LLM 提供商。
- `context.get_provider_by_id(provider_id: str) -> AbstractProvider`: 根据 ID 获取指定提供商。
- `context.get_all_providers() -> List[AbstractProvider]`: 获取所有已配置的 LLM 提供商。
- `context.get_using_stt_provider(umo: str)` / `context.get_using_tts_provider(umo: str)`: 获取当前使用的语音识别/合成提供商。
- `context.get_all_stt_providers()` / `context.get_all_tts_providers()` / `context.get_all_embedding_providers()`: 获取所有对应的提供商列表。

### 提供商类型

1. **LLM**: 大语言模型，提供对话能力。
2. **STT**: 语音转文本 (Speech to Text)。
3. **TTS**: 文本转语音 (Text to Speech)。
4. **Embedding**: 向量嵌入，用于知识库搜索。
