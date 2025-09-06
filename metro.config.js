// metro.config.js
// Safe config for Expo + (optional) workspaces. Avoids custom serializer tweaks
// that can cause "path.relative(..., undefined)" crashes, and only enables
// symlink/workspace support if a `packages/` directory actually exists.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

module.exports = (() => {
  const projectRoot = __dirname;
  const config = getDefaultConfig(projectRoot);

  // Only add workspace settings if ./packages exists
  const packagesDir = path.resolve(projectRoot, 'packages');
  if (fs.existsSync(packagesDir)) {
    config.watchFolders = [...(config.watchFolders || []), packagesDir];
    config.resolver.unstable_enableSymlinks = true;
    config.resolver.unstable_enablePackageExports = true;
  } else {
    // If you don't have a monorepo, don't enable these
    if (config.resolver) {
      delete config.resolver.unstable_enableSymlinks;
      delete config.resolver.unstable_enablePackageExports;
    }
  }

  // Keep Metro serializer/transformer defaults (custom ones often cause undefined paths)
  if (config.serializer) {
    delete config.serializer.getModulesRunBeforeMainModule;
    delete config.serializer.createModuleIdFactory;
  }
  delete config.transformer?.getTransformOptions;

  return config;
})();
