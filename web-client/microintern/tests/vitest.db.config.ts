import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.db.ts"],
    include: ["tests/repositories/**/*.test.ts", "tests/db-integration/**/*.test.ts", "tests/api/**/*.test.ts"],
    fileParallelism: false,
    maxConcurrency: 1,
    alias: {
      "@backend": path.resolve(__dirname, "../backend/src"),
      dotenv: path.resolve(__dirname, "../backend/node_modules/dotenv"),
      pg: path.resolve(__dirname, "../backend/node_modules/pg"),
      bcrypt: path.resolve(__dirname, "../node_modules/bcrypt"),
      puppeteer: path.resolve(__dirname, "../backend/node_modules/puppeteer"),
      nodemailer: path.resolve(__dirname, "../backend/node_modules/nodemailer"),
      "google-auth-library": path.resolve(__dirname, "../backend/node_modules/google-auth-library"),
    },
  },
});
