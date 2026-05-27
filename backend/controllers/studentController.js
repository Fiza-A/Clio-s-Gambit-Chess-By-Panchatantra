import { readDb, writeDb, logAction, findStoryById, updateStoryProgress } from '../data/mockDb.js';
import { query } from '../data/database.js';
import { T, mapStudentStory } from '../data/dbSchema.js';
import { comparePrincipleRowsById, ensureCurriculumIdsReady } from '../data/curriculumIds.js';
import {
  fetchStoryModulesList,
  fetchStoryModuleDetail,
  fetchModuleChapters,
  fetchChapterStories,
  fetchStoryForReading,
  logStudentError,
  EMPTY_MODULE_PAYLOAD,
} from '../services/studentCurriculumService.js';

const byId = (items, id) => items.find((item) => item.id === id);

export const dashboard = (_req, res) => res.json(readDb().dashboards.student);
export const stories = (_req, res) => res.json(readDb().student.stories);

export async function storyModules(_req, res) {
  const route = '/story-modules';
  try {
    const modules = await fetchStoryModulesList();
    res.json(modules);
  } catch (err) {
    logStudentError(route, err);
    res.status(500).json({ error: 'Failed to fetch modules', details: err.message });
  }
}

export async function storyModule(req, res) {
  const { moduleId } = req.params;
  const route = `/story-modules/${moduleId}`;
  try {
    const payload = await fetchStoryModuleDetail(moduleId);
    if (payload.notFound) {
      return res.status(404).json({ error: 'Module not found', ...EMPTY_MODULE_PAYLOAD });
    }
    res.json({
      module: payload.module,
      chapters: payload.chapters,
      stories: payload.stories,
    });
  } catch (err) {
    logStudentError(route, err, { moduleId });
    res.status(500).json({
      error: 'Failed to fetch module',
      details: err.message,
      ...EMPTY_MODULE_PAYLOAD,
    });
  }
}

export async function moduleChapters(req, res) {
  const { moduleId } = req.params;
  const route = `/story-modules/${moduleId}/chapters`;
  try {
    const payload = await fetchModuleChapters(moduleId);
    if (payload.notFound) {
      return res.status(404).json({ error: 'Module not found', chapters: [] });
    }
    res.json(payload.chapters);
  } catch (err) {
    logStudentError(route, err, { moduleId });
    res.status(500).json({ error: 'Failed to fetch chapters', details: err.message });
  }
}

export function chapterDetail(req, res) {
  return res.status(410).json({ error: 'Use chapter stories endpoint' });
}

export async function chapterStories(req, res) {
  const { moduleId, chapterId } = req.params;
  const route = `/story-modules/${moduleId}/chapters/${chapterId}/stories`;
  try {
    const payload = await fetchChapterStories(moduleId, chapterId);
    if (payload.notFound) {
      return res.status(404).json({
        error: payload.notFoundKind === 'chapter' ? 'Chapter not found' : 'Module not found',
        module: payload.module || {},
        chapter: payload.chapter || {},
        stories: [],
      });
    }
    res.json({
      module: payload.module,
      chapter: payload.chapter,
      stories: payload.stories,
    });
  } catch (err) {
    logStudentError(route, err, { moduleId, chapterId });
    res.status(500).json({
      error: 'Failed to fetch chapter stories',
      details: err.message,
      module: {},
      chapter: {},
      stories: [],
    });
  }
}

export async function story(req, res) {
  const route = `/stories/${req.params.id}`;
  try {
    const { id } = req.params;
    const db = readDb();

    const payload = await fetchStoryForReading(id);
    if (!payload.notFound) {
      return res.json(payload);
    }

    const found = findStoryById(db, id);
    if (!found) return res.status(404).json({ error: 'Story not found' });

    const story = found.story;
    return res.json({
      story: {
        ...story,
        storyId: story.id,
        storyTitle: story.title,
        introduction: story.subtitle || story.body?.slice(0, 200) || '',
        panchatantraLesson: story.lesson,
        storyImages: story.storyImages || [],
      },
      module: {
        id: found.module.id,
        title: found.module.title,
        name: found.module.title,
      },
      chapter: {
        id: found.chapter.id,
        title: found.chapter.title,
        name: found.chapter.title,
      },
      principles: [],
      messages: [{ storyId: story.id, text: story.body || '', principleId: null, principleName: null }],
      storyImages: story.storyImages || [],
      navigation: { prevStoryId: null, nextStoryId: null },
    });
  } catch (err) {
    logStudentError(route, err);
    res.status(500).json({ error: 'Failed to fetch story', details: err.message });
  }
}

export async function storyProgress(req, res) {
  const route = `/stories/${req.params.id}/progress`;
  try {
    const { id } = req.params;
    const db = readDb();
    const hasProgress = req.body.progress !== undefined && req.body.progress !== null;
    const hasReadPage = req.body.readPage !== undefined && req.body.readPage !== null;
    const progress = hasProgress
      ? Math.max(0, Math.min(100, Number(req.body.progress)))
      : undefined;
    const readPage = hasReadPage
      ? Math.max(0, Math.floor(Number(req.body.readPage)))
      : undefined;

    let mockFound = findStoryById(db, id);
    if (mockFound) {
      if (progress !== undefined) {
        mockFound = updateStoryProgress(db, id, progress);
      }
      if (readPage !== undefined && mockFound) {
        if (!db.student.storyProgressById) db.student.storyProgressById = {};
        const prev = db.student.storyProgressById[id] || {};
        db.student.storyProgressById[id] = {
          progress: progress !== undefined ? progress : Number(prev.progress ?? mockFound.story.progress ?? 0),
          readPage,
        };
        mockFound.story.readPage = readPage;
      }
      logAction(db, 'student', `Updated story ${mockFound.story.title}`);
      writeDb(db);
      return res.json({
        story: mockFound.story,
        module: { ...mockFound.module, chapters: undefined },
        chapter: { ...mockFound.chapter, stories: undefined },
      });
    }

    const storyResult = await query(
      `SELECT s.storyid, s.storytitle, s.storydescription, s.storytext, s.chapterid,
              c.chaptername, m.moduleid, m.modulename
       FROM ${T.stories} s
       LEFT JOIN ${T.chapter} c ON s.chapterid = c.chapterid
       LEFT JOIN ${T.module} m ON c.moduleid = m.moduleid
       WHERE s.storyid = $1`,
      [id],
    );
    if (storyResult.rows.length === 0) return res.status(404).json({ error: 'Story not found' });

    if (!db.student.storyProgressById) db.student.storyProgressById = {};
    const prev = db.student.storyProgressById[id] || {};
    db.student.storyProgressById[id] = {
      progress: progress !== undefined ? progress : Number(prev.progress ?? 0),
      readPage: readPage !== undefined ? readPage : Number(prev.readPage ?? 0),
    };
    writeDb(db);

    const row = storyResult.rows[0];
    const mapped = mapStudentStory(row, db);
    logAction(db, 'student', `Updated story ${mapped.title}`);

    res.json({
      story: mapped,
      module: { id: row.moduleid, title: row.modulename },
      chapter: { id: row.chapterid, title: row.chaptername },
    });
  } catch (err) {
    logStudentError(route, err);
    res.status(500).json({ error: 'Failed to update story progress', details: err.message });
  }
}

export const principles = async (_req, res) => {
  try {
    await ensureCurriculumIdsReady();
    const result = await query(
      `SELECT principleid AS id, principlename AS name FROM ${T.principles}`,
    );
    res.json([...result.rows].sort(comparePrincipleRowsById));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const principle = async (req, res) => {
  try {
    const result = await query(
      `SELECT principleid AS id, principlename AS name FROM ${T.principles} WHERE principleid = $1`,
      [req.params.id],
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export function learned(req, res) {
  const db = readDb();
  const item = byId(db.student.principles, req.params.id);
  if (!item) return res.status(404).json({ error: 'Principle not found' });
  item.learned = req.body.learned ?? true;
  logAction(db, 'student', `Marked principle ${item.name}`);
  writeDb(db);
  res.json(item);
}

export async function puzzles(_req, res) {
  try {
    const result = await query(
      'SELECT chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer FROM public.chess_puzzle ORDER BY chess_puzzle_id ASC',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function puzzle(req, res) {
  try {
    const result = await query(
      'SELECT chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer FROM public.chess_puzzle WHERE chess_puzzle_id = $1',
      [req.params.id],
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function submitPuzzle(req, res) {
  const db = readDb();
  const item = byId(db.student.puzzles, req.params.id);
  if (!item) return res.status(404).json({ error: 'Puzzle not found' });
  const correct = req.body.solution?.toLowerCase() === item.solution?.toLowerCase();
  logAction(db, 'student', `Submitted puzzle ${item.title}`);
  res.json({ correct, explanation: correct ? 'Correct tactic.' : 'Not quite. Try again.' });
}

export function classes(_req, res) {
  return res.json(readDb().student.classes);
}

export function classDetail(req, res) {
  return res.json(byId(readDb().student.classes, req.params.id) || {});
}

export function joinClass(req, res) {
  const db = readDb();
  logAction(db, 'student', `Joined class ${req.params.id}`);
  res.json({ ok: true, meetingLink: 'https://meet.example.com/live-class' });
}

export function profile(_req, res) {
  return res.json(readDb().student.profile);
}

export function updateProfile(req, res) {
  const db = readDb();
  Object.assign(db.student.profile, req.body);
  writeDb(db);
  res.json(db.student.profile);
}

export function mistakes(_req, res) {
  return res.json(readDb().student.mistakes);
}

export const achievements = (_req, res) => res.json(readDb().student.achievements);
export const analytics = (_req, res) => res.json(readDb().student.analytics);
