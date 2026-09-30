import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    alias: {
      "@backend": path.resolve(__dirname, "../backend/src"),
      bcrypt: path.resolve(__dirname, "../node_modules/bcrypt"),
      puppeteer: path.resolve(__dirname, "../backend/node_modules/puppeteer"),
      nodemailer: path.resolve(__dirname, "../backend/node_modules/nodemailer"),
      "google-auth-library": path.resolve(__dirname, "../backend/node_modules/google-auth-library"),
    },
  },
});
