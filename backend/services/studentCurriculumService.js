import { readDb } from '../data/mockDb.js';
import { query } from '../data/database.js';
import { T, mapStudentStory, normalizeStoryImages } from '../data/dbSchema.js';
import { compareModuleRowsById, compareStoryRowsById } from '../data/curriculumIds.js';

function logStudent(route, message, extra) {
  const suffix = extra ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[student${route}] ${message}${suffix}`);
}

function logStudentError(route, err, extra) {
  console.error(`[student${route}] ${err.message}`, {
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    position: err.position,
    ...extra,
  });
}

function avgProgress(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function mapStudentModule(meta) {
  return {
    id: meta.moduleid,
    title: meta.modulename,
    subtitle: 'Ancient wisdom for modern play',
    description: 'Explore tactical and strategic concepts through Panchatantra stories.',
    icon: '♜',
    level: 'Intermediate',
    progress: meta.progress ?? 0,
    totalChapters: meta.totalChapters ?? 0,
    totalStories: meta.totalStories ?? 0,
    unlocked: true,
  };
}

export function mapStudentChapter(chapter, storiesCount, progress) {
  return {
    id: chapter.chapterid,
    title: chapter.chaptername,
    subtitle: '',
    description: '',
    progress: progress ?? 0,
    totalStories: storiesCount ?? 0,
  };
}

const EMPTY_MODULE_PAYLOAD = { module: {}, chapters: [], stories: [] };

/** List all modules with chapter/story counts (new schema columns). */
export async function fetchStoryModulesList() {
  const modulesRes = await query(`
    SELECT
      m.moduleid,
      m.modulename,
      COUNT(DISTINCT c.chapterid)::int AS total_chapters,
      COUNT(DISTINCT s.storyid)::int AS total_stories
    FROM ${T.module} m
    LEFT JOIN ${T.chapter} c ON c.moduleid = m.moduleid
    LEFT JOIN ${T.stories} s ON s.chapterid = c.chapterid
    GROUP BY m.moduleid, m.modulename
    ORDER BY m.modulename ASC
  `);

    const modules = [...modulesRes.rows].sort(compareModuleRowsById).map((m) => mapStudentModule({
    moduleid: m.moduleid,
    modulename: m.modulename,
    progress: 0,
    totalChapters: m.total_chapters || 0,
    totalStories: m.total_stories || 0,
  }));

  if (!modules.length) {
    logStudent('/story-modules', 'No rows in module table — student list will be empty');
  }

  return modules;
}

/**
 * Module detail: { module, chapters, stories }
 * Joins: chapter.moduleid → module.moduleid, stories.chapterid → chapter.chapterid
 */
export async function fetchStoryModuleDetail(moduleId) {
  const route = `/story-modules/${moduleId}`;

  const moduleRes = await query(
    `SELECT moduleid, modulename FROM ${T.module} WHERE moduleid = $1`,
    [moduleId],
  );
  if (!moduleRes.rows.length) {
    logStudent(route, 'Module not found');
    return { notFound: true, ...EMPTY_MODULE_PAYLOAD };
  }

  const rowsRes = await query(
    `
    SELECT
      m.moduleid,
      m.modulename,
      c.chapterid,
      c.chaptername,
      s.storyid,
      s.storytitle,
      s.storydescription,
      s.storytext,
      s.chapterid AS story_chapterid
    FROM ${T.module} m
    LEFT JOIN ${T.chapter} c ON c.moduleid = m.moduleid
    LEFT JOIN ${T.stories} s ON s.chapterid = c.chapterid
    WHERE m.moduleid = $1
    ORDER BY c.chaptername ASC NULLS LAST, s.storytitle ASC NULLS LAST
    `,
    [moduleId],
  );

  const db = readDb();
  const chaptersMap = new Map();
  const stories = [];

  for (const row of rowsRes.rows) {
    if (row.chapterid && !chaptersMap.has(row.chapterid)) {
      chaptersMap.set(row.chapterid, {
        chapterid: row.chapterid,
        chaptername: row.chaptername,
        storyProgress: [],
      });
    }

    if (row.storyid) {
      const story = mapStudentStory(
        {
          storyid: row.storyid,
          storytitle: row.storytitle,
          storydescription: row.storydescription,
          storytext: row.storytext,
        },
        db,
      );
      stories.push({ ...story, chapterId: row.story_chapterid });
      const ch = chaptersMap.get(row.chapterid);
      if (ch) ch.storyProgress.push(story.progress);
    }
  }

  const chapters = [...chaptersMap.values()].map((ch) =>
    mapStudentChapter(
      { chapterid: ch.chapterid, chaptername: ch.chaptername },
      ch.storyProgress.length,
      avgProgress(ch.storyProgress),
    ),
  );

  const moduleProgress = avgProgress(stories.map((s) => s.progress));

  const module = mapStudentModule({
    moduleid: moduleRes.rows[0].moduleid,
    modulename: moduleRes.rows[0].modulename,
    progress: moduleProgress,
    totalChapters: chapters.length,
    totalStories: stories.length,
  });

  logStudent(route, 'OK', {
    chapters: chapters.length,
    stories: stories.length,
  });

  return { module, chapters, stories };
}

export async function fetchModuleChapters(moduleId) {
  const moduleRes = await query(
    `SELECT moduleid, modulename FROM ${T.module} WHERE moduleid = $1`,
    [moduleId],
  );
  if (!moduleRes.rows.length) return { notFound: true, chapters: [] };

  const rowsRes = await query(
    `
    SELECT c.chapterid, c.chaptername, s.storyid
    FROM ${T.chapter} c
    LEFT JOIN ${T.stories} s ON s.chapterid = c.chapterid
    WHERE c.moduleid = $1
    ORDER BY c.chaptername ASC, s.storytitle ASC NULLS LAST
    `,
    [moduleId],
  );

  const db = readDb();
  const chaptersMap = new Map();

  for (const row of rowsRes.rows) {
    if (!chaptersMap.has(row.chapterid)) {
      chaptersMap.set(row.chapterid, {
        chapterid: row.chapterid,
        chaptername: row.chaptername,
        storyProgress: [],
      });
    }
    if (row.storyid) {
      chaptersMap.get(row.chapterid).storyProgress.push(
        Number(db?.student?.storyProgressById?.[row.storyid]?.progress ?? 0),
      );
    }
  }

  const chapters = [...chaptersMap.values()].map((ch) =>
    mapStudentChapter(
      { chapterid: ch.chapterid, chaptername: ch.chaptername },
      ch.storyProgress.length,
      avgProgress(ch.storyProgress),
    ),
  );

  return { chapters };
}

export async function fetchChapterStories(moduleId, chapterId) {
  const moduleRes = await query(
    `SELECT moduleid, modulename FROM ${T.module} WHERE moduleid = $1`,
    [moduleId],
  );
  if (!moduleRes.rows.length) {
    return { notFound: true, notFoundKind: 'module', module: {}, chapter: {}, stories: [] };
  }

  const m = moduleRes.rows[0];
  const chapterRes = await query(
    `SELECT chapterid, chaptername, moduleid FROM ${T.chapter} WHERE chapterid = $1 AND moduleid = $2`,
    [chapterId, moduleId],
  );
  if (!chapterRes.rows.length) {
    return {
      notFound: true,
      notFoundKind: 'chapter',
      module: { id: m.moduleid, title: m.modulename },
      chapter: {},
      stories: [],
    };
  }

  const storiesRes = await query(
    `
    SELECT storyid, storytitle, storydescription, storytext, chapterid
    FROM ${T.stories}
    WHERE chapterid = $1
    ORDER BY storytitle ASC
    `,
    [chapterId],
  );

  const db = readDb();
  const stories = storiesRes.rows.map((row) => mapStudentStory(row, db));
  const c = chapterRes.rows[0];

  return {
    module: { id: m.moduleid, title: m.modulename },
    chapter: {
      id: c.chapterid,
      title: c.chaptername,
      subtitle: '',
      description: '',
      progress: avgProgress(stories.map((s) => s.progress)),
    },
    stories,
  };
}

/** Full payload for student story reading page (messages, images, chapter navigation). */
export async function fetchStoryForReading(storyId) {
  const storyResult = await query(
    `
    SELECT s.storyid, s.storytitle, s.storydescription, s.storytext, s.storyimages, s.chapterid,
           c.chapterid AS ch_id, c.chaptername, m.moduleid, m.modulename
    FROM ${T.stories} s
    LEFT JOIN ${T.chapter} c ON s.chapterid = c.chapterid
    LEFT JOIN ${T.module} m ON c.moduleid = m.moduleid
    WHERE s.storyid = $1
    `,
    [storyId],
  );

  if (!storyResult.rows.length) {
    return { notFound: true };
  }

  const row = storyResult.rows[0];
  const chapterId = row.chapterid || row.ch_id;
  const db = readDb();

  const messagesRes = await query(
    `
    SELECT s.storyid, s.storytext, s.storydescription, s.storyimages,
           p.principleid, p.principlename
    FROM ${T.stories} s
    LEFT JOIN ${T.storyPrincipleMapping} spm ON spm.storyid = s.storyid
    LEFT JOIN ${T.principles} p ON p.principleid = spm.principleid
    WHERE s.chapterid = $1 AND s.storytitle = $2
    ORDER BY s.storyid ASC
    `,
    [chapterId, row.storytitle],
  );

  const chapterNavRes = await query(
    `SELECT storyid FROM ${T.stories} WHERE chapterid = $1 ORDER BY storyid ASC`,
    [chapterId],
  );

  const storyIds = chapterNavRes.rows.map((r) => r.storyid);
  const currentIndex = storyIds.indexOf(storyId);

  const messages = [...messagesRes.rows]
    .sort(compareStoryRowsById)
    .map((m) => ({
      storyId: m.storyid,
      text: m.storytext || '',
      principleId: m.principleid || null,
      principleName: m.principlename || null,
    }))
    .filter((m) => m.text.trim());

  if (!messages.length) {
    messages.push({
      storyId: row.storyid,
      text: row.storytext || row.storydescription || '',
      principleId: null,
      principleName: null,
    });
  }

  const principlesRes = await query(
    `
    SELECT DISTINCT p.principleid AS id, p.principlename AS name
    FROM ${T.storyPrincipleMapping} spm
    JOIN ${T.principles} p ON p.principleid = spm.principleid
    WHERE spm.storyid = ANY($1::text[])
    ORDER BY p.principlename ASC
    `,
    [messages.map((m) => m.storyId)],
  );

  const imageSet = new Set();
  normalizeStoryImages(row.storyimages).forEach((url) => imageSet.add(url));
  for (const m of messagesRes.rows) {
    normalizeStoryImages(m.storyimages).forEach((url) => imageSet.add(url));
  }

  const story = mapStudentStory(row, db);
  const storyImages = [...imageSet];

  return {
    story: {
      ...story,
      storyImages,
    },
    module: { id: row.moduleid, title: row.modulename, name: row.modulename },
    chapter: { id: chapterId, title: row.chaptername, name: row.chaptername },
    principles: principlesRes.rows,
    messages,
    storyImages,
    navigation: {
      prevStoryId: currentIndex > 0 ? storyIds[currentIndex - 1] : null,
      nextStoryId: currentIndex >= 0 && currentIndex < storyIds.length - 1 ? storyIds[currentIndex + 1] : null,
    },
  };
}

export { logStudentError, EMPTY_MODULE_PAYLOAD };
