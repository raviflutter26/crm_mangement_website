import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        // Node environment: these tests cover pure logic, not components.
        // Add jsdom here if component tests are introduced later.
        environment: "node",
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
    resolve: {
        // Mirror the "@/*" path alias from tsconfig.
        alias: { "@": path.resolve(__dirname, "src") },
    },
});
