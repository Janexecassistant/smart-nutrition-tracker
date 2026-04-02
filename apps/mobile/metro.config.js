const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ── Watch folders ────────────────────────────────────────────────
// Only watch the specific workspace packages we import, not everything
config.watchFolders = [
  path.resolve(monorepoRoot, "packages/shared"),
];

// ── Module resolution ────────────────────────────────────────────
// Tell Metro where to find node_modules (app-level first, then root)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Resolve symlinks so Metro can follow Bun's hoisted packages
config.resolver.unstable_enableSymlinks = true;

// ── Block scanning heavy/irrelevant directories ──────────────────
config.resolver.blockList = [
  // Other apps — Metro doesn't need to watch these
  /apps\/web\/.*/,
  /apps\/api\/.*/,
  // Heavy packages not used by mobile
  /packages\/db\/.*/,
  /packages\/nutrition\/.*/,
  /packages\/suggestions\/.*/,
  /packages\/ui\/.*/,
  // Bun lock file (can confuse Metro)
  /bun\.lockb/,
  // Prevent scanning .git
  /\.git\/.*/,
];

// ── Transformer ──────────────────────────────────────────────────
// Increase timeout for monorepo resolution
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
};

module.exports = config;
