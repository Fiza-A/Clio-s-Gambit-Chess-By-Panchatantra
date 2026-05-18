import { readDb, writeDb, logAction } from '../data/mockDb.js';
import { makeId } from '../utils/id.js';

const byId = (items, id) => items.find((item) => item.id === id);

export const dashboard = (_req, res) => res.json(readDb().dashboards.coach);
export const students = (_req, res) => res.json(readDb().coach.students);
export const student = (req, res) => res.json(byId(readDb().coach.students, req.params.id) || {});
export function notes(req, res) {
  const db = readDb();
  const item = byId(db.coach.students, req.params.id);
  item.notes = req.body.notes;
  logAction(db, 'coach', `Updated notes for ${item.name}`);
  writeDb(db);
  res.json(item);
}
export const classes = (_req, res) => res.json(readDb().coach.classes);
export function createClass(req, res) {
  const db = readDb();
  const item = { id: makeId('class'), status: 'upcoming', resources: [], attendance: [], ...req.body };
  db.coach.classes.unshift(item);
  db.admin.classes.unshift(item);
  logAction(db, 'coach', `Created class ${item.title}`);
  writeDb(db);
  res.status(201).json(item);
}
export const classDetail = (req, res) => res.json(byId(readDb().coach.classes, req.params.id) || {});
export function updateClass(req, res) {
  const db = readDb();
  const item = byId(db.coach.classes, req.params.id);
  Object.assign(item, req.body);
  writeDb(db);
  res.json(item);
}
export function deleteClass(req, res) {
  const db = readDb();
  db.coach.classes = db.coach.classes.filter((item) => item.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
}
export const reminder = (req, res) => res.json({ ok: true, message: `Reminder sent for ${req.params.id}` });
export const liveSessions = (_req, res) => res.json(readDb().coach.liveSessions);
export function startSession(req, res) {
  const db = readDb();
  const item = byId(db.coach.liveSessions, req.params.id);
  item.status = 'live';
  writeDb(db);
  res.json(item);
}
export function endSession(req, res) {
  const db = readDb();
  const item = byId(db.coach.liveSessions, req.params.id);
  item.status = 'ended';
  writeDb(db);
  res.json(item);
}
export const assignments = (_req, res) => res.json(readDb().coach.assignments);
export function createAssignment(req, res) {
  const db = readDb();
  const item = { id: makeId('assign'), submissions: 0, ...req.body };
  db.coach.assignments.unshift(item);
  writeDb(db);
  res.status(201).json(item);
}
export function reviewSubmission(req, res) {
  const db = readDb();
  const item = byId(db.coach.submissions, req.params.id);
  Object.assign(item, { reviewed: true, feedback: req.body.feedback || 'Reviewed' });
  writeDb(db);
  res.json(item);
}
export const resources = (_req, res) => res.json(readDb().coach.resources);
export function createResource(req, res) {
  const db = readDb();
  const item = { id: makeId('res'), uploadedAt: new Date().toISOString().slice(0, 10), ...req.body };
  db.coach.resources.unshift(item);
  writeDb(db);
  res.status(201).json(item);
}
export const messages = (_req, res) => res.json(readDb().coach.messages);
export function sendMessage(req, res) {
  const db = readDb();
  const conv = byId(db.coach.messages, req.params.conversationId);
  conv.messages.push({ from: 'Coach Arvind', text: req.body.text });
  writeDb(db);
  res.json(conv);
}
export function report(req, res) {
  const db = readDb();
  const item = { id: makeId('report'), generatedAt: new Date().toISOString(), ...req.body };
  db.coach.reports.unshift(item);
  writeDb(db);
  res.json(item);
}
export function settings(req, res) {
  const db = readDb();
  Object.assign(db.coach.settings, req.body);
  writeDb(db);
  res.json(db.coach.settings);
}
