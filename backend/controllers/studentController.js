import { readDb, writeDb, logAction, findChapter, findModule, findStoryById, updateStoryProgress } from '../data/mockDb.js';
import { query } from '../data/database.js';

const byId = (items, id) => items.find((item) => item.id === id);

export const dashboard = (_req, res) => res.json(readDb().dashboards.student);
export const stories = (_req, res) => res.json(readDb().student.stories);

export async function storyModules(_req, res) {
  try {
    const result = await query('SELECT * FROM "module" ORDER BY created_at');
    const modules = result.rows.map(m => ({
      id: m.module_id,
      title: m.module_name,
      subtitle: 'Ancient wisdom for modern play',
      description: 'Explore tactical and strategic concepts through Panchatantra stories.',
      icon: '♜',
      level: 'Intermediate',
      progress: 0,
      totalChapters: 3,
      totalStories: 10,
      unlocked: true
    }));
    res.json(modules);
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
}

export async function storyModule(req, res) {
  try {
    const { moduleId } = req.params;
    const moduleResult = await query('SELECT * FROM "module" WHERE module_id = $1', [moduleId]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: 'Module not found' });
    
    const m = moduleResult.rows[0];
    const chapterIds = JSON.parse(m.chapter_ids.replace(/'/g, '"').replace('[', '["').replace(']', '"]').replace(/, /g, '", "'));
    
    const chaptersResult = await query('SELECT * FROM "chapter" WHERE chapter_id = ANY($1)', [chapterIds]);
    
    const module = {
      id: m.module_id,
      title: m.module_name,
      chapters: chaptersResult.rows.map(c => ({
        id: c.chapter_id,
        title: c.chapter_name,
        progress: 0,
        totalStories: 5,
        stories: [] // Stories would be another table or part of chapter
      }))
    };
    
    res.json(module);
  } catch (err) {
    console.error('Error fetching module:', err);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
}

export async function moduleChapters(req, res) {
  try {
    const { moduleId } = req.params;
    const moduleResult = await query('SELECT * FROM "module" WHERE module_id = $1', [moduleId]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: 'Module not found' });
    
    const m = moduleResult.rows[0];
    const chapterIds = JSON.parse(m.chapter_ids.replace(/'/g, '"').replace('[', '["').replace(']', '"]').replace(/, /g, '", "'));
    
    const chaptersResult = await query('SELECT * FROM "chapter" WHERE chapter_id = ANY($1)', [chapterIds]);
    
    res.json(chaptersResult.rows.map(c => ({
      id: c.chapter_id,
      title: c.chapter_name,
      progress: 0,
      totalStories: 5
    })));
  } catch (err) {
    console.error('Error fetching chapters:', err);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
}

export function chapterDetail(req, res) {
  const db = readDb();
  const module = findModule(db, req.params.moduleId);
  const chapter = findChapter(db, req.params.moduleId, req.params.chapterId);
  if (!module || !chapter) return res.status(404).json({ error: 'Chapter not found' });
  return res.json({ module: { ...module, chapters: undefined }, chapter });
}
export function chapterStories(req, res) {
  const db = readDb();
  const module = findModule(db, req.params.moduleId);
  const chapter = findChapter(db, req.params.moduleId, req.params.chapterId);
  if (!module || !chapter) return res.status(404).json({ error: 'Chapter not found' });
  return res.json({ module: { ...module, chapters: undefined }, chapter: { ...chapter, stories: undefined }, stories: chapter.stories });
}
export function story(req, res) {
  const found = findStoryById(readDb(), req.params.id);
  if (!found) return res.status(404).json({ error: 'Story not found' });
  return res.json({
    story: found.story,
    module: { ...found.module, chapters: undefined },
    chapter: { ...found.chapter, stories: undefined }
  });
}
export function storyProgress(req, res) {
  const db = readDb();
  const found = updateStoryProgress(db, req.params.id, req.body.progress);
  if (!found) return res.status(404).json({ error: 'Story not found' });
  logAction(db, 'student', `Updated story ${found.story.title}`);
  writeDb(db);
  res.json({ story: found.story, module: found.module, chapter: found.chapter });
}
export const principles = (_req, res) => res.json(readDb().student.principles);
export const principle = (req, res) => res.json(byId(readDb().student.principles, req.params.id) || {});
export function learned(req, res) {
  const db = readDb();
  const item = byId(db.student.principles, req.params.id);
  item.learned = req.body.learned ?? true;
  logAction(db, 'student', `Marked principle ${item.name}`);
  writeDb(db);
  res.json(item);
}
export const puzzles = (_req, res) => res.json(readDb().student.puzzles);
export const puzzle = (req, res) => res.json(byId(readDb().student.puzzles, req.params.id) || {});
export function submitPuzzle(req, res) {
  const db = readDb();
  const item = byId(db.student.puzzles, req.params.id);
  const move = `${req.body.from || ''}-${req.body.to || ''}`.toLowerCase();
  const correct = move === item.expectedMove.toLowerCase();
  if (correct) {
    item.solved = true;
    db.student.profile.points += item.reward;
    db.student.profile.streak += 1;
    db.dashboards.student.stats[1].value = String(Number(db.dashboards.student.stats[1].value) + 1);
    db.dashboards.student.stats[2].value = '88%';
  } else {
    db.student.mistakes.unshift({ id: `mistake-${Date.now()}`, puzzle: item.title, theme: item.theme, note: `Submitted ${move || 'empty move'}`, reviewed: false });
  }
  logAction(db, 'student', `${correct ? 'Solved' : 'Missed'} puzzle ${item.title}`);
  writeDb(db);
  res.json({ correct, puzzle: item, profile: db.student.profile, message: correct ? item.explanation : 'Not quite. Review this mistake and try again.' });
}
export const achievements = (_req, res) => res.json(readDb().student.achievements);
export const analytics = (_req, res) => res.json(readDb().student.analytics);
export const classes = (_req, res) => res.json(readDb().student.classes);
export const classDetail = (req, res) => res.json(byId(readDb().student.classes, req.params.id) || {});
export function joinClass(req, res) {
  const db = readDb();
  const item = byId(db.student.classes, req.params.id);
  logAction(db, 'student', `Joined class ${item.title}`);
  writeDb(db);
  res.json({ ok: true, room: item.meetingLink, class: item });
}
export const profile = (_req, res) => res.json(readDb().student.profile);
export function updateProfile(req, res) {
  const db = readDb();
  Object.assign(db.student.profile, req.body);
  writeDb(db);
  res.json(db.student.profile);
}
export const mistakes = (_req, res) => res.json(readDb().student.mistakes);
