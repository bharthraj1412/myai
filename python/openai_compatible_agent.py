"""OpenAI-compatible chat client for AG3NT.

This script is environment-driven so model, endpoint, and generation settings
can be changed at any time without editing code.
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI


DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "qwen/qwen3-coder-480b-a35b-instruct"


def _get_env(name: str, default: str = "") -> str:
    value = os.getenv(name, default).strip()
    return value


def _is_placeholder_key(value: str) -> bool:
    key = value.strip().lower()
    if not key:
        return True
    return any(
        marker in key
        for marker in (
            "your-key",
            "your-openai-key",
            "your-nvidia-key",
            "your-key-here",
            "replace-me",
        )
    )


def _get_float(name: str, default: float) -> float:
    raw = _get_env(name, str(default))
    try:
        return float(raw)
    except ValueError:
        return default


def _get_int(name: str, default: int) -> int:
    raw = _get_env(name, str(default))
    try:
        return int(raw)
    except ValueError:
        return default


def build_client() -> OpenAI:
    api_key = _get_env("OPENAI_API_KEY") or _get_env("AG3NT_CUSTOM_API_KEY")
    if _is_placeholder_key(api_key):
        raise RuntimeError(
            "Missing or placeholder API key. Set OPENAI_API_KEY or AG3NT_CUSTOM_API_KEY in .env."
        )

    base_url = _get_env("OPENAI_BASE_URL") or _get_env("AG3NT_CUSTOM_MODEL_URL", DEFAULT_BASE_URL)
    return OpenAI(base_url=base_url, api_key=api_key)


def main() -> int:
    load_dotenv()

    prompt = " ".join(sys.argv[1:]).strip() or "Say hello from AG3NT custom agent mode."
    model = (
        _get_env("OPENAI_MODEL")
        or _get_env("AG3NT_CUSTOM_MODEL_NAME")
        or _get_env("AG3NT_MODEL_NAME")
        or DEFAULT_MODEL
    )

    temperature = _get_float("AG3NT_MODEL_TEMPERATURE", 0.7)
    top_p = _get_float("AG3NT_MODEL_TOP_P", 0.8)
    max_tokens = _get_int("AG3NT_MODEL_MAX_TOKENS", 4096)

    client = build_client()

    completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        stream=True,
    )

    for chunk in completion:
        if chunk.choices and chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="")

    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
