/**
 * Jest Setup — Silence console noise during tests
 * Only console.error passes through (real problems)
 */
process.env.SUPPRESS_JEST_WARNINGS = "true";
console.log = () => {};
console.warn = () => {};
