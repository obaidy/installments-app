// Metro configuration for Expo + workspaces
// Ensures symlinked packages (like packages/tokens) are resolved and watched
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(projectRoot, 'packages'),
];

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

