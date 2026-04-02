#!/usr/bin/env node
/**
 * Run the initial migration against Supabase Postgres.
 *
 * Usage (from project root):
 *   node scripts/run-migration.mjs
 *
 * Requires DATABASE_URL in .env pointing to your Supabase Postgres.
 * If you haven't set DATABASE_URL yet, go to Supabase Dashboard:
 *   Settings → Database → Connection string → URI
 * and paste it into .env
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const postgres = require('postgres');

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// ── Load .env ───────────────────────────────────────────────────
const envFile = readFileSync(join(rootDir, '.env'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const DATABASE_URL = env.DATABASE_URL || env.DIRECT_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env');
  console.error('   Go to Supabase Dashboard → Settings → Database → Connection string');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase Postgres...');
console.log(`   Host: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connect_timeout: 15,
  max: 1,
});

// ── Read migration ──────────────────────────────────────────────
const migrationPath = join(rootDir, 'packages/db/src/migrations/0000_initial.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

try {
  // Test connection first
  const [{ version }] = await sql`SELECT version()`;
  console.log('✅ Connected!');
  console.log(`   ${version.split(',')[0]}\n`);

  // Run the entire migration as a single transaction
  console.log('📄 Running migration 0000_initial.sql ...\n');

  await sql.unsafe(migrationSQL);

  console.log('✅ Migration completed successfully!\n');

  // Verify — list created tables
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  console.log(`📊 Tables in database (${tables.length}):`);
  for (const t of tables) {
    console.log(`   • ${t.tablename}`);
  }

} catch (err) {
  console.error('\n❌ Migration failed:', err.message);

  if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
    console.error('\n💡 The database host could not be reached.');
    console.error('   Check your DATABASE_URL in .env — you may need the correct region.');
    console.error('   Go to: Supabase Dashboard → Settings → Database → Connection string');
  } else if (err.message.includes('password authentication')) {
    console.error('\n💡 Database password is wrong.');
    console.error('   Go to: Supabase Dashboard → Settings → Database → Reset password');
  } else if (err.message.includes('already exists')) {
    console.error('\n💡 Some tables already exist. This is OK if you ran the migration before.');
  }

  process.exit(1);
} finally {
  await sql.end();
}
