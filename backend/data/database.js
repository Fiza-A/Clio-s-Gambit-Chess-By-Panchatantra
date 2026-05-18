import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
import { adminDashboard, coachDashboard, studentDashboard } from './dashboardData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

export async function query(text, params) {
  return pool.query(text, params);
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
