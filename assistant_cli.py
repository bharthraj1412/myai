"""Windows executable entrypoint for AG3NT Assistant."""

from __future__ import annotations

import asyncio

from apps.tui.assistant import main as assistant_main


if __name__ == "__main__":
    asyncio.run(assistant_main())
