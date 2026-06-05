import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "prisma/",
        "**/*.config.*",
        "**/page.tsx",
        "**/layout.tsx",
        "**/route.ts",
        "**/loading.tsx",
        "**/not-found.tsx",
        "**/error.tsx",
      ],
    },
  },
});
