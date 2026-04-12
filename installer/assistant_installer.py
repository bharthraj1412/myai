"""Standalone installer for AG3NT Assistant on Windows.

This installer copies AG3NT-Assistant.exe into LocalAppData Programs,
creates Start Menu and Desktop shortcuts, supports upgrades, and can uninstall.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

APP_NAME = "AG3NT Assistant"
EXE_NAME = "AG3NT-Assistant.exe"


def _resource_path(filename: str) -> Path:
    """Resolve bundled resource path for PyInstaller and source runs."""
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS) / filename  # type: ignore[attr-defined]
    return Path(__file__).resolve().parents[1] / "dist" / filename


def _target_dirs() -> tuple[Path, Path, Path]:
    local_app_data = Path(
        os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local"))
    )
    program_dir = local_app_data / "Programs" / APP_NAME
    start_menu = local_app_data / "Microsoft" / "Windows" / "Start Menu" / "Programs"
    desktop = Path.home() / "Desktop"
    return program_dir, start_menu, desktop


def _log(message: str, silent: bool) -> None:
    if not silent:
        print(message)


def _remove_file_if_exists(path: Path) -> None:
    try:
        if path.exists():
            path.unlink()
    except Exception:
        pass


def _create_shortcut(shortcut_path: Path, target_exe: Path) -> None:
    """Create a Windows shortcut via PowerShell COM automation."""
    shortcut_path.parent.mkdir(parents=True, exist_ok=True)
    ps_script = (
        "$WshShell = New-Object -ComObject WScript.Shell;"
        f"$Shortcut = $WshShell.CreateShortcut('{str(shortcut_path)}');"
        f"$Shortcut.TargetPath = '{str(target_exe)}';"
        f"$Shortcut.WorkingDirectory = '{str(target_exe.parent)}';"
        "$Shortcut.IconLocation = $Shortcut.TargetPath;"
        "$Shortcut.Save();"
    )
    subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            ps_script,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


def install(*, silent: bool = False, launch: bool = True) -> int:
    source_exe = _resource_path(EXE_NAME)
    if not source_exe.exists():
        _log(f"ERROR: bundled payload not found: {source_exe}", silent)
        return 1

    program_dir, start_menu_dir, desktop_dir = _target_dirs()
    target_exe = program_dir / EXE_NAME

    _log(f"Installing {APP_NAME}...", silent)
    program_dir.mkdir(parents=True, exist_ok=True)

    # Upgrade-safe copy
    temp_exe = program_dir / f"{EXE_NAME}.new"
    shutil.copy2(source_exe, temp_exe)
    if target_exe.exists():
        old_exe = program_dir / f"{EXE_NAME}.old"
        try:
            if old_exe.exists():
                old_exe.unlink()
            target_exe.replace(old_exe)
        except Exception:
            pass
    temp_exe.replace(target_exe)

    start_shortcut = start_menu_dir / f"{APP_NAME}.lnk"
    desktop_shortcut = desktop_dir / f"{APP_NAME}.lnk"

    try:
        _create_shortcut(start_shortcut, target_exe)
        _create_shortcut(desktop_shortcut, target_exe)
    except subprocess.CalledProcessError as exc:
        _log("WARNING: shortcut creation failed.", silent)
        _log(exc.stderr.strip(), silent)

    _log("Install complete.", silent)
    _log(f"Installed to: {target_exe}", silent)
    _log(f"Start Menu shortcut: {start_shortcut}", silent)
    _log(f"Desktop shortcut: {desktop_shortcut}", silent)

    if launch:
        try:
            subprocess.Popen([str(target_exe)], cwd=str(program_dir))
            _log("Launched AG3NT Assistant.", silent)
        except Exception as exc:
            _log(f"WARNING: installed app could not be launched: {exc}", silent)

    return 0


def uninstall(*, silent: bool = False) -> int:
    program_dir, start_menu_dir, desktop_dir = _target_dirs()
    target_exe = program_dir / EXE_NAME
    temp_exe = program_dir / f"{EXE_NAME}.new"
    old_exe = program_dir / f"{EXE_NAME}.old"
    start_shortcut = start_menu_dir / f"{APP_NAME}.lnk"
    desktop_shortcut = desktop_dir / f"{APP_NAME}.lnk"

    _log(f"Uninstalling {APP_NAME}...", silent)

    # Ensure the assistant process is not locking the executable.
    try:
        subprocess.run(
            ["taskkill", "/IM", EXE_NAME, "/F"],
            check=False,
            capture_output=True,
            text=True,
        )
    except Exception:
        pass

    _remove_file_if_exists(start_shortcut)
    _remove_file_if_exists(desktop_shortcut)
    _remove_file_if_exists(target_exe)
    _remove_file_if_exists(temp_exe)
    _remove_file_if_exists(old_exe)

    try:
        if program_dir.exists() and not any(program_dir.iterdir()):
            program_dir.rmdir()
    except Exception:
        pass

    if target_exe.exists():
        _log(
            "WARNING: executable still present. Close AG3NT Assistant and rerun uninstall.",
            silent,
        )
        return 2

    _log("Uninstall complete.", silent)
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="AG3NT-Assistant-Setup")
    parser.add_argument(
        "--silent",
        action="store_true",
        help="Run without progress output",
    )
    parser.add_argument(
        "--no-launch",
        action="store_true",
        help="Do not launch AG3NT Assistant after install",
    )
    parser.add_argument(
        "--uninstall",
        action="store_true",
        help="Uninstall AG3NT Assistant and remove shortcuts",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    if args.uninstall:
        return uninstall(silent=args.silent)
    return install(silent=args.silent, launch=not args.no_launch)


if __name__ == "__main__":
    raise SystemExit(main())
