const path = require('path');
const fs = require('fs');

// Load env from repo root so admin-web has access to shared variables in monorepo
try {
  const rootEnv = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
  }
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;

