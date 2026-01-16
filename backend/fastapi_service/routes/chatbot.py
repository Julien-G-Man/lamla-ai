import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

try:
	from ..core.ai_client import ai_service
except Exception:
	try:
		from fastapi_service.core.ai_client import ai_service
	except Exception:
		# Fallback: attempt to load module by path so running uvicorn from
		# within the package dir still works (avoids "attempted relative
		# import beyond top-level package" and ModuleNotFoundError).
		import os, sys, importlib.util
		try:
			this_dir = os.path.dirname(os.path.abspath(__file__))
			package_root = os.path.dirname(this_dir)  # fastapi_service/
			core_path = os.path.join(package_root, 'core', 'ai_client.py')
			if os.path.exists(core_path):
				spec = importlib.util.spec_from_file_location('fastapi_service.core.ai_client', core_path)
				mod = importlib.util.module_from_spec(spec)
				spec.loader.exec_module(mod)
				ai_service = getattr(mod, 'ai_service', None)
			else:
				# As a last resort, try adding package_root parent to sys.path
				sys.path.insert(0, package_root)
				try:
					from fastapi_service.core.ai_client import ai_service
				except Exception as e:
					logger.exception("Could not import FastAPI ai_service: %s", e)
					ai_service = None
		except Exception as e:
			logger.exception("Could not import FastAPI ai_service via fallback: %s", e)
			ai_service = None


class PromptIn(BaseModel):
	prompt: str
	max_tokens: Optional[int] = 400


@router.post("/")
async def chatbot_endpoint(payload: PromptIn):
	if not payload or not payload.prompt:
		raise HTTPException(status_code=400, detail="Missing prompt")

	if ai_service is None:
		raise HTTPException(status_code=503, detail="AI service not available")

	try:
		async with httpx.AsyncClient(timeout=30) as client:
			raw = await ai_service.generate_content(client, payload.prompt, payload.max_tokens)

		# Normalize response
		if isinstance(raw, dict):
			if "response" in raw:
				content = raw.get("response", "")
			elif "choices" in raw:
				choices = raw.get("choices")
				if isinstance(choices, list) and choices:
					first = choices[0]
					content = first.get("text") or (first.get("message") or {}).get("content", "")
				else:
					content = json.dumps(raw)
			else:
				content = json.dumps(raw)
		else:
			content = str(raw)

		return {"response": content}

	except Exception as exc:
		logger.exception("Error in FastAPI chatbot endpoint: %s", exc)
		raise HTTPException(status_code=500, detail="AI service error")
