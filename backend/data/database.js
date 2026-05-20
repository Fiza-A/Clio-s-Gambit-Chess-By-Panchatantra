import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminDashboard, coachDashboard, studentDashboard } from './dashboardData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('[DATABASE] Connecting to Supabase (PostgreSQL)...');
console.log('[DATABASE] DATABASE_URL present:', !!process.env.DATABASE_URL);

// PostgreSQL Pool
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

if (pool) {
  console.log('[DATABASE] Supabase Connection Pool created');
}

export async function query(text, params) {
  console.log(`[DATABASE] Executing Query: ${text}`);
  if (params) console.log(`[DATABASE] With Params: ${JSON.stringify(params)}`);

  try {
    const res = await pool.query(text, params);
    console.log(`[DATABASE] Supabase Result: ${res.rows.length} rows returned`);
    return res;
  } catch (err) {
    console.error('[DATABASE] Supabase Query Error:', err);
    throw err;
  }
}

// Keeping mock data for dashboards temporarily as they are not fully migrated to SQL yet
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
