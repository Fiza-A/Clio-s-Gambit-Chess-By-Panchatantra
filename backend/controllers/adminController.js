import { readDb, writeDb } from '../data/mockDb.js';
import { makeId } from '../utils/id.js';

const byId = (items, id) => items.find((item) => item.id === id);
const crud = (section) => ({
  list: (_req, res) => res.json(readDb().admin[section]),
  create: (req, res) => {
    const db = readDb();
    const item = { id: makeId(section), ...req.body };
    db.admin[section].unshift(item);
    writeDb(db);
    res.status(201).json(item);
  },
  update: (req, res) => {
    const db = readDb();
    const item = byId(db.admin[section], req.params.id);
    Object.assign(item, req.body);
    writeDb(db);
    res.json(item);
  },
  remove: (req, res) => {
    const db = readDb();
    db.admin[section] = db.admin[section].filter((item) => item.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  }
});

export const dashboard = (_req, res) => res.json(readDb().dashboards.admin);
export const users = crud('users');
export const user = (req, res) => res.json(byId(readDb().admin.users, req.params.id) || {});
export const stories = crud('stories');
export const principles = crud('principles');
export const puzzles = crud('puzzles');
export const classes = crud('classes');
export const achievements = crud('achievements');
export const curriculum = (_req, res) => res.json(readDb().admin.curriculum);
export function createModule(req, res) {
  const db = readDb();
  const item = { id: makeId('module'), order: db.admin.curriculum.modules.length + 1, ...req.body };
  db.admin.curriculum.modules.push(item);
  writeDb(db);
  res.status(201).json(item);
}
export function updateModule(req, res) {
  const db = readDb();
  Object.assign(byId(db.admin.curriculum.modules, req.params.id), req.body);
  writeDb(db);
  res.json(byId(db.admin.curriculum.modules, req.params.id));
}
export function deleteModule(req, res) {
  const db = readDb();
  db.admin.curriculum.modules = db.admin.curriculum.modules.filter((item) => item.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
}
export const analytics = (_req, res) => res.json(readDb().admin.analytics);
export function report(req, res) {
  res.json({ id: makeId('admin-report'), generatedAt: new Date().toISOString(), summary: 'Academy report generated.', filters: req.body });
}
export const rolesPermissions = (_req, res) => res.json(readDb().admin.rolesPermissions);
export function updateRolesPermissions(req, res) {
  const db = readDb();
  db.admin.rolesPermissions = req.body;
  writeDb(db);
  res.json(db.admin.rolesPermissions);
}
export function settings(req, res) {
  const db = readDb();
  Object.assign(db.admin.settings, req.body);
  writeDb(db);
  res.json(db.admin.settings);
}
