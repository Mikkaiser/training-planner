import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// .mts so Vite loads it as ESM; a .ts config here is read as CommonJS and warns.
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Excluded on purpose: scripts/verify/* drive a real browser, a real
    // database and a real bucket. They are verification, not unit tests, and
    // run separately via `pnpm verify`.
    exclude: ["node_modules/**", ".next/**", "scripts/**"],
  },
});
