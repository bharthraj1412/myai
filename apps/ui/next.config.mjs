/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent Next.js from inferring an incorrect workspace root when other lockfiles exist on disk.
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.fides-cdn.ethyca.com/ https://*.vercel.sh/ https://*.vercel.com/ https://vercel.com/",
              "connect-src 'self' http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* ws://158.101.33.117:* wss://158.101.33.117:* http://158.101.33.117:* https://158.101.33.117:* https://openrouter.ai/ https://vercel.live/ https://vercel.com/ https://*.vercel.com/ https://*.vercel.sh/ https://vitals.vercel-insights.com/ https://*.pusher.com/ https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://blobs.vusercontent.net wss://*.pusher.com/ https://fides-vercel.us.fides.ethyca.com/api/v1/ https://cdn-api.ethyca.com/location https://privacy-vercel.us.fides.ethyca.com/api/v1/ https://api.getkoala.com https://*.sentry.io/api/ https://v0chat.vercel.sh/ https://api.v0.dev/ https://*.v0.dev/ https://vercel.fides-cdn.ethyca.com/ data: blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://*.vusercontent.net https://*.v0.dev https://v0.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
