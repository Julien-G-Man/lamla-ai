import os
import json
import logging
from typing import List, Optional, Union
import httpx

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 30
DEFAULT_PROVIDER_ORDER = ["claude", "nvidia", "azure", "deepseek", "gemini", "huggingface"]


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

    Provider priority (default): claude → nvidia → azure → deepseek → gemini → huggingface
    """
    def __init__(self, provider_priority: Optional[List[str]] = None):
        self.providers = provider_priority or DEFAULT_PROVIDER_ORDER
        self._refresh_keys()
        logger.info("AIClient initialized with providers: %s", self.providers)

    def _refresh_keys(self):
        # --- Claude (Anthropic) ---
        self.claude_key = os.getenv("CLAUDE_API_KEY")
        self.claude_model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
        self.claude_url = os.getenv("CLAUDE_URL", "https://api.anthropic.com/v1/messages")
        self.claude_api_version = os.getenv("CLAUDE_API_VERSION", "2023-06-01")

        # --- NVIDIA OpenAI-compatible ---
        self.nvidia_key = os.getenv("NVIDIA_OPENAI_API_KEY")
        self.nvidia_url = os.getenv("NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1/chat/completions")
        self.nvidia_model = os.getenv("NVIDIA_MODEL", "openai/gpt-oss-20b")

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
        raise_on_error: bool = True
    ) -> Union[dict, str]:
        provider_list = providers or self.providers
        errors = []

        for provider in provider_list:
            provider = provider.lower()
            try:
                if provider == "claude" and self.claude_key:
                    raw = await self._call_claude(client, prompt, max_tokens)

                elif provider == "nvidia" and self.nvidia_key:
                    raw = await self._call_nvidia(client, prompt, max_tokens)

                elif provider == "azure" and self.azure_key and (self.azure_endpoint or self.azure_deployment):
                    raw = await self._call_azure_openai(client, prompt, max_tokens)
                    if isinstance(raw, str) and "[Safety Block]" in raw:
                        logger.warning("Azure flagged content as unsafe. Trying next provider.")
                        errors.append((provider, "Content flagged by safety filter"))
                        continue

                elif provider == "deepseek" and self.deepseek_key:
                    raw = await self._call_deepseek(client, prompt, max_tokens)

                elif provider == "gemini" and self.gemini_key:
                    raw = await self._call_gemini(client, prompt, max_tokens)

                elif provider in ("huggingface", "hf") and self.hf_token:
                    raw = await self._call_huggingface(client, prompt, max_tokens)

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
                    # Extract content from OpenAI-style choices wrapper (Azure, NVIDIA, DeepSeek)
                    if provider in ("azure", "nvidia", "deepseek") and isinstance(parsed, dict):
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

    async def _call_claude(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        """
        Call Anthropic Claude via the /v1/messages endpoint.
        Docs: https://docs.anthropic.com/en/api/messages
        """
        if not self.claude_key:
            raise APIIntegrationError("Claude API key not configured (CLAUDE_API_KEY)")

        headers = {
            "x-api-key": self.claude_key,
            "anthropic-version": self.claude_api_version,
            "content-type": "application/json",
        }
        payload = {
            "model": self.claude_model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "user", "content": prompt}
            ],
        }

        resp = await client.post(self.claude_url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()

        data = resp.json()
        # Anthropic response shape: {"content": [{"type": "text", "text": "..."}], ...}
        content_blocks = data.get("content", [])
        text = " ".join(
            block.get("text", "")
            for block in content_blocks
            if block.get("type") == "text"
        ).strip()

        if not text:
            raise APIIntegrationError(f"Claude returned empty content. Full response: {data}")

        logger.debug("Claude response snippet: %s...", text[:120])
        return text

    async def _call_nvidia(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        """
        Call NVIDIA-hosted models via their OpenAI-compatible chat completions endpoint.
        Docs: https://build.nvidia.com/explore/discover
        """
        if not self.nvidia_key:
            raise APIIntegrationError("NVIDIA API key not configured (NVIDIA_OPENAI_API_KEY)")

        headers = {
            "Authorization": f"Bearer {self.nvidia_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.nvidia_model,
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

        resp = await client.post(self.nvidia_url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()

        data = resp.json()
        # Standard OpenAI shape
        content = data["choices"][0]["message"].get("content", "").strip()
        if not content:
            raise APIIntegrationError(f"NVIDIA returned empty content. Full response: {data}")

        logger.debug("NVIDIA response snippet: %s...", content[:120])
        return content

    async def _call_deepseek(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_key}",
        }
        payload = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
        }
        resp = await client.post(self.deepseek_url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        return resp.text

    async def _call_azure_openai(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> Union[dict, str]:
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

        resp = await client.post(url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)

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

    async def _call_gemini(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        if not self.gemini_key or not self.gemini_url:
            raise APIIntegrationError("Gemini not configured")
        headers = {"Authorization": f"Bearer {self.gemini_key}", "Content-Type": "application/json"}
        payload = {"prompt": prompt, "max_output_tokens": max_tokens}
        resp = await client.post(self.gemini_url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        return resp.text

    async def _call_huggingface(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        if not self.hf_token:
            raise APIIntegrationError("HuggingFace token not configured")
        model = os.environ.get("HUGGING_FACE_MODEL", "gpt2")
        url = self.hf_url_template.format(model=model)
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": max_tokens}}
        resp = await client.post(url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
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