/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  // Prevent loading Next.js / React modules in server tests
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  // Clear mocks between tests
  clearMocks: true,
  // Timeout for async tests
  testTimeout: 10000,
  // Timer-based tests leave handles open — force exit after all tests
  forceExit: true,
  // Silence console.log/warn during tests (only show errors)
  setupFiles: ["<rootDir>/__tests__/setup.js"],
};
