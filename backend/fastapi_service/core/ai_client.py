import os
import json
import logging
from typing import List, Optional, Union
import httpx

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 30
DEFAULT_PROVIDER_ORDER = ["azure", "deepseek", "gemini", "huggingface"]


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
    """
    def __init__(self, provider_priority: Optional[List[str]] = None):
        self.providers = provider_priority or DEFAULT_PROVIDER_ORDER
        self._refresh_keys()
        logger.info("AIClient initialized with providers: %s", self.providers)

    def _refresh_keys(self):
        self.deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        self.deepseek_url = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions")

        self.azure_key = os.environ.get("AZURE_OPENAI_API_KEY")
        self.azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")  # can be /deployments/... or base endpoint
        self.azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
        self.azure_api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.gemini_url = os.environ.get("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent")

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
                if provider == "azure" and self.azure_key and (self.azure_endpoint or self.azure_deployment):
                    raw = await self._call_azure_openai(client, prompt, max_tokens)
                    # If Azure returned a safety block string, try next provider
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
                    errors.append((provider, "Provider not configured"))
                    continue

                # Handle different return types
                if isinstance(raw, dict):
                    # Already parsed JSON, return as-is
                    text = json.dumps(raw)
                    if not text or text == "{}":
                        raise APIIntegrationError(f"{provider} returned empty JSON response")
                    return raw
                elif isinstance(raw, str):
                    text = raw.strip()
                    if not text:
                        logger.error(f"{provider} returned empty text. Raw response type: {type(raw)}")
                        raise APIIntegrationError(f"{provider} returned empty text")
                else:
                    text = str(raw).strip()
                    if not text:
                        logger.error(f"{provider} returned empty text. Raw response type: {type(raw)}, value: {raw}")
                        raise APIIntegrationError(f"{provider} returned empty text")

                # Try to parse full JSON first
                try:
                    parsed = json.loads(text)
                    # For Azure, extract content from choices if present
                    if provider == "azure" and isinstance(parsed, dict):
                        if "choices" in parsed and isinstance(parsed["choices"], list) and len(parsed["choices"]) > 0:
                            choice = parsed["choices"][0]
                            if "message" in choice and "content" in choice["message"]:
                                content = choice["message"]["content"]
                                if content and content.strip():
                                    return parsed  # Return full JSON for upstream processing
                    return parsed
                except json.JSONDecodeError as e:
                    logger.debug(f"{provider} response is not valid JSON: {text[:200]}")
                    parsed = _extract_json_substring(text)
                    if parsed is not None:
                        return parsed
                    return text

            except Exception as e:
                logger.warning("Provider %s failed: %s", provider, str(e))
                errors.append((provider, str(e)))
                continue

        err_msg = "; ".join([f"{p}: {m}" for p, m in errors])
        if raise_on_error:
            raise APIIntegrationError(f"All AI providers failed: {err_msg}")
        return ""

    # ----- provider implementations -----

    async def _call_deepseek(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        url = self.deepseek_url
        headers = {
            "Content-Type": "application/json", "Authorization": f"Bearer {self.deepseek_key}",}
        payload = {"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens}
        resp = await client.post(url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        return resp.text

    async def _call_azure_openai(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> Union[dict, str]:
        if not self.azure_endpoint or not self.azure_key:
            raise APIIntegrationError("Azure OpenAI not configured")

        base_url = self.azure_endpoint.rstrip('/')
        if '/openai/deployments/' in base_url.lower():
            # Endpoint already contains deployment path
            url = f"{base_url}/chat/completions?api-version={self.azure_api_version}"
        else:
            # Need to construct full URL with deployment
            if not self.azure_deployment:
                raise APIIntegrationError("Azure OpenAI deployment name is required")
            url = f"{base_url}/openai/deployments/{self.azure_deployment}/chat/completions?api-version={self.azure_api_version}"

        headers = {
            "Content-Type": "application/json", 
            "api-key": self.azure_key
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful educational assistant. Provide accurate, helpful responses to student questions."},
                {"role": "user", "content": prompt}
            ], 
            "max_tokens": max_tokens, 
            "temperature": 0.7
        }
        
        resp = await client.post(url, headers=headers, json=payload, timeout=DEFAULT_TIMEOUT)
        
        # Handle content filter 400 errors
        if resp.status_code == 400:
            try:
                error_data = resp.json()
                inner_error = error_data.get("error", {}).get("innererror", {})
                if inner_error.get("code") == "ResponsibleAIPolicyViolation":
                    # Return special marker so provider can be skipped and next provider tried
                    logger.warning("Azure content filter triggered. Will try alternative provider.")
                    return "[Safety Block] Azure content filter"
            except Exception:
                pass    
        
        if resp.status_code != 200:
            logger.error(f"Azure API Error: {resp.status_code} - {resp.text}")
            resp.raise_for_status()
        
        # Azure returns JSON, parse and return as dict
        try:
            resp_json = resp.json()
            logger.debug(f"Azure response keys: {list(resp_json.keys()) if isinstance(resp_json, dict) else 'not a dict'}")
            # Validate response has content
            if "choices" in resp_json and isinstance(resp_json["choices"], list) and len(resp_json["choices"]) > 0:
                choice = resp_json["choices"][0]
                if "message" in choice:
                    content = choice["message"].get("content", "")
                    if not content or not content.strip():
                        logger.warning(f"Azure response has empty content. Full response: {resp_json}")
            
            return resp_json
        
        except json.JSONDecodeError as e:
            logger.error(f"Azure response is not valid JSON: {resp.text[:500]}")
            raise APIIntegrationError(f"Azure returned invalid JSON: {str(e)}")

    async def _call_gemini(self, client: httpx.AsyncClient, prompt: str, max_tokens: int) -> str:
        if not self.gemini_key or not self.gemini_url:
            raise APIIntegrationError("Gemini not configured")
        headers = {"Authorization": f"Bearer {self.gemini_key}", "Content-Type": "application/json"}
        # Generic payload - adapt if you have a specific schema
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
        # HF often returns json; return str for parsing upstream
        try:
            return resp.json()
        except Exception:
            return resp.text


# instantiate global client
ai_service = AIClient(provider_priority=["azure"])
