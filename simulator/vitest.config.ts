import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["server/**/*.test.ts", "src/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    environment: "node",
    fileParallelism: false,
  },
});
