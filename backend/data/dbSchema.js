export { T } from './tables.js';

export {
  allocateNextModuleId,
  allocateNextChapterId,
  allocateNextStoryId,
  allocateNextPrincipleId,
} from './curriculumIds.js';

export function mappingKey(storyId, principleId) {
  return `${storyId}:${principleId}`;
}

export function parseMappingKey(mappingId) {
  const [storyId, principleId] = String(mappingId || '').split(':');
  return { storyId, principleId };
}

export function normalizeStoryMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((m, index) => ({
      text: String(m.text ?? m.storyText ?? '').trim(),
      principleId: m.principleId ?? m.principle_id ?? '',
      index,
    }))
    .filter((m) => m.text && m.principleId);
}

/** DB row → admin curriculum list shapes (frontend-compatible). */
export function mapModuleListRow(row, chaptersCount = 0) {
  return {
    module_id: row.moduleid,
    title: row.modulename,
    chaptersCount: Number(chaptersCount) || 0,
  };
}

export function mapChapterListRow(row, storiesCount = 0) {
  return {
    chapter_id: row.chapterid,
    module_id: row.moduleid,
    module_name: row.modulename,
    title: row.chaptername,
    storiesCount: Number(storiesCount) || 0,
  };
}

export function mapStoryListRow(row) {
  return {
    story_id: row.storyid,
    chapter_id: row.chapterid,
    chapter_name: row.chaptername,
    module_id: row.moduleid,
    module_name: row.modulename,
    title: row.storytitle,
    description: row.storydescription || '',
    status: 'published',
    tags: [],
  };
}

/** Normalize Postgres text[] / JSON story image fields to URL strings. */
export function normalizeStoryImages(raw) {
  if (raw == null) return [];
  let list = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      list = parsed;
    } catch {
      return [trimmed];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .flatMap((item) => {
      if (typeof item === 'string') return item.trim() ? [item.trim()] : [];
      if (item && typeof item === 'object' && item.url) return [String(item.url)];
      return [];
    })
    .filter(Boolean);
}

/** DB row → student story card. */
export function mapStudentStory(row, db, progressOverride) {
  const id = row.storyid;
  const progressEntry = db?.student?.storyProgressById?.[id];
  const progress = progressOverride ?? Number(progressEntry?.progress ?? 0);
  const readPage = Number(progressEntry?.readPage ?? 0);
  const description = row.storydescription || '';
  const body = row.storytext || description;
  const images = normalizeStoryImages(row.storyimages);
  return {
    id,
    storyId: id,
    title: row.storytitle || 'Untitled Story',
    storyTitle: row.storytitle || 'Untitled Story',
    subtitle: description.split('\n')[0]?.slice(0, 120) || body.split('\n')[0]?.slice(0, 120) || '',
    introduction: description,
    tags: ['Story'],
    progress,
    readPage,
    status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
    lesson: description || body.split('\n\n')[0]?.slice(0, 280) || '',
    panchatantraLesson: description || body.split('\n\n')[0]?.slice(0, 280) || '',
    chessConcept: row.chessconcept || row.chess_concept || 'Strategy and reflection',
    body,
    storyImages: images,
    relatedPuzzleId: null,
  };
}

export function mapPrincipleRow(row) {
  return {
    id: row.principleid,
    name: row.principlename,
  };
}
