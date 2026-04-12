"""Model configuration and creation for AG3NT.

Extracted from deepagents_runtime.py for maintainability.
Provides model provider detection, configuration, and instance creation.
"""

from __future__ import annotations

import logging
import os

from langchain_core.language_models import BaseChatModel

logger = logging.getLogger("ag3nt.model")

# ---------------------------------------------------------------------------
# Model instance cache – avoids re-creating on every agent rebuild
# ---------------------------------------------------------------------------
_model_cache: dict[str, BaseChatModel] = {}


def _is_placeholder_key(value: str | None) -> bool:
    """Return True when a key is empty or clearly a template placeholder."""
    key = (value or "").strip().lower()
    if not key:
        return True
    return any(
        marker in key
        for marker in (
            "your-key",
            "your-openai-key",
            "your-openrouter-key",
            "your-nvidia-key",
            "your-google-key",
            "your-groq-key",
            "your-key-here",
            "replace-me",
        )
    )


def get_model_config() -> tuple[str, str]:
    """Get the model provider and name from environment.

    Returns:
        Tuple of (provider, model_name)
    """
    provider = os.environ.get("AG3NT_MODEL_PROVIDER")
    model = os.environ.get("AG3NT_MODEL_NAME")

    if not provider:
        # Check for custom provider first
        if os.environ.get("AG3NT_CUSTOM_MODEL_URL") and not _is_placeholder_key(
            os.environ.get("AG3NT_CUSTOM_API_KEY")
        ):
            provider = "custom"
        elif not _is_placeholder_key(os.environ.get("OPENROUTER_API_KEY")):
            provider = "openrouter"
        elif not _is_placeholder_key(os.environ.get("ANTHROPIC_API_KEY")):
            provider = "anthropic"
        elif not _is_placeholder_key(os.environ.get("OPENAI_API_KEY")):
            provider = "openai"
        elif not _is_placeholder_key(os.environ.get("GOOGLE_API_KEY")):
            provider = "google"
        elif not _is_placeholder_key(os.environ.get("KIMI_API_KEY")):
            provider = "kimi"
        else:
            provider = "anthropic"

    if not model:
        defaults = {
            "custom": os.environ.get("AG3NT_CUSTOM_MODEL_NAME", "default"),
            "openrouter": "moonshotai/kimi-k2.5",
            "anthropic": "claude-sonnet-4-5-20250929",
            "openai": "gpt-4o",
            "google": "gemini-pro",
            "kimi": "kimi-latest",
        }
        model = defaults.get(provider, "claude-sonnet-4-5-20250929")

    return provider, model


def _create_openrouter_model(model_name: str) -> BaseChatModel:
    """Create a ChatOpenAI instance configured for OpenRouter."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    base_url = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable is required when using OpenRouter. "
            "Get your API key from https://openrouter.ai/keys"
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=base_url,
        default_headers={
            "HTTP-Referer": "https://github.com/ag3nt",
            "X-Title": "AG3NT",
        },
    )


def _create_kimi_model(model_name: str) -> BaseChatModel:
    """Create a ChatOpenAI instance configured for Kimi (Moonshot AI)."""
    api_key = os.environ.get("KIMI_API_KEY")
    if not api_key:
        raise ValueError(
            "KIMI_API_KEY environment variable is required when using Kimi. "
            "Get your API key from https://platform.moonshot.cn/"
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base="https://api.moonshot.cn/v1",
    )


def _create_openai_compatible_model(model_name: str) -> BaseChatModel:
    """Create a ChatOpenAI instance for OpenAI-compatible endpoints.

    Reads configuration from environment variables:
      - OPENAI_API_KEY: Required API key
      - OPENAI_BASE_URL: Optional base URL (defaults to OpenAI)

    This allows direct use of compatible providers such as NVIDIA's
    integrate endpoint while keeping provider selection in AG3NT.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is required when using OpenAI-compatible models."
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=base_url,
    )


def _create_custom_model(model_name: str) -> BaseChatModel:
    """Create a ChatOpenAI instance for a custom OpenAI-compatible endpoint.

    Reads configuration from environment variables:
      - AG3NT_CUSTOM_MODEL_URL: Base URL (e.g. http://localhost:11434/v1)
      - AG3NT_CUSTOM_API_KEY: API key (optional for local endpoints)
      - AG3NT_CUSTOM_MODEL_NAME: Model name (e.g. llama3:8b)
    """
    base_url = os.environ.get("AG3NT_CUSTOM_MODEL_URL", "")
    api_key = os.environ.get("AG3NT_CUSTOM_API_KEY", "not-needed")
    custom_model = os.environ.get("AG3NT_CUSTOM_MODEL_NAME", model_name)

    if not base_url:
        raise ValueError(
            "AG3NT_CUSTOM_MODEL_URL environment variable is required "
            "when using a custom model provider."
        )

    # Normalize: ensure URL doesn't end with /chat/completions
    base_url = base_url.rstrip("/")
    if base_url.endswith("/chat/completions"):
        base_url = base_url[: -len("/chat/completions")]

    if _is_placeholder_key(api_key):
        # Local endpoints (Ollama/LM Studio) may not need an API key.
        local_markers = ("localhost", "127.0.0.1", "0.0.0.0")
        if not any(marker in base_url.lower() for marker in local_markers):
            logger.warning(
                "AG3NT custom provider is using a placeholder API key for a remote endpoint. "
                "Set AG3NT_CUSTOM_API_KEY to a real key to avoid authorization failures."
            )
        api_key = "not-needed"

    from langchain_openai import ChatOpenAI

    logger.info(
        "Creating custom model: %s at %s",
        custom_model,
        base_url,
    )

    return ChatOpenAI(
        model=custom_model,
        openai_api_key=api_key,
        openai_api_base=base_url,
    )


def invalidate_cache(provider: str | None = None) -> None:
    """Clear cached model instances.

    Args:
        provider: If given, only clear entries matching this provider prefix.
                  If None, clear the entire cache.
    """
    global _model_cache
    if provider is None:
        _model_cache.clear()
        logger.info("Model cache cleared entirely")
    else:
        keys_to_remove = [k for k in _model_cache if k.startswith(f"{provider}:")]
        for key in keys_to_remove:
            del _model_cache[key]
        logger.info("Cleared %d cached entries for provider '%s'", len(keys_to_remove), provider)


def create_model(*, use_cache: bool = True) -> BaseChatModel | str:
    """Create the appropriate model instance based on provider.

    Args:
        use_cache: If True (default), return a cached instance when the
                   provider+model combination has been created before.

    Returns:
        Either a BaseChatModel instance (for OpenRouter, Kimi, Custom)
        or a string in ``"provider:model"`` format for LangChain's
        ``init_chat_model()``.
    """
    provider, model_name = get_model_config()
    cache_key = f"{provider}:{model_name}"

    if use_cache and cache_key in _model_cache:
        logger.debug("Returning cached model instance for %s", cache_key)
        return _model_cache[cache_key]

    if provider == "custom":
        instance = _create_custom_model(model_name)
        _model_cache[cache_key] = instance
        return instance

    if provider == "openrouter":
        instance = _create_openrouter_model(model_name)
        _model_cache[cache_key] = instance
        return instance

    if provider == "kimi":
        instance = _create_kimi_model(model_name)
        _model_cache[cache_key] = instance
        return instance

    if provider == "openai":
        instance = _create_openai_compatible_model(model_name)
        _model_cache[cache_key] = instance
        return instance

    # For other providers, return "provider:model" string
    return f"{provider}:{model_name}"
