#!/usr/bin/env python3
"""OpenAI-compatible smoke test for custom providers (e.g. NVIDIA integrate API).

Usage:
  set OPENAI_API_KEY=nvapi-...
  python python/openai_compatible_smoke_test.py --prompt "Hello"

Optional overrides:
  --base-url https://integrate.api.nvidia.com/v1
  --model openai/gpt-oss-120b
  --temperature 1
  --top-p 1
  --max-tokens 4096
"""

from __future__ import annotations

import argparse
import os
import sys

from openai import OpenAI


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OpenAI-compatible streaming smoke test")
    parser.add_argument("--base-url", default="https://integrate.api.nvidia.com/v1")
    parser.add_argument("--model", default="openai/gpt-oss-120b")
    parser.add_argument("--prompt", default="Say connection successful.")
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--top-p", type=float, default=1.0)
    parser.add_argument("--max-tokens", type=int, default=4096)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("Missing OPENAI_API_KEY (or NVIDIA_API_KEY) environment variable.", file=sys.stderr)
        return 2

    client = OpenAI(base_url=args.base_url, api_key=api_key)

    stream = client.chat.completions.create(
        model=args.model,
        messages=[{"role": "user", "content": args.prompt}],
        temperature=args.temperature,
        top_p=args.top_p,
        max_tokens=args.max_tokens,
        stream=True,
    )

    for chunk in stream:
        if not getattr(chunk, "choices", None):
            continue

        delta = chunk.choices[0].delta
        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            print(reasoning, end="")

        if delta.content is not None:
            print(delta.content, end="")

    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
