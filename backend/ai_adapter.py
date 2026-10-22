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
    Does NOT overwrite existing non-empty environment variables.
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)
        candidates = [
            os.path.join(project_root, ".env"),
            os.path.join(os.getcwd(), ".env"),
        ]

        env_path = None
        for p in candidates:
            if os.path.exists(p):
                env_path = p
                break

        if not env_path:
            return

        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("export "):
                    line = line[7:].strip()
                if "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if " #" in v:
                    v = v.split(" #", 1)[0].strip()
                if k and (k not in os.environ or not os.environ[k].strip()):
                    os.environ[k] = v
    except Exception as e:
        logger.debug(f"[AI Adapter] Optional .env loader encountered: {e}")


# Pre-load on module import
load_project_dotenv()


@dataclass
class AIConfig:
    provider: str  # 'groq' or 'none'
    api_key: Optional[str]
    base_url: str
    model: str
    timeout_seconds: float
    is_configured: bool
    display_name: str


def get_ai_config() -> AIConfig:
    """Detects and returns Groq AI configuration. Groq is the only supported cloud AI provider."""
    if os.environ.get("AI_PROVIDER", "").lower() == "none":
        return AIConfig(
            provider="none",
            api_key=None,
            base_url="",
            model="none",
            timeout_seconds=20.0,
            is_configured=False,
            display_name="No AI Provider Configured"
        )

    load_project_dotenv()

    if os.environ.get("AI_PROVIDER", "").lower() == "none":
        return AIConfig(
            provider="none",
            api_key=None,
            base_url="",
            model="none",
            timeout_seconds=20.0,
            is_configured=False,
            display_name="No AI Provider Configured"
        )

    groq_key = os.environ.get("GROQ_API_KEY", "").strip() or os.environ.get("AI_API_KEY", "").strip()
    custom_model = os.environ.get("AI_MODEL", "").strip()
    custom_base_url = os.environ.get("AI_API_BASE_URL", "").strip()

    try:
        timeout_sec = float(os.environ.get("AI_REQUEST_TIMEOUT_SECONDS", "20.0"))
    except ValueError:
        timeout_sec = 20.0

    if groq_key:
        provider = "groq"
        api_key = groq_key
        base_url = custom_base_url or "https://api.groq.com/openai/v1"
        model = custom_model or "qwen/qwen3.8-27b"
        display_name = f"Groq Cloud ({model})"
        is_configured = True
    else:
        provider = "none"
        api_key = None
        base_url = ""
        model = "none"
        display_name = "No AI Provider Configured"
        is_configured = False

    return AIConfig(
        provider=provider,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
        model=model,
        timeout_seconds=timeout_sec,
        is_configured=is_configured,
        display_name=display_name
    )


def check_ai_provider_status() -> Dict[str, Any]:
    """Returns safe diagnostic metadata about the Groq model status for /health endpoint.
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
            else "No Groq API key configured. Set GROQ_API_KEY in repository-root .env."
        )
    }


# Placeholder patterns to reject
PLACEHOLDER_PATTERNS = [
    re.compile(r"def\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*:\s*(?:result\s*=\s*True\s*\n\s*return\s*result|pass\b)"),
    re.compile(r"def\s+Explain_[a-zA-Z0-9_]+\s*\(\)"),
    re.compile(r"\/\/\s*TODO:\s*implement", re.IGNORECASE),
    re.compile(r"#\s*TODO:\s*implement", re.IGNORECASE),
    re.compile(r"\[Insert\s+(?:code|implementation)\s+here\]", re.IGNORECASE),
]


def validate_response_quality(prompt: str, answer: str) -> tuple[bool, Optional[str]]:
    """Verifies that an AI response addresses the user's request without being empty,
    malformed, or an obvious placeholder.
    """
    clean = answer.strip()
    if not clean:
        return False, "Response is empty"

    for pattern in PLACEHOLDER_PATTERNS:
        if pattern.search(clean):
            return False, "Response contains an unfilled placeholder template"

    prompt_lower = prompt.lower()
    # If the user explicitly requested a C program, verify that C-style syntax is present
    if any(k in prompt_lower for k in ["c program", "in c", "c code"]):
        if "```" in clean and not any(k in clean for k in ["#include", "int main", "void ", "struct ", "printf", "malloc", "NULL"]):
            return False, "Requested C program but response does not contain valid C code structure"

    return True, None


def filter_relevant_history(prompt: str, history: Optional[List[Dict[str, str]]]) -> List[Dict[str, str]]:
    """Intelligently filters and compresses conversation history to minimize Groq token usage
    while preserving vital context for follow-up questions.
    Isolates context strictly to relevant conversation turns.
    """
    if not history:
        return []

    # Filter out empty or error turns
    valid_turns = [
        {"role": msg.get("role", "user"), "content": msg.get("content", "").strip()}
        for msg in history
        if msg.get("content", "").strip()
        and not msg.get("content", "").strip().startswith("### AI Provider Error")
        and not msg.get("content", "").strip().startswith("### Connection Error")
    ]
    if not valid_turns:
        return []

    prompt_lower = prompt.lower().strip()
    STOPWORDS = {
        "what", "which", "who", "whom", "where", "when", "why", "how",
        "and", "the", "for", "with", "from", "that", "this", "then",
        "have", "has", "had", "does", "did", "can", "could", "will",
        "would", "should", "are", "were", "been", "being", "tell",
        "give", "show", "explain", "about", "into", "onto", "your",
        "some", "such", "than", "more", "most", "also", "just", "very"
    }
    words = set(re.findall(r"\b\w{3,}\b", prompt_lower)) - STOPWORDS

    # Check if current prompt signals a follow-up or references previous context
    has_follow_up_signal = any(
        re.search(r"\b" + re.escape(sig) + r"\b", prompt_lower)
        for sig in ["it", "this", "that", "these", "those", "them", "its", "previous", "earlier", "same", "instead", "above"]
    ) or any(
        prompt_lower.startswith(phrase)
        for phrase in ["why", "how", "what about", "how about", "explain more", "give an example", "continue", "now ", "also "]
    )

    recent_turns = valid_turns[-4:]  # Max 4 turns (2 user + 2 assistant)
    relevant_turns = []

    for turn in recent_turns:
        turn_text = turn["content"].lower()
        turn_words = set(re.findall(r"\b\w{3,}\b", turn_text)) - STOPWORDS
        overlap = words.intersection(turn_words)

        if has_follow_up_signal or len(overlap) >= 1:
            content = turn["content"]
            # Condense long prior assistant turns to preserve token budget
            if turn["role"] == "assistant" and len(content) > 600:
                content = content[:500] + "... [context condensed for token efficiency]"
            relevant_turns.append({"role": turn["role"], "content": content})

    return relevant_turns


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
        logger.warning("[AI Adapter] Query rejected: No Groq AI model is configured.")
        return {
            "success": False,
            "answer": (
                "### Groq Cloud Unavailable\n\n"
                "CogniFlow is ready to answer general questions, but no Groq API key is currently configured.\n\n"
                "**How to Enable:**\n"
                "1. Add your Groq API key to the repository-root `.env` file (`GROQ_API_KEY=gsk_...`).\n"
                "2. Restart the backend: `uvicorn backend.main:app --reload`.\n\n"
                "Free API keys can be generated at [console.groq.com](https://console.groq.com/keys)."
            ),
            "error": "No Groq API key configured. Set GROQ_API_KEY in repository-root .env.",
            "solver": "general_llm",
            "model": None,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "counting_method": "unavailable",
            "engine": "Unconfigured Groq Cloud",
            "processing_time_ms": elapsed_ms,
            "fallback_used": False
        }

    # Build messages list with concise system prompt and filtered conversation history
    default_system = (
        "You are CogniFlow, an expert technical assistant. "
        "Provide accurate, clear, and direct answers with Markdown formatting. "
        "Do not output incomplete code or placeholders."
    )
    messages = [{"role": "system", "content": system_prompt or default_system}]

    # Filter conversation history for token optimization and relevance
    filtered_history = filter_relevant_history(prompt, conversation_history)
    for msg in filtered_history:
        messages.append(msg)

    # Append the current prompt
    messages.append({"role": "user", "content": prompt})

    logger.info(
        f"[AI Adapter] Dispatching request to Groq | model='{config.model}' | "
        f"messages_count={len(messages)} | relevant_history_turns={len(filtered_history)}"
    )

    # Execute Groq call
    res = _query_openai_compatible(config, messages, prompt, start_time)

    # If call failed or returned error, return immediately
    if not res.get("success"):
        return res

    # Answer Quality Verification
    answer_text = res.get("answer", "")
    is_valid, quality_issue = validate_response_quality(prompt, answer_text)

    if not is_valid:
        logger.warning(
            f"[AI Adapter] Answer quality check failed: '{quality_issue}'. "
            "Executing single targeted retry (max_retries=1)..."
        )
        retry_messages = list(messages)
        retry_messages.append({"role": "assistant", "content": answer_text})
        retry_messages.append({
            "role": "user",
            "content": f"The response was incomplete ({quality_issue}). Please provide the complete, functional, step-by-step answer without any placeholders."
        })

        retry_res = _query_openai_compatible(config, retry_messages, prompt, start_time)
        if retry_res.get("success"):
            # Aggregate token usage across both calls without double-counting
            first_p = res.get("prompt_tokens", 0)
            first_c = res.get("completion_tokens", 0)
            second_p = retry_res.get("prompt_tokens", 0)
            second_c = retry_res.get("completion_tokens", 0)

            retry_res["prompt_tokens"] = first_p + second_p
            retry_res["completion_tokens"] = first_c + second_c
            retry_res["total_tokens"] = retry_res["prompt_tokens"] + retry_res["completion_tokens"]
            retry_res["llm_calls"] = 2
            return retry_res
        else:
            return retry_res

    res["llm_calls"] = 1
    return res


def _query_openai_compatible(
    config: AIConfig,
    messages: List[Dict[str, str]],
    raw_prompt: str,
    start_time: float
) -> Dict[str, Any]:
    """Sends chat completions request to any OpenAI-compatible endpoint."""
    endpoint = f"{config.base_url}/chat/completions"

    try:
        configured_max_tokens = int(os.environ.get("AI_MAX_TOKENS", "768"))
    except ValueError:
        configured_max_tokens = 768

    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": max(100, min(configured_max_tokens, 1024))
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

        if e.code == 404 and config.provider == "groq" and config.model != "qwen/qwen3.8-27b":
            logger.warning(
                f"[AI Adapter] Groq model '{config.model}' was not found (HTTP 404). "
                "Retrying request with supported model 'qwen/qwen3.8-27b'..."
            )
            fallback_config = AIConfig(
                provider=config.provider,
                api_key=config.api_key,
                base_url=config.base_url,
                model="qwen/qwen3.8-27b",
                timeout_seconds=config.timeout_seconds,
                is_configured=config.is_configured,
                display_name="Groq Cloud (qwen/qwen3.8-27b)"
            )
            fb_res = _query_openai_compatible(fallback_config, messages, raw_prompt, start_time)
            if fb_res.get("success"):
                fb_res["fallback_used"] = True
            return fb_res

        if e.code == 429:
            # Check if Groq requested reducing max_tokens
            if "reduce max_tokens" in err_body.lower() and payload.get("max_tokens", 768) > 350:
                logger.warning("[AI Adapter] Rate limiter requested smaller max_tokens. Retrying with max_tokens=350...")
                reduced_payload = dict(payload)
                reduced_payload["max_tokens"] = 350
                try:
                    retry_req = urllib.request.Request(
                        endpoint,
                        data=json.dumps(reduced_payload).encode("utf-8"),
                        headers=headers,
                        method="POST"
                    )
                    with urllib.request.urlopen(retry_req, timeout=config.timeout_seconds) as resp2:
                        if resp2.status == 200:
                            data2 = json.loads(resp2.read().decode("utf-8"))
                            choices2 = data2.get("choices", [])
                            if choices2:
                                answer2 = choices2[0].get("message", {}).get("content", "").strip() or choices2[0].get("text", "").strip()
                                usage2 = data2.get("usage", {})
                                p_tok = int(usage2.get("prompt_tokens", 0))
                                c_tok = int(usage2.get("completion_tokens", 0))
                                t_tok = int(usage2.get("total_tokens", p_tok + c_tok))
                                elapsed_ms2 = round((time.perf_counter() - start_time) * 1000, 2)
                                return {
                                    "success": True,
                                    "answer": answer2,
                                    "error": None,
                                    "solver": "general_llm",
                                    "model": data2.get("model", config.model),
                                    "prompt_tokens": p_tok,
                                    "completion_tokens": c_tok,
                                    "total_tokens": t_tok,
                                    "counting_method": "actual" if (p_tok > 0 or c_tok > 0) else "estimated",
                                    "engine": config.display_name,
                                    "processing_time_ms": elapsed_ms2,
                                    "fallback_used": True
                                }
                except Exception:
                    pass

            wait_match = re.search(r"try again in (\d+(?:\.\d+)?)\s*s", err_body, re.IGNORECASE)
            if wait_match:
                wait_sec = float(wait_match.group(1))
                if wait_sec <= 2.5:
                    logger.info(f"[AI Adapter] Waiting {wait_sec:.2f}s for rate limit recovery...")
                    time.sleep(wait_sec + 0.1)
                    try:
                        retry_req = urllib.request.Request(endpoint, data=req_data, headers=headers, method="POST")
                        with urllib.request.urlopen(retry_req, timeout=config.timeout_seconds) as resp3:
                            if resp3.status == 200:
                                data3 = json.loads(resp3.read().decode("utf-8"))
                                choices3 = data3.get("choices", [])
                                if choices3:
                                    answer3 = choices3[0].get("message", {}).get("content", "").strip() or choices3[0].get("text", "").strip()
                                    usage3 = data3.get("usage", {})
                                    p_tok = int(usage3.get("prompt_tokens", 0))
                                    c_tok = int(usage3.get("completion_tokens", 0))
                                    t_tok = int(usage3.get("total_tokens", p_tok + c_tok))
                                    elapsed_ms3 = round((time.perf_counter() - start_time) * 1000, 2)
                                    return {
                                        "success": True,
                                        "answer": answer3,
                                        "error": None,
                                        "solver": "general_llm",
                                        "model": data3.get("model", config.model),
                                        "prompt_tokens": p_tok,
                                        "completion_tokens": c_tok,
                                        "total_tokens": t_tok,
                                        "counting_method": "actual" if (p_tok > 0 or c_tok > 0) else "estimated",
                                        "engine": config.display_name,
                                        "processing_time_ms": elapsed_ms3,
                                        "fallback_used": True
                                    }
                    except Exception:
                        pass

            err_msg = (
                f"Rate Limit Exceeded (HTTP 429) on {config.provider}: output token budget reached (1,000 OTPM on Groq free tier). "
                "Please wait a few moments and retry."
            )
        elif e.code in [401, 403]:
            err_msg = (
                f"Authentication Error (HTTP {e.code}): Invalid or missing API key for {config.provider}. "
                "Please verify your credentials in .env."
            )
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
