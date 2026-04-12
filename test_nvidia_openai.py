
import os
from openai import OpenAI

BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1")
API_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "openai/gpt-oss-120b")  # Change model if needed

if not API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set.")

client = OpenAI(
    base_url=BASE_URL,
    api_key="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"
)

completion = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": "Hello, are you working?"}],
    temperature=1,
    top_p=1,
    max_tokens=4096,
    stream=True
)

for chunk in completion:
    if not getattr(chunk, "choices", None):
        continue
    reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
    if reasoning:
        print(reasoning, end="")
    if chunk.choices and chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
