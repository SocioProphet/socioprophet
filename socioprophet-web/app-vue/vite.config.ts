import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

// Dev proxy: forward /api to the Express server (PORT env, default 5050).
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": { target: `http://localhost:${process.env.API_PORT || 5050}`, changeOrigin: true },
    },
  },
  build: { outDir: "dist" },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
