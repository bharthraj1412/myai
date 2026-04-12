import "dotenv/config";
import { loadConfig } from "./config/loadConfig.js";
import { createGateway } from "./gateway/createGateway.js";

async function isHealthyGatewayRunning(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { ok?: boolean; name?: string };
    return payload.ok === true || payload.name === "ag3nt-gateway";
  } catch {
    return false;
  }
}

async function handleStartupError(err: unknown): Promise<never> {
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/Gateway port\s+(\d+)\s+is already in use/i);

  if (match) {
    const port = Number(match[1]);
    if (Number.isFinite(port) && (await isHealthyGatewayRunning(port))) {
      console.warn(
        `[Gateway] Port ${port} is already in use by a healthy AG3NT gateway instance. Exiting without error.`,
      );
      process.exit(0);
    }
  }

  console.error(err);
  process.exit(1);
}

async function main() {
  const config = await loadConfig();

  if (await isHealthyGatewayRunning(config.gateway.port)) {
    console.warn(
      `[Gateway] Port ${config.gateway.port} is already in use by a healthy AG3NT gateway instance. Exiting without error.`,
    );
    return;
  }

  const gateway = await createGateway(config);
  await gateway.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
