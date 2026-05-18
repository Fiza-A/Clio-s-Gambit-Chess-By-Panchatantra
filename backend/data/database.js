import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { adminDashboard, coachDashboard, studentDashboard } from './dashboardData.js';

dotenv.config();

console.log(`[DATABASE] Initialization - DB_TYPE: ${process.env.DB_TYPE || 'postgres (default)'}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');
const sqliteDbPath = path.resolve(__dirname, '../../database.db');

const useLocalDb = process.env.DB_TYPE === 'sqlite';

// PostgreSQL Pool
const { Pool } = pg;
const pool = useLocalDb ? null : new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (!useLocalDb && pool) {
  console.log('[DATABASE] PostgreSQL Pool created');
}

// SQLite Connection
const localDb = useLocalDb ? new sqlite3.Database(sqliteDbPath, (err) => {
  if (err) console.error('[DATABASE] SQLite Connection Error:', err);
  else console.log('[DATABASE] SQLite Connected successfully at:', sqliteDbPath);
}) : null;

export async function query(text, params) {
  console.log(`[DATABASE] Executing Query: ${text}`);
  if (params) console.log(`[DATABASE] With Params: ${JSON.stringify(params)}`);

  if (useLocalDb) {
    return new Promise((resolve, reject) => {
      const sqliteQuery = text.replace(/\$(\d+)/g, '?');
      localDb.all(sqliteQuery, params, (err, rows) => {
        if (err) {
          console.error('[DATABASE] SQLite Query Error:', err);
          reject(err);
        } else {
          console.log(`[DATABASE] SQLite Result: ${rows.length} rows returned`);
          resolve({ rows });
        }
      });
    });
  }
  
  try {
    const res = await pool.query(text, params);
    console.log(`[DATABASE] PostgreSQL Result: ${res.rows.length} rows returned`);
    return res;
  } catch (err) {
    console.error('[DATABASE] PostgreSQL Query Error:', err);
    throw err;
  }
}

const seed = {
  dashboards: {
    admin: adminDashboard,
    coach: coachDashboard,
    student: studentDashboard,
  },
  collections: {
    users: [],
    stories: [],
    puzzles: [],
    classes: [],
    resources: [],
    actionLog: [],
  },
};

function ensureDatabase() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
  }
}

export function readDb() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

export function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return db;
}

export function getDashboard(role) {
  // For now, keep returning from JSON, but we could migrate to SQL
  return readDb().dashboards[role];
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
