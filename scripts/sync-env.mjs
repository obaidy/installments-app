#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dotenvPath = path.join(root, '.env');
if (!fs.existsSync(dotenvPath)) {
  console.error('No .env found at project root');
  process.exit(1);
}
const raw = fs.readFileSync(dotenvPath, 'utf8');
const env = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim();
      return [k, v];
    }),
);

const supabaseUrl = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnon = env.SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const nextEnv = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnon}\n`;

const adminDir = path.join(root, 'admin-web');
const adminEnvLocal = path.join(adminDir, '.env.local');
fs.writeFileSync(adminEnvLocal, nextEnv);
console.log('Wrote admin-web/.env.local with NEXT_PUBLIC_* vars');

