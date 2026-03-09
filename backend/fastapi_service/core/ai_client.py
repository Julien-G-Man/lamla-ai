import os
import json
import logging
from typing import List, Optional, Union
import httpx
import anthropic

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 10
DEFAULT_PROVIDER_ORDER = ["nvidia_deepseek", "nvidia_openai", "claude"]


class APIIntegrationError(Exception):
    """Raised when all AI providers fail or a configured provider fails fatally."""
    pass


def _extract_json_substring(text: str):
    if not text or not isinstance(text, str):
        return None
    text = text.strip()
    if text.startswith('{') or text.startswith('['):
        try:
            return json.loads(text)
        except Exception:
            pass

    first_brace = min(
        [idx for idx in (text.find('{'), text.find('[')) if idx != -1],
        default=-1
    )
    if first_brace == -1:
        return None

    opening = text[first_brace]
    closing = '}' if opening == '{' else ']'
    last_close = text.rfind(closing)
    if last_close == -1 or last_close <= first_brace:
        return None

    candidate = text[first_brace:last_close + 1]
    try:
        return json.loads(candidate)
    except Exception:
        return None


class AIClient:
    """
    Async AI provider orchestrator.
    Use generate_content(client=async_httpx_client, prompt=...) from FastAPI services.

    Provider priority (default): nvidia_deepseek → nvidia_openai → claude
    """
    def __init__(self, provider_priority: Optional[List[str]] = None):
        self.providers = provider_priority or DEFAULT_PROVIDER_ORDER
        self._refresh_keys()
        logger.info("AIClient initialized with providers: %s", self.providers)

    def _refresh_keys(self):
        # --- NVIDIA DeepSeek (OpenAI-compatible chat completions) ---
        self.nvidia_deepseek_key = os.getenv("NVIDIA_DEEPSEEK_API_KEY")
        self.nvidia_deepseek_url = os.getenv(
            "NVIDIA_DEEPSEEK_API_URL",
            "https://integrate.api.nvidia.com/v1/chat/completions",
        )
        self.nvidia_deepseek_model = os.getenv("NVIDIA_DEEPSEEK_MODEL", "deepseek-ai/deepseek-v3.2")
        self.nvidia_deepseek_thinking = os.getenv("NVIDIA_DEEPSEEK_THINKING", "true").lower() == "true"

        # --- Claude (Anthropic) ---
        self.claude_key = os.getenv("CLAUDE_API_KEY")
        self.claude_model = os.getenv("CLAUDE_MODEL", "claude-opus-4-6")

        # --- NVIDIA OpenAI-compatible ---
        self.nvidia_openai_key = os.getenv("NVIDIA_OPENAI_API_KEY")
        self.nvidia_openai_url = os.getenv(
            "NVIDIA_OPENAI_API_URL",
            "https://integrate.api.nvidia.com/v1/chat/completions",
        )
        self.nvidia_openai_model = os.getenv("NVIDIA_OPENAI_MODEL", "openai/gpt-oss-20b")

        # --- Azure OpenAI ---
        self.azure_key = os.environ.get("AZURE_OPENAI_API_KEY")
        self.azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
        self.azure_api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

        # --- DeepSeek ---
        self.deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        self.deepseek_url = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions")

        # --- Gemini ---
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.gemini_url = os.environ.get("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent")

        # --- HuggingFace ---
        self.hf_token = os.environ.get("HUGGING_FACE_API_TOKEN")
        self.hf_url_template = os.environ.get("HUGGING_FACE_API_URL_TEMPLATE", "https://api-inference.huggingface.co/models/{model}")

    async def generate_content(
        self,
        client: httpx.AsyncClient,
        prompt: str,
        max_tokens: int = 1024,
        providers: Optional[List[str]] = None,
        raise_on_error: bool = True,
        timeout: int = DEFAULT_TIMEOUT
    ) -> Union[dict, str]:
        provider_list = providers or self.providers
        errors = []

        for provider in provider_list:
            provider = provider.lower()
            try:
                if provider in ("nvidia_deepseek", "deepseek_nvidia") and self.nvidia_deepseek_key:
                    raw = await self._call_nvidia_deepseek(client, prompt, max_tokens, timeout)

                elif provider == "claude" and self.claude_key:
                    raw = await self._call_claude(client, prompt, max_tokens, timeout)

                elif provider == "nvidia_openai" and self.nvidia_openai_key:
                    raw = await self._call_nvidia_openai(client, prompt, max_tokens, timeout)

                elif provider == "azure" and self.azure_key and (self.azure_endpoint or self.azure_deployment):
                    raw = await self._call_azure_openai(client, prompt, max_tokens, timeout)
                    if isinstance(raw, str) and "[Safety Block]" in raw:
                        logger.warning("Azure flagged content as unsafe. Trying next provider.")
                        errors.append((provider, "Content flagged by safety filter"))
                        continue

                elif provider == "deepseek" and self.deepseek_key:
                    raw = await self._call_deepseek(client, prompt, max_tokens, timeout)

                elif provider == "gemini" and self.gemini_key:
                    raw = await self._call_gemini(client, prompt, max_tokens, timeout)

                elif provider in ("huggingface", "hf") and self.hf_token:
                    raw = await self._call_huggingface(client, prompt, max_tokens, timeout)

                else:
                    errors.append((provider, "Provider not configured or missing API key"))
                    continue

                # --- Normalise the raw response to str or dict ---
                if isinstance(raw, dict):
                    text = json.dumps(raw)
                    if not text or text == "{}":
                        raise APIIntegrationError(f"{provider} returned empty JSON response")
                    return raw
                elif isinstance(raw, str):
                    text = raw.strip()
                    if not text:
                        raise APIIntegrationError(f"{provider} returned empty text")
                else:
                    text = str(raw).strip()
                    if not text:
                        raise APIIntegrationError(f"{provider} returned empty text")

                # Try full JSON parse first
                try:
                    parsed = json.loads(text)
                    # Extract content from OpenAI-style choices wrapper (Azure, NVIDIA OpenAI, DeepSeek)
                    if provider in ("azure", "nvidia_openai", "deepseek", "nvidia_deepseek") and isinstance(parsed, dict):
                        if "choices" in parsed:
                            content = parsed["choices"][0]["message"].get("content", "")
                            if content and content.strip():
                                logger.debug("%s extracted content: %s...", provider, content[:100])
                                return content
                    return parsed
                except json.JSONDecodeError:
                    parsed = _extract_json_substring(text)
                    if parsed is not None:
                        return parsed
                    return text

            except APIIntegrationError:
                raise
            except Exception as e:
                logger.warning("Provider %s failed: %s", provider, str(e))
                errors.append((provider, str(e)))
                continue

        err_msg = "; ".join([f"{p}: {m}" for p, m in errors])
        if raise_on_error:
            raise APIIntegrationError(f"All AI providers failed: {err_msg}")
        return ""

    # ------------------------------------------------------------------ #
    #  Provider implementations                                            #
    # ------------------------------------------------------------------ #

    async def _call_claude(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        """
        Call Anthropic Claude using the official anthropic SDK.
        Docs: https://docs.anthropic.com/en/api/messages
        """
        if not self.claude_key:
            raise APIIntegrationError("Claude API key not configured (CLAUDE_API_KEY)")

        async_client = anthropic.AsyncAnthropic(api_key=self.claude_key, timeout=timeout)
        try:
            message = await async_client.messages.create(
                model=self.claude_model,
                max_tokens=max_tokens,
                system="You are a helpful educational assistant. Provide accurate, structured responses.",
                messages=[{"role": "user", "content": prompt}],
            )
        except anthropic.AuthenticationError as e:
            raise APIIntegrationError(f"Claude authentication failed: {e}") from e
        except anthropic.RateLimitError as e:
            raise APIIntegrationError(f"Claude rate limit exceeded: {e}") from e
        except anthropic.APIStatusError as e:
            raise APIIntegrationError(f"Claude API error ({e.status_code}): {e.message}") from e
        finally:
            await async_client.close()

        text = " ".join(
            block.text
            for block in message.content
            if block.type == "text"
        ).strip()

        if not text:
            raise APIIntegrationError(f"Claude returned empty content. Stop reason: {message.stop_reason}")

        logger.debug("Claude response snippet: %s...", text[:120])
        return text

    async def _call_nvidia_deepseek(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        """
        Call NVIDIA-hosted DeepSeek using OpenAI-compatible chat completions.
        """
        if not self.nvidia_deepseek_key:
            raise APIIntegrationError("NVIDIA DeepSeek API key not configured (NVIDIA_DEEPSEEK_API_KEY)")

        headers = {
            "Authorization": f"Bearer {self.nvidia_deepseek_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.nvidia_deepseek_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful educational assistant. Provide accurate, structured responses.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 1,
            "top_p": 0.95,
            "max_tokens": max_tokens,
            "stream": False,
        }

        if self.nvidia_deepseek_thinking:
            payload["chat_template_kwargs"] = {"thinking": True}

        resp = await client.post(self.nvidia_deepseek_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()

        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not content:
            raise APIIntegrationError(f"NVIDIA DeepSeek returned empty content. Full response: {data}")

        logger.debug("NVIDIA DeepSeek response snippet: %s...", content[:120])
        return content

    async def _call_nvidia_openai(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        """
        Call NVIDIA-hosted models via their OpenAI-compatible chat completions endpoint.
        Docs: https://build.nvidia.com/explore/discover
        """
        if not self.nvidia_openai_key:
            raise APIIntegrationError("NVIDIA API key not configured (NVIDIA_OPENAI_API_KEY)")

        headers = {
            "Authorization": f"Bearer {self.nvidia_openai_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.nvidia_openai_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful educational assistant. Provide accurate, helpful responses to student questions.",
                },
                {"role": "user", "content": prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 1,
            "stream": False,
        }

        resp = await client.post(self.nvidia_openai_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()

        data = resp.json()
        # Standard OpenAI shape
        content = data["choices"][0]["message"].get("content", "").strip()
        if not content:
            raise APIIntegrationError(f"NVIDIA returned empty content. Full response: {data}")

        logger.debug("NVIDIA response snippet: %s...", content[:120])
        return content

    async def _call_deepseek(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_key}",
        }
        payload = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
        }
        resp = await client.post(self.deepseek_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.text

    async def _call_azure_openai(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> Union[dict, str]:
        if not self.azure_endpoint or not self.azure_key:
            raise APIIntegrationError("Azure OpenAI not configured")

        base_url = self.azure_endpoint.rstrip('/')
        if '/openai/deployments/' in base_url.lower():
            url = f"{base_url}/chat/completions?api-version={self.azure_api_version}"
        else:
            if not self.azure_deployment:
                raise APIIntegrationError("Azure OpenAI deployment name is required")
            url = f"{base_url}/openai/deployments/{self.azure_deployment}/chat/completions?api-version={self.azure_api_version}"

        headers = {"Content-Type": "application/json", "api-key": self.azure_key}
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful educational assistant."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }

        resp = await client.post(url, headers=headers, json=payload, timeout=timeout)

        if resp.status_code == 400:
            try:
                inner = resp.json().get("error", {}).get("innererror", {})
                if inner.get("code") == "ResponsibleAIPolicyViolation":
                    logger.warning("Azure content filter triggered.")
                    return "[Safety Block] Azure content filter"
            except Exception:
                pass

        if resp.status_code != 200:
            logger.error("Azure API Error: %s - %s", resp.status_code, resp.text)
            resp.raise_for_status()

        try:
            return resp.json()
        except json.JSONDecodeError as e:
            raise APIIntegrationError(f"Azure returned invalid JSON: {e}")

    async def _call_gemini(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        if not self.gemini_key or not self.gemini_url:
            raise APIIntegrationError("Gemini not configured")
        headers = {"Authorization": f"Bearer {self.gemini_key}", "Content-Type": "application/json"}
        payload = {"prompt": prompt, "max_output_tokens": max_tokens}
        resp = await client.post(self.gemini_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.text

    async def _call_huggingface(self, client: httpx.AsyncClient, prompt: str, max_tokens: int, timeout: int = DEFAULT_TIMEOUT) -> str:
        if not self.hf_token:
            raise APIIntegrationError("HuggingFace token not configured")
        model = os.environ.get("HUGGING_FACE_MODEL", "gpt2")
        url = self.hf_url_template.format(model=model)
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": max_tokens}}
        resp = await client.post(url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception:
            return resp.text


# ------------------------------------------------------------------ #
#  Global singleton                                                    #
# ------------------------------------------------------------------ #
provider_order_env = os.environ.get("AI_PROVIDER_ORDER")
if provider_order_env:
    provider_order = [p.strip().lower() for p in provider_order_env.split(",") if p.strip()]
else:
    provider_order = DEFAULT_PROVIDER_ORDER

ai_service = AIClient(provider_priority=provider_order)