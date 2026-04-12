# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['assistant_cli.py'],
    pathex=['.'],
    binaries=[],
    datas=[],
    hiddenimports=['apps.tui.assistant', 'apps.tui.gateway', 'speech_recognition', 'pyttsx3'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['IPython', 'matplotlib', 'pandas', 'pytest', 'tensorflow', 'torch', 'numba', 'llvmlite'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AG3NT-Assistant',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
