# Scripts Directory (`scripts/`)

Automation and helper scripts for AG3NT development and deployment.

---

## Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `build.sh` | Build all packages | `bash scripts/build.sh` |
| `test.sh` | Run all tests | `bash scripts/test.sh` |
| `deploy.sh` | Deploy to production | `bash scripts/deploy.sh` |
| `setup.sh` | Initial setup | `bash scripts/setup.sh` |
| `clean.sh` | Clean build artifacts | `bash scripts/clean.sh` |

---

## Common Commands

### Build

```bash
# Build all packages
bash scripts/build.sh

# Or use pnpm directly
pnpm build
```

### Test

```bash
# Run all tests
bash scripts/test.sh

# Or run specific test suite
cd apps/gateway && pnpm test
cd apps/ui && pnpm test:e2e
```

### Deploy

```bash
# Deploy to production
bash scripts/deploy.sh

# Deploy to specific environment
bash scripts/deploy.sh --env production
```

### Initial Setup

```bash
# Complete setup from scratch
bash scripts/setup.sh

# This typically:
# 1. Installs dependencies (pnpm install)
# 2. Creates virtual environment (Python)
# 3. Builds packages
# 4. Initializes database
```

### Clean

```bash
# Clean up build artifacts and caches
bash scripts/clean.sh

# This typically:
# 1. Removes node_modules/
# 2. Removes .next/ builds
# 3. Removes Python __pycache__/
# 4. Removes dist/ folders
```

---

## Writing Custom Scripts

Scripts should:

1. **Be portable** - Work on Windows (PowerShell) and Unix (Bash)
2. **Check dependencies** - Verify prerequisites exist
3. **Handle errors** - Exit with appropriate error codes
4. **Log clearly** - Show progress to user

Example:

```bash
#!/bin/bash
set -e  # Exit on error

echo "Building AG3NT..."

# Check dependencies
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm not found. Install with: npm install -g pnpm"
  exit 1
fi

# Build
echo "Installing dependencies..."
pnpm install

echo "Building packages..."
pnpm build

echo "✓ Build complete"
```

---

## Related Documentation

- **[GETTING_STARTED.md](../GETTING_STARTED.md)** - Setup guide
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Deployment instructions
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Development workflow

