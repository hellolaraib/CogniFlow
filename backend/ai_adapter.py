"""General-Purpose AI Model Adapter for CogniFlow (Phase 1).

Provides a provider-neutral interface to query external and local AI models:
- Groq Cloud (llama-3.3-70b-versatile, llama-3.1-8b-instant, etc.)
- OpenAI (gpt-4o, gpt-4o-mini, etc.)
- Google Gemini (gemini-2.0-flash, gemini-1.5-pro via OpenAI-compatible endpoint)
- Generic OpenAI-compatible providers (DeepSeek, Together, OpenRouter, vLLM)
- Local Ollama daemon (via /v1/chat/completions or /api/chat)

Key Design Principles:
1. Credentials & API keys stay strictly on the backend (never sent to React frontend).
2. Never silently invokes paid providers; requires explicit configuration.
3. Captures actual token counts (prompt_tokens, completion_tokens) reported by providers.
4. Robust error handling for HTTP 401/403, 429, timeouts, and network failures.
5. Supports conversation history context for multi-turn follow-ups.
"""

import os
import json
import logging
import re
import socket
import time
import urllib.request
import urllib.error
import urllib.parse
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

logger = logging.getLogger("cogniflow.ai_adapter")


def load_project_dotenv() -> None:
    """Reads .env from the project root if variables are not already set in os.environ.
    Does NOT overwrite existing environment variables or touch any files.
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)
        env_path = os.path.join(project_root, ".env")
        if not os.path.exists(env_path):
            return

        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        logger.debug(f"[AI Adapter] Optional .env loader encountered: {e}")


# Pre-load on module import
load_project_dotenv()


@dataclass
class AIConfig:
    provider: str  # 'groq', 'openai', 'gemini', 'ollama', 'custom', or 'none'
    api_key: Optional[str]
    base_url: str
    model: str
    timeout_seconds: float
    is_configured: bool
    display_name: str


def get_ai_config() -> AIConfig:
    """Detects and returns current AI provider configuration from environment variables."""
    # Ensure environment is fresh
    load_project_dotenv()

    # Read explicit or provider-specific keys
    raw_provider = os.environ.get("AI_PROVIDER", "auto").lower().strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    universal_key = os.environ.get("AI_API_KEY", "").strip()

    custom_base_url = os.environ.get("AI_API_BASE_URL", "").strip()
    custom_model = os.environ.get("AI_MODEL", "").strip()

    try:
        timeout_sec = float(os.environ.get("AI_REQUEST_TIMEOUT_SECONDS", "20.0"))
    except ValueError:
        timeout_sec = 20.0

    # Auto-detect or validate provider
    provider = raw_provider
    api_key = universal_key
    base_url = custom_base_url
    model = custom_model
    display_name = "Unconfigured AI Model"

    if provider == "groq" or (provider == "auto" and (groq_key or (universal_key and universal_key.startswith("gsk_")))):
        provider = "groq"
        api_key = groq_key or universal_key
        base_url = custom_base_url or "https://api.groq.com/openai/v1"
        model = custom_model or "llama-3.3-70b-versatile"
        display_name = f"Groq Cloud ({model})"

    elif provider == "gemini" or (provider == "auto" and (gemini_key or (universal_key and universal_key.startswith("AIza")))):
        provider = "gemini"
        api_key = gemini_key or universal_key
        base_url = custom_base_url or "https://generativelanguage.googleapis.com/v1beta/openai"
        model = custom_model or "gemini-2.0-flash"
        display_name = f"Google Gemini ({model})"

    elif provider == "openai" or (provider == "auto" and (openai_key or (universal_key and universal_key.startswith("sk-")))):
        provider = "openai"
        api_key = openai_key or universal_key
        base_url = custom_base_url or "https://api.openai.com/v1"
        model = custom_model or "gpt-4o-mini"
        display_name = f"OpenAI ({model})"

    elif provider == "ollama":
        provider = "ollama"
        api_key = None
        base_url = custom_base_url or os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
        model = custom_model or "llama3.2"
        display_name = f"Local Ollama ({model})"

    elif universal_key:
        provider = "custom"
        api_key = universal_key
        base_url = custom_base_url or "https://api.openai.com/v1"
        model = custom_model or "gpt-4o-mini"
        display_name = f"AI Provider ({model})"

    else:
        # Check if local Ollama daemon is running on localhost:11434
        if is_ollama_reachable("http://127.0.0.1:11434"):
            provider = "ollama"
            api_key = None
            base_url = "http://127.0.0.1:11434"
            model = custom_model or "llama3.2"
            display_name = f"Local Ollama ({model})"
        else:
            provider = "none"
            api_key = None
            base_url = ""
            model = custom_model or "none"
            display_name = "No AI Provider Configured"

    is_configured = (provider != "none") and bool(api_key or provider == "ollama")

    return AIConfig(
        provider=provider,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
        model=model,
        timeout_seconds=timeout_sec,
        is_configured=is_configured,
        display_name=display_name
    )


def is_ollama_reachable(base_url: str = "http://127.0.0.1:11434") -> bool:
    """Quick 0.4s socket check to test if local Ollama server is running."""
    try:
        parsed = urllib.parse.urlparse(base_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 11434
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.4)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def check_ai_provider_status() -> Dict[str, Any]:
    """Returns safe diagnostic metadata about the AI model status for /health endpoint.
    NEVER exposes secrets or full API keys.
    """
    config = get_ai_config()
    masked_key = None
    if config.api_key:
        if len(config.api_key) > 8:
            masked_key = f"{config.api_key[:4]}...{config.api_key[-4:]}"
        else:
            masked_key = "***"

    return {
        "configured": config.is_configured,
        "is_configured": config.is_configured,
        "provider": config.provider,
        "model": config.model if config.is_configured else None,
        "base_url": config.base_url if config.is_configured else None,
        "masked_key": masked_key,
        "display_name": config.display_name,
        "status": "operational" if config.is_configured else "not_configured",
        "detail": (
            f"Configured with {config.display_name}"
            if config.is_configured
            else "No AI provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env, or start local Ollama."
        )
    }


def query_general_ai_model(
    prompt: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """Queries the configured general-purpose AI model with conversation context and returns
    answer text, actual token usage metadata, model name, and error status.

    Returns dict matching:
    {
        "success": bool,
        "answer": str,
        "error": Optional[str],
        "solver": "general_llm",
        "model": str,
        "prompt_tokens": int,
        "completion_tokens": int,
        "total_tokens": int,
        "counting_method": "actual" | "estimated" | "unavailable",
        "engine": str,
        "processing_time_ms": float,
        "fallback_used": bool
    }
    """
    start_time = time.perf_counter()
    config = get_ai_config()

    if not config.is_configured:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.warning("[AI Adapter] Query rejected: No general-purpose AI model is configured.")
        return {
            "success": False,
            "answer": (
                "### General AI Model Unavailable\n\n"
                "CogniFlow is ready to answer general questions, but no external AI provider or local inference engine is currently configured.\n\n"
                "**How to Enable:**\n"
                "1. Add an API key to your `.env` file (e.g., `GROQ_API_KEY=gsk_...`, `OPENAI_API_KEY=sk-...`, or `GEMINI_API_KEY=AIza...`).\n"
                "2. Or start a local model server using **Ollama** on port `11434` (`ollama run llama3.2`).\n"
                "3. Restart the backend: `uvicorn backend.main:app --reload`.\n\n"
                "See `.env.example` for comprehensive setup options."
            ),
            "error": "No AI model configured. Please set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env or run Ollama.",
            "solver": "general_llm",
            "model": None,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "counting_method": "unavailable",
            "engine": "Unconfigured AI Provider",
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }

    # Build messages list with system prompt and conversation history
    default_system = (
        "You are CogniFlow, an advanced technical AI assistant. "
        "Provide accurate, direct, well-structured, and helpful answers. "
        "Use Markdown formatting with code blocks, bold key terms, and bullet points where appropriate."
    )
    messages = [{"role": "system", "content": system_prompt or default_system}]

    # Append relevant conversation history (limit to last 6 messages to prevent context overflow)
    if conversation_history:
        recent = conversation_history[-6:]
        for msg in recent:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant"] and content:
                # Cap individual historical turns to 2000 chars to avoid ballooning context
                messages.append({"role": role, "content": content[:2000]})

    # Append the current prompt
    messages.append({"role": "user", "content": prompt})

    logger.info(
        f"[AI Adapter] Dispatching request to provider='{config.provider}' | model='{config.model}' | "
        f"messages_count={len(messages)}"
    )

    # 1. Ollama Native Route (if provider is ollama and not using /v1)
    if config.provider == "ollama" and not config.base_url.endswith("/v1"):
        return _query_ollama_chat(config, messages, prompt, start_time)

    # 2. Standard OpenAI-Compatible Route (Groq, OpenAI, Gemini OpenAI endpoint, Custom)
    return _query_openai_compatible(config, messages, prompt, start_time)


def _query_openai_compatible(
    config: AIConfig,
    messages: List[Dict[str, str]],
    raw_prompt: str,
    start_time: float
) -> Dict[str, Any]:
    """Sends chat completions request to any OpenAI-compatible endpoint."""
    endpoint = f"{config.base_url}/chat/completions"

    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2048
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "CogniFlowBot/1.0 (academic; dev@cogniflow.local)"
    }
    if config.api_key:
        headers["Authorization"] = f"Bearer {config.api_key}"

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=req_data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=config.timeout_seconds) as resp:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            if resp.status == 200:
                body = resp.read().decode("utf-8")
                data = json.loads(body)

                choices = data.get("choices", [])
                if not choices:
                    raise ValueError("Provider returned 200 OK but choices array is empty")

                answer = choices[0].get("message", {}).get("content", "").strip()
                if not answer:
                    answer = choices[0].get("text", "").strip()

                # Extract provider-reported usage
                usage = data.get("usage", {})
                prompt_tokens = int(usage.get("prompt_tokens", 0))
                completion_tokens = int(usage.get("completion_tokens", 0))
                total_tokens = int(usage.get("total_tokens", prompt_tokens + completion_tokens))

                # If tokens are reported, mark actual; otherwise estimate accurately
                if prompt_tokens > 0 or completion_tokens > 0:
                    counting_method = "actual"
                else:
                    prompt_tokens = max(1, len(raw_prompt.split()) * 4 // 3)
                    completion_tokens = max(1, len(answer.split()) * 4 // 3)
                    total_tokens = prompt_tokens + completion_tokens
                    counting_method = "estimated"

                model_name = data.get("model", config.model)

                logger.info(
                    f"[AI Adapter] Request successful | model='{model_name}' | "
                    f"tokens={total_tokens} (in={prompt_tokens}, out={completion_tokens}) | elapsed_ms={elapsed_ms}"
                )

                return {
                    "success": True,
                    "answer": answer,
                    "error": None,
                    "solver": "general_llm",
                    "model": model_name,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "counting_method": counting_method,
                    "engine": config.display_name,
                    "processing_time_ms": elapsed_ms,
                    "fallback_used": False
                }

    except urllib.error.HTTPError as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        err_body = ""
        try:
            err_body = e.read().decode("utf-8", errors="ignore")
        except Exception:
            pass

        logger.error(f"[AI Adapter] HTTP {e.code} Error from {config.provider}: {err_body}")

        # Attempt to extract consumed tokens if provider returned partial usage
        err_tokens = 0
        try:
            err_json = json.loads(err_body)
            err_usage = err_json.get("usage", {})
            err_tokens = err_usage.get("total_tokens", 0)
        except Exception:
            pass

        if e.code in [401, 403]:
            err_msg = (
                f"Authentication Error (HTTP {e.code}): Invalid or missing API key for {config.provider}. "
                "Please verify your credentials in .env."
            )
        elif e.code == 429:
            err_msg = f"Rate Limit Exceeded (HTTP 429) on {config.provider}. Please wait a moment and retry."
        elif e.code >= 500:
            err_msg = f"Provider Server Error (HTTP {e.code}) from {config.provider}. Service may be degraded."
        else:
            err_msg = f"AI Provider returned HTTP {e.code}: {e.reason}"

        return {
            "success": False,
            "answer": f"### AI Provider Error\n\n{err_msg}",
            "error": err_msg,
            "solver": "general_llm",
            "model": config.model,
            "prompt_tokens": err_tokens,
            "completion_tokens": 0,
            "total_tokens": err_tokens,
            "counting_method": "actual" if err_tokens > 0 else "unavailable",
            "engine": config.display_name,
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }

    except urllib.error.URLError as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[AI Adapter] Connection/URL Error from {config.provider}: {e.reason}")

        if isinstance(e.reason, socket.timeout) or "timed out" in str(e.reason).lower():
            err_msg = f"Request to {config.provider} timed out after {config.timeout_seconds}s."
        else:
            err_msg = f"Failed to connect to AI provider ({config.base_url}): {e.reason}"

        return {
            "success": False,
            "answer": f"### Connection Error\n\n{err_msg}",
            "error": err_msg,
            "solver": "general_llm",
            "model": config.model,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "counting_method": "unavailable",
            "engine": config.display_name,
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }

    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[AI Adapter] Unexpected error querying {config.provider}: {e}")
        err_msg = f"Unexpected error during model inference: {str(e)}"
        return {
            "success": False,
            "answer": f"### Inference Error\n\n{err_msg}",
            "error": err_msg,
            "solver": "general_llm",
            "model": config.model,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "counting_method": "unavailable",
            "engine": config.display_name,
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }


def _query_ollama_chat(
    config: AIConfig,
    messages: List[Dict[str, str]],
    raw_prompt: str,
    start_time: float
) -> Dict[str, Any]:
    """Queries native Ollama chat API (/api/chat)."""
    endpoint = f"{config.base_url}/api/chat"

    payload = {
        "model": config.model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=config.timeout_seconds) as resp:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                answer = data.get("message", {}).get("content", "").strip()

                prompt_tokens = int(data.get("prompt_eval_count", 0))
                completion_tokens = int(data.get("eval_count", 0))
                total_tokens = prompt_tokens + completion_tokens

                counting_method = "actual" if total_tokens > 0 else "estimated"

                return {
                    "success": True,
                    "answer": answer,
                    "error": None,
                    "solver": "general_llm",
                    "model": data.get("model", config.model),
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "counting_method": counting_method,
                    "engine": f"Local Ollama ({config.model})",
                    "processing_time_ms": elapsed_ms,
                    "fallback_used": False
                }
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        err_msg = f"Failed querying local Ollama on {config.base_url}: {e}"
        logger.error(f"[AI Adapter] {err_msg}")
        return {
            "success": False,
            "answer": f"### Local Model Error\n\n{err_msg}",
            "error": err_msg,
            "solver": "general_llm",
            "model": config.model,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "counting_method": "unavailable",
            "engine": f"Local Ollama ({config.model})",
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }
