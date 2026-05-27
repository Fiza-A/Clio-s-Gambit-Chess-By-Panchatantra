import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminDashboard, coachDashboard, studentDashboard } from './dashboardData.js';
import { readDb, writeDb } from './mockDb.js';
import { buildSchemaInfo } from './schemaAdapter.js';

let cachedSchema = null;

export async function getDbSchema() {
  if (cachedSchema) return cachedSchema;
  const tablesRes = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  cachedSchema = buildSchemaInfo(tablesRes.rows.map((r) => r.tablename));
  return cachedSchema;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function resolveConnectionString() {
  const raw = process.env.DATABASE_URL || process.env.DATABASE_POOLER_URL;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':6543') && !trimmed.includes('pgbouncer=')) {
    return trimmed.includes('?') ? `${trimmed}&pgbouncer=true` : `${trimmed}?pgbouncer=true`;
  }
  return trimmed;
}

const connectionString = resolveConnectionString();

function maskConnectionString(url) {
  if (!url) return '(not set)';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? '***@' : ''}${u.host}${u.pathname}`;
  } catch {
    return '(invalid URL)';
  }
}

console.log('[DATABASE] Connecting to Supabase (PostgreSQL)...');
console.log('[DATABASE] Target:', maskConnectionString(connectionString));
console.log('[DATABASE] DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('[DATABASE] DATABASE_POOLER_URL set:', !!process.env.DATABASE_POOLER_URL);

const { Pool } = pg;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('[DATABASE] Unexpected pool error:', err.message);
  });
  console.log('[DATABASE] Supabase connection pool created');
} else {
  console.error('[DATABASE] No DATABASE_URL or DATABASE_POOLER_URL — API database queries will fail');
}

export async function verifyDatabaseConnection() {
  if (!pool) {
    return { ok: false, error: 'DATABASE_URL is not configured in backend/.env' };
  }
  try {
    const res = await pool.query('SELECT current_database() AS db, NOW() AS server_time');
    const schema = await getDbSchema();

    const count = async (table) => {
      try {
        const rel = table === 'Login' ? 'public."Login"' : `public.${table}`;
        const r = await pool.query(`SELECT COUNT(*)::int AS n FROM ${rel}`);
        return r.rows[0]?.n ?? 0;
      } catch {
        return null;
      }
    };

    const counts = {
      modules: schema.hasModule ? await count('module') : null,
      chapters: schema.hasChapter ? await count('chapter') : null,
      stories: schema.hasStories ? await count('stories') : null,
      principles: schema.hasPrinciples ? await count('principles') : null,
      users: schema.hasLogin ? await count('Login') : null,
    };

    return {
      ok: schema.curriculumReady && schema.hasLogin,
      database: res.rows[0]?.db,
      serverTime: res.rows[0]?.server_time,
      schema,
      counts,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function query(text, params) {
  if (!pool) {
    throw new Error('Database not configured. Set DATABASE_URL in backend/.env');
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[DATABASE] Query error:', err.message);
    throw err;
  }
}

export function getDashboard(role) {
  if (role === 'admin') return adminDashboard;
  if (role === 'coach') return coachDashboard;
  return studentDashboard;
}

export function getCollection(name) {
  return readDb().collections[name] || [];
}

export function recordAction({ role, action, label, payload = {} }) {
  const db = readDb();
  const entry = {
    id: `action-${Date.now()}`,
    role,
    action,
    label,
    payload,
    createdAt: new Date().toISOString(),
  };

  db.collections.actionLog.unshift(entry);
  db.collections.actionLog = db.collections.actionLog.slice(0, 50);

  if (action === 'create-class') {
    const title = payload.title || 'New Strategy Class';
    db.collections.classes.unshift({
      id: `class-${Date.now()}`,
      title,
      time: payload.time || '7:00 PM',
      students: payload.students || 10,
    });
    db.dashboards.coach.recentActivity.unshift({ title: `${title} created`, time: 'Just now', icon: 'calendar' });
  }

  writeDb(db);
  return entry;
}

export function buildReport(role) {
  const db = readDb();
  return {
    role,
    timestamp: new Date().toISOString(),
    dashboard: db.dashboards[role],
    collections: db.collections,
  };
}
