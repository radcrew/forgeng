import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// In production the app (Vercel) and the API (Render) are different registrable
// domains, so cookies the API sets are host-only to Render and `proxy.ts` can
// never read them — every protected route bounces back to /sign-in. Serving the
// API from this origin fixes that: the browser attributes the API's cookies to
// this domain. Set NEXT_PUBLIC_API_URL="" in the deployed env so the client
// builds relative `/api/...` URLs that this rewrite picks up.
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "https://forgeng-backend.onrender.com";

const nextConfig: NextConfig = {
  // This app lives in a monorepo; point Turbopack at the workspace root
  // so it resolves the hoisted node_modules correctly.
  turbopack: {
    root: path.join(dirname, "..", ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Returning an array applies these after the filesystem check, so the app's
  // own /api/auth/exchange route handler still wins over this catch-all.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
