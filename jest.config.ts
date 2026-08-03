import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  projects: [
    // ── Frontend tests (React Testing Library) ──
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["**/__tests__/frontend/**/*.test.{ts,tsx}"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
    // ── API route tests (next-test-api-route-handler) ──
    // [GAP-RESOLVED-9] Uses next-test-api-route-handler instead of Supertest,
    // which does not work with Next.js 14 App Router route handlers.
    {
      displayName: "api",
      testEnvironment: "node",
      preset: "ts-jest",
      testMatch: ["**/__tests__/**/*.test.ts", "!**/__tests__/frontend/**"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/layout.tsx",
    "!src/**/globals.css",
  ],
};

export default createJestConfig(config);
