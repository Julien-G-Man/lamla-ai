# AI Models and Capabilities

## Model Routing Overview
Keywords: ai models, model routing, providers, llm selection, which model, default model, model priority
Lamla uses a provider-priority strategy for AI generation. The current model preference order is:

1. **NVIDIA DeepSeek** (`nvidia_deepseek`)
2. **NVIDIA OpenAI-compatible** (`nvidia_openai`)
3. **Claude** (`claude`)

If the first model fails or is unavailable, Lamla automatically tries the next one.

## NVIDIA DeepSeek
Keywords: nvidia deepseek, deepseek v3.2, reasoning model, advanced reasoning, first priority
**Provider key:** `nvidia_deepseek`

**What it is best for:**
- Complex reasoning
- Structured long-form answers
- Concept-heavy educational explanations

**Configured model (default):**
- `deepseek-ai/deepseek-v3.2`

**Typical use in Lamla:**
- First-choice model for quiz generation and educational content when available

## NVIDIA OpenAI-Compatible Model
Keywords: nvidia openai, openai compatible, chatgpt, chat gpt oss, backup model, secondary model
**Provider key:** `nvidia_openai`

**What it is best for:**
- Reliable general-purpose responses
- Fast structured generation
- Robust fallback when DeepSeek is unavailable

**Configured model (default):**
- `openai/gpt-oss-20b`

**Typical use in Lamla:**
- Second-priority model for quiz, flashcard, and tutoring flows

## Claude
Keywords: claude, anthropic, fallback model, tertiary model
**Provider key:** `claude`

**What it is best for:**
- Clear explanations
- Educational tutoring tone
- Final fallback in provider chain

**Typical use in Lamla:**
- Third-priority fallback model when NVIDIA providers are unavailable

## Timeout and Reliability Behavior
Keywords: timeout, latency, provider failure, retry behavior, fallback chain
- Per-provider timeout is configured to **10 seconds**.
- If a provider fails or times out, Lamla tries the next provider in order.
- If all providers fail, the request returns an AI service error.

## Bot Guidance for Model Questions
Keywords: how model selection works, which model answered, why fallback happened
When users ask about models, the assistant should explain:
- Lamla uses a prioritized multi-model strategy for reliability.
- DeepSeek on NVIDIA is preferred for reasoning quality.
- NVIDIA OpenAI-compatible and Claude are used as fallback providers.
- Provider selection can vary per request depending on availability and response success.

## Notes for Future Expansion
Keywords: adding models, extend model list, future providers
Lamla is designed to support additional models/providers over time. New models should be documented with:
- Provider key
- Intended strengths
- Fallback position
- Operational constraints (timeouts, token limits)
