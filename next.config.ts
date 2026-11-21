import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/catalog.json is read from disk at runtime by src/lib/catalog.server.ts.
  outputFileTracingIncludes: {
    "/": ["./data/catalog.json", "./data/packs.json"],
    "/packs/[slug]": ["./data/catalog.json", "./data/packs.json"],
    "/api/skills": ["./data/catalog.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
