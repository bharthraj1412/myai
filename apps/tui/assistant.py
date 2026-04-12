"""Local voice assistant controller for AG3NT.

This module adds a standalone, local-first assistant CLI that can:
- run against the local AG3NT Gateway, or
- talk directly to provider APIs such as Claude/OpenAI/OpenRouter/Groq.

It keeps configuration in the user's home directory and falls back to text
mode when voice libraries are unavailable.
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

import httpx

try:
    import speech_recognition as sr
except ImportError:  # pragma: no cover - optional dependency
    sr = None

from .gateway import GatewayClient, discover_gateway_url


CONFIG_DIR = Path.home() / ".ag3nt"
CONFIG_FILE = CONFIG_DIR / "voice_assistant.json"


@dataclass
class AssistantConfig:
    """Configuration for the local assistant controller."""

    provider: str = "gateway"
    model: str = "claude-3-5-sonnet"
    api_key: str = ""
    gateway_url: str = ""
    base_url: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    voice_input: bool = True
    voice_output: bool = True


class AssistantConfigManager:
    """Load and save assistant configuration."""

    def __init__(self) -> None:
        CONFIG_DIR.mkdir(exist_ok=True)

    def load(self) -> AssistantConfig:
        if CONFIG_FILE.exists():
            try:
                raw_config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
                raw_config["max_tokens"] = self.normalize_max_tokens(raw_config.get("max_tokens", 2048))
                return AssistantConfig(**raw_config)
            except Exception:
                pass

        provider = os.getenv("AG3NT_ASSISTANT_PROVIDER", "gateway")
        gateway_url = os.getenv("AG3NT_GATEWAY_URL", discover_gateway_url())
        model = os.getenv("AG3NT_ASSISTANT_MODEL", self.default_model(provider))
        api_key = os.getenv(self.api_key_env(provider), "")

        return AssistantConfig(
            provider=provider,
            model=model,
            api_key=api_key,
            gateway_url=gateway_url,
            base_url=os.getenv("AG3NT_CUSTOM_MODEL_URL", "https://integrate.api.nvidia.com/v1")
            if provider == "custom"
            else "",
            temperature=float(os.getenv("AG3NT_ASSISTANT_TEMPERATURE", "0.7")),
            max_tokens=self.normalize_max_tokens(int(os.getenv("AG3NT_ASSISTANT_MAX_TOKENS", "2048"))),
            voice_input=os.getenv("AG3NT_ASSISTANT_VOICE_INPUT", "true").lower() == "true",
            voice_output=os.getenv("AG3NT_ASSISTANT_VOICE_OUTPUT", "true").lower() == "true",
        )

    def save(self, config: AssistantConfig) -> None:
        CONFIG_FILE.write_text(json.dumps(asdict(config), indent=2), encoding="utf-8")

    @staticmethod
    def api_key_env(provider: str) -> str:
        mapping = {
            "anthropic": "ANTHROPIC_API_KEY",
            "openai": "OPENAI_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "groq": "GROQ_API_KEY",
            "custom": "AG3NT_CUSTOM_API_KEY",
        }
        return mapping.get(provider, f"{provider.upper()}_API_KEY")

    @staticmethod
    def normalize_max_tokens(value: int) -> int:
        return max(256, min(value, 8192))

    @staticmethod
    def default_model(provider: str) -> str:
        mapping = {
            "gateway": "local-agent",
            "anthropic": "claude-3-5-sonnet",
            "openai": "gpt-4o",
            "openrouter": "anthropic/claude-3.5-sonnet",
            "groq": "llama-3.1-70b-versatile",
            "custom": "qwen/qwen3-coder-480b-a35b-instruct",
        }
        return mapping.get(provider, "claude-3-5-sonnet")


class VoiceIO:
    """Voice input and output helpers."""

    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled and sr is not None
        self._recognizer = sr.Recognizer() if self.enabled else None

    async def listen(self, timeout: float = 10.0) -> Optional[str]:
        if not self.enabled:
            return None

        try:
            with sr.Microphone() as source:
                print("🎤 Listening...")
                self._recognizer.adjust_for_ambient_noise(source, duration=0.8)
                audio = self._recognizer.listen(source, timeout=timeout)
            text = self._recognizer.recognize_google(audio)
            print(f"📝 You said: {text}")
            return text
        except Exception as exc:
            print(f"⚠️  Voice input unavailable: {exc}")
            return None

    @staticmethod
    def speak(text: str) -> None:
        if not text:
            return

        try:
            if platform.system() == "Darwin":
                subprocess.run(["say", text], check=False)
                return

            if platform.system() == "Windows":
                try:
                    import pyttsx3

                    engine = pyttsx3.init()
                    engine.say(text)
                    engine.runAndWait()
                    return
                except Exception:
                    escaped = text.replace("'", "''")
                    subprocess.run(
                        [
                            "powershell",
                            "-NoProfile",
                            "-Command",
                            f"Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('{escaped}')",
                        ],
                        check=False,
                    )
                    return

            subprocess.run(["espeak", text], check=False)
        except Exception:
            pass


class ProviderBase:
    def __init__(self, config: AssistantConfig) -> None:
        self.config = config

    async def chat(self, message: str, history: list[dict[str, str]]) -> str:
        raise NotImplementedError


class GatewayProvider(ProviderBase):
    def __init__(self, config: AssistantConfig) -> None:
        super().__init__(config)
        self._gateway = GatewayClient(url=self._resolve_gateway_url(config.gateway_url))

    @staticmethod
    def _resolve_gateway_url(preferred_url: str) -> str:
        if preferred_url:
            candidate = preferred_url.rstrip("/")
            try:
                response = httpx.get(f"{candidate}/api/health", timeout=2.0)
                if response.status_code == 200:
                    return candidate
            except Exception:
                pass

        return discover_gateway_url()

    async def chat(self, message: str, history: list[dict[str, str]]) -> str:
        result = await self._gateway.chat(message, session_id="voice-assistant")
        if result.get("text"):
            return result["text"]
        if result.get("ok"):
            return "OK"
        return result.get("error", "No response")

    async def close(self) -> None:
        await self._gateway.close()


class AnthropicProvider(ProviderBase):
    async def chat(self, message: str, history: list[dict[str, str]]) -> str:
        try:
            import anthropic
        except ImportError as exc:
            raise RuntimeError("Install anthropic to use the Claude connector.") from exc

        client = anthropic.AsyncAnthropic(api_key=self.config.api_key)
        response = await client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            messages=history + [{"role": "user", "content": message}],
        )
        return "".join(block.text for block in response.content if hasattr(block, "text"))


class OpenAICompatibleProvider(ProviderBase):
    def __init__(self, config: AssistantConfig, base_url: str) -> None:
        super().__init__(config)
        self._base_url = base_url

    async def chat(self, message: str, history: list[dict[str, str]]) -> str:
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise RuntimeError("Install openai to use this connector.") from exc

        client = AsyncOpenAI(api_key=self.config.api_key, base_url=self._base_url)
        response = await client.chat.completions.create(
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            messages=history + [{"role": "user", "content": message}],
        )
        return response.choices[0].message.content or ""


def build_provider(config: AssistantConfig) -> ProviderBase:
    provider = config.provider.lower()
    if provider == "gateway":
        return GatewayProvider(config)
    if provider == "anthropic":
        return AnthropicProvider(config)
    if provider == "openai":
        return OpenAICompatibleProvider(config, "https://api.openai.com/v1")
    if provider == "openrouter":
        return OpenAICompatibleProvider(config, "https://openrouter.ai/api/v1")
    if provider == "groq":
        return OpenAICompatibleProvider(config, "https://api.groq.com/openai/v1")
    if provider == "custom":
        base_url = config.base_url or os.getenv("AG3NT_CUSTOM_MODEL_URL", "https://integrate.api.nvidia.com/v1")
        return OpenAICompatibleProvider(config, base_url)
    raise ValueError(f"Unsupported provider: {config.provider}")


class VoiceAssistantController:
    """Interactive local assistant controller."""

    def __init__(self) -> None:
        self.config_manager = AssistantConfigManager()
        self.config = self.config_manager.load()
        self.voice = VoiceIO(enabled=self.config.voice_input)
        self.provider: ProviderBase | None = None
        self.history: list[dict[str, str]] = []

    async def initialize(self) -> bool:
        if not self.config.api_key and self.config.provider != "gateway":
            self._interactive_setup()
        try:
            self.provider = build_provider(self.config)
            print(f"✓ Assistant ready: {self.config.provider} / {self.config.model}")
            return True
        except Exception as exc:
            print(f"❌ Failed to initialize assistant: {exc}")
            return False

    def _interactive_setup(self) -> None:
        print("\nAG3NT Voice Assistant setup")
        print("1) Gateway (local AG3NT)")
        print("2) Anthropic Claude")
        print("3) OpenAI")
        print("4) OpenRouter")
        print("5) Groq")
        print("6) Custom OpenAI-compatible (NVIDIA/local gateway)")

        choice = input("Choose provider [1]: ").strip() or "1"
        mapping = {
            "1": "gateway",
            "2": "anthropic",
            "3": "openai",
            "4": "openrouter",
            "5": "groq",
            "6": "custom",
        }
        provider = mapping.get(choice, "gateway")
        self.config.provider = provider
        self.config.model = input(f"Model [{self.config_manager.default_model(provider)}]: ").strip() or self.config_manager.default_model(provider)
        if provider != "gateway":
            env_name = self.config_manager.api_key_env(provider)
            self.config.api_key = input(f"API key ({env_name}): ").strip()
            if provider == "custom":
                default_base_url = self.config.base_url or os.getenv("AG3NT_CUSTOM_MODEL_URL", "https://integrate.api.nvidia.com/v1")
                self.config.base_url = input(f"Base URL [{default_base_url}]: ").strip() or default_base_url
                self.config.gateway_url = ""
        else:
            default_url = self.config.gateway_url or discover_gateway_url()
            self.config.gateway_url = input(f"Gateway URL (local AG3NT, e.g. {default_url}) [{default_url}]: ").strip() or default_url
            self.config.base_url = ""
        temp = input(f"Temperature [{self.config.temperature}]: ").strip()
        if temp:
            self.config.temperature = float(temp)
        tokens = input(f"Max tokens [{self.config.max_tokens}]: ").strip()
        if tokens:
            self.config.max_tokens = self.config_manager.normalize_max_tokens(int(tokens))
        else:
            self.config.max_tokens = self.config_manager.normalize_max_tokens(self.config.max_tokens)
        self.config.voice_input = input("Voice input [Y/n]: ").strip().lower() not in {"n", "no"}
        self.config.voice_output = input("Voice output [Y/n]: ").strip().lower() not in {"n", "no"}
        self.config_manager.save(self.config)

    async def ask(self, text: str) -> str:
        if not self.provider:
            raise RuntimeError("Assistant not initialized")
        response = await self.provider.chat(text, self.history)
        self.history.append({"role": "user", "content": text})
        self.history.append({"role": "assistant", "content": response})
        return response

    async def listen_once(self) -> Optional[str]:
        return await self.voice.listen() if self.config.voice_input else None

    def speak(self, text: str) -> None:
        if self.config.voice_output:
            self.voice.speak(text)

    def show_config(self) -> None:
        print(json.dumps(asdict(self.config), indent=2))

    async def run(self) -> None:
        print("\nAG3NT Voice Assistant")
        print("Commands: voice, text, config, setup, clear, exit")

        while True:
            try:
                command = input(">>> ").strip()
                normalized = command.lower()

                if normalized in {"exit", "quit", "q"}:
                    break
                if normalized == "config":
                    self.show_config()
                    continue
                if normalized == "setup":
                    self._interactive_setup()
                    self.provider = build_provider(self.config)
                    self.voice = VoiceIO(enabled=self.config.voice_input)
                    continue
                if normalized == "clear":
                    self.history.clear()
                    print("Conversation cleared")
                    continue
                if normalized in {"voice", "listen", "v"}:
                    spoken = await self.listen_once()
                    if not spoken:
                        continue
                    answer = await self.ask(spoken)
                    print(f"Assistant: {answer}")
                    self.speak(answer)
                    continue
                if normalized in {"text", "t"}:
                    command = input("Message: ").strip()
                    if not command:
                        continue

                if command:
                    answer = await self.ask(command)
                    print(f"Assistant: {answer}")
                    self.speak(answer)
            except KeyboardInterrupt:
                print("\nExiting...")
                break
            except Exception as exc:
                print(f"Error: {exc}")

        if isinstance(self.provider, GatewayProvider):
            await self.provider.close()


async def main() -> None:
    controller = VoiceAssistantController()
    if await controller.initialize():
        await controller.run()


if __name__ == "__main__":
    asyncio.run(main())