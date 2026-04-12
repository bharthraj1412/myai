"""Allow running as: python -m apps.tui [--assistant]"""

from __future__ import annotations

import argparse
import asyncio

from .app import main as run_tui
from .assistant import main as run_assistant


def main() -> None:
    parser = argparse.ArgumentParser(prog="apps.tui")
    parser.add_argument(
        "--assistant",
        action="store_true",
        help="Run the local voice assistant controller instead of the TUI",
    )
    args = parser.parse_args()

    if args.assistant:
        asyncio.run(run_assistant())
    else:
        run_tui()


if __name__ == "__main__":
    main()
