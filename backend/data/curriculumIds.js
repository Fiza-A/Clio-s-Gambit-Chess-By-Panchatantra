import { query } from './database.js';
import { T } from './tables.js';

/** Prefixes for sequential curriculum IDs */
export const ID_PREFIX = {
  module: 'MOD',
  chapter: 'CH',
  story: 'ST',
  principle: 'P',
};

const ENTITY = {
  module: { table: T.module, column: 'moduleid' },
  chapter: { table: T.chapter, column: 'chapterid' },
  story: { table: T.stories, column: 'storyid' },
  principle: { table: T.principles, column: 'principleid' },
};

const schemaReady = {
  principle: false,
  story: false,
};

function patternFor(prefix) {
  return new RegExp(`^${prefix}(\\d+)$`, 'i');
}

/** Parse MOD01 → 1, ST100 → 100. Returns null for legacy/non-matching IDs. */
export function parseSequentialId(prefix, id) {
  const match = String(id ?? '').trim().match(patternFor(prefix));
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Format with leading zeros for 1–99; plain number from 100+. */
export function formatSequentialId(prefix, sequenceNumber) {
  const n = Number(sequenceNumber);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid sequence number for ${prefix}`);
  }
  if (n < 100) return `${prefix}${String(n).padStart(2, '0')}`;
  return `${prefix}${n}`;
}

async function fetchColumnType(table, column, runQuery = query) {
  const result = await runQuery(
    `
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    `,
    [table, column],
  );
  return result.rows[0]?.data_type ?? 'unknown';
}

async function allocateNextId(entityKey, runQuery = query) {
  const { table, column } = ENTITY[entityKey];
  const prefix = ID_PREFIX[entityKey];
  const result = await runQuery(`SELECT ${column} AS id FROM ${table}`);
  let maxSeq = 0;
  for (const row of result.rows) {
    const seq = parseSequentialId(prefix, row.id);
    if (seq != null && seq > maxSeq) maxSeq = seq;
  }
  return formatSequentialId(prefix, maxSeq + 1);
}

async function insertWithSequentialId(entityKey, columns, values, runQuery = query) {
  const { table, column } = ENTITY[entityKey];
  const prefix = ID_PREFIX[entityKey];

  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const id = await allocateNextId(entityKey, runQuery);
    const cols = [column, ...columns];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const params = [id, ...values];
    try {
      const result = await runQuery(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        params,
      );
      return { id, row: result.rows[0] };
    } catch (err) {
      if (err.code === '23505' && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }
  throw new Error(`Could not allocate unique ${prefix} ID`);
}

function rowId(row, keys) {
  for (const key of keys) {
    if (row[key] != null && row[key] !== '') return row[key];
  }
  return '';
}

export function compareSequentialRows(prefix, a, b, idKeys = ['id']) {
  const rawA = rowId(a, idKeys);
  const rawB = rowId(b, idKeys);
  const seqA = parseSequentialId(prefix, rawA);
  const seqB = parseSequentialId(prefix, rawB);
  if (seqA != null && seqB != null && seqA !== seqB) return seqA - seqB;
  if (seqA != null && seqB == null) return -1;
  if (seqA == null && seqB != null) return 1;
  return String(rawA).localeCompare(String(rawB));
}

export const compareModuleRowsById = (a, b) =>
  compareSequentialRows(ID_PREFIX.module, a, b, ['moduleid', 'module_id', 'id']);
export const compareChapterRowsById = (a, b) =>
  compareSequentialRows(ID_PREFIX.chapter, a, b, ['chapterid', 'chapter_id', 'id']);
export const compareStoryRowsById = (a, b) =>
  compareSequentialRows(ID_PREFIX.story, a, b, ['storyid', 'story_id', 'id']);
export const comparePrincipleRowsById = (a, b) =>
  compareSequentialRows(ID_PREFIX.principle, a, b, ['principleid', 'id']);

export async function ensurePrincipleIdSupportsSequentialIds(runQuery = query) {
  if (schemaReady.principle) return;

  const colType = await fetchColumnType(T.principles, 'principleid', runQuery);
  if (colType === 'text' || colType === 'character varying') {
    schemaReady.principle = true;
    return;
  }

  if (colType !== 'uuid') {
    console.warn(`[curriculumIds] Unexpected principles.principleid type: ${colType}`);
    schemaReady.principle = true;
    return;
  }

  console.log('[curriculumIds] Migrating principles.principleid → text (P01, P02, …)');
  await runQuery(
    `ALTER TABLE ${T.storyPrincipleMapping} DROP CONSTRAINT IF EXISTS fk_spm_principle`,
  );

  const rowCount = (await runQuery(`SELECT COUNT(*)::int AS n FROM ${T.principles}`)).rows[0]?.n ?? 0;

  if (rowCount === 0) {
    await runQuery(`ALTER TABLE ${T.principles} ALTER COLUMN principleid DROP DEFAULT`);
    await runQuery(`ALTER TABLE ${T.principles} ALTER COLUMN principleid TYPE text`);
    await runQuery(
      `ALTER TABLE ${T.storyPrincipleMapping} ALTER COLUMN principleid TYPE text USING principleid::text`,
    );
  } else {
    await migrateTableIdsToSequential({
      table: T.principles,
      column: 'principleid',
      prefix: ID_PREFIX.principle,
      orderBy: 'created_at NULLS LAST, principlename',
      runQuery,
      mappingUpdates: [{ childTable: T.storyPrincipleMapping, childColumn: 'principleid' }],
    });
  }

  await addFkIfMissing(
    `ALTER TABLE ${T.storyPrincipleMapping} ADD CONSTRAINT fk_spm_principle FOREIGN KEY (principleid) REFERENCES ${T.principles}(principleid)`,
    runQuery,
  );

  schemaReady.principle = true;
  console.log('[curriculumIds] principles migration complete');
}

export async function ensureStoryIdSupportsSequentialIds(runQuery = query) {
  if (schemaReady.story) return;

  const colType = await fetchColumnType(T.stories, 'storyid', runQuery);
  if (colType === 'text' || colType === 'character varying') {
    schemaReady.story = true;
    return;
  }

  if (colType !== 'uuid') {
    console.warn(`[curriculumIds] Unexpected stories.storyid type: ${colType}`);
    schemaReady.story = true;
    return;
  }

  console.log('[curriculumIds] Migrating stories.storyid → text (ST01, ST02, …)');
  await runQuery(
    `ALTER TABLE ${T.storyPrincipleMapping} DROP CONSTRAINT IF EXISTS fk_spm_story`,
  );
  await runQuery(`ALTER TABLE ${T.stories} DROP CONSTRAINT IF EXISTS fk_story_chapter`);

  const rowCount = (await runQuery(`SELECT COUNT(*)::int AS n FROM ${T.stories}`)).rows[0]?.n ?? 0;

  if (rowCount === 0) {
    await runQuery(`ALTER TABLE ${T.stories} ALTER COLUMN storyid DROP DEFAULT`);
    await runQuery(`ALTER TABLE ${T.stories} ALTER COLUMN storyid TYPE text`);
    await runQuery(
      `ALTER TABLE ${T.storyPrincipleMapping} ALTER COLUMN storyid TYPE text USING storyid::text`,
    );
  } else {
    await migrateTableIdsToSequential({
      table: T.stories,
      column: 'storyid',
      prefix: ID_PREFIX.story,
      orderBy: 'created_at NULLS LAST, storytitle',
      runQuery,
      mappingUpdates: [
        {
          childTable: T.storyPrincipleMapping,
          childColumn: 'storyid',
        },
      ],
    });
  }

  await addFkIfMissing(
    `ALTER TABLE ${T.stories} ADD CONSTRAINT fk_story_chapter FOREIGN KEY (chapterid) REFERENCES ${T.chapter}(chapterid)`,
    runQuery,
  );
  await addFkIfMissing(
    `ALTER TABLE ${T.storyPrincipleMapping} ADD CONSTRAINT fk_spm_story FOREIGN KEY (storyid) REFERENCES ${T.stories}(storyid)`,
    runQuery,
  );

  schemaReady.story = true;
  console.log('[curriculumIds] stories migration complete');
}

export async function ensureCurriculumIdsReady(runQuery = query) {
  await ensurePrincipleIdSupportsSequentialIds(runQuery);
  await ensureStoryIdSupportsSequentialIds(runQuery);
}

async function addFkIfMissing(sql, runQuery) {
  try {
    await runQuery(sql);
  } catch (err) {
    if (err.code !== '42710') throw err;
  }
}

async function migrateTableIdsToSequential({
  table,
  column,
  prefix,
  orderBy,
  runQuery,
  mappingUpdates = [],
}) {
  const seqCol = `${column}_seq`;
  const pkey = `${table}_pkey`;
  await runQuery(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${pkey}`);
  await runQuery(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${seqCol} text`);

  await runQuery(`
    WITH numbered AS (
      SELECT ${column} AS old_id,
        row_number() OVER (ORDER BY ${orderBy}) AS rn
      FROM ${table}
    ),
    mapped AS (
      SELECT old_id,
        '${prefix}' || CASE
          WHEN rn < 100 THEN lpad(rn::text, 2, '0')
          ELSE rn::text
        END AS new_id
      FROM numbered
    )
    UPDATE ${table} t
    SET ${seqCol} = m.new_id
    FROM mapped m
    WHERE t.${column} = m.old_id
  `);

  for (const { childTable, childColumn } of mappingUpdates) {
    await runQuery(`
      UPDATE ${childTable} c
      SET ${childColumn} = t.${seqCol}
      FROM ${table} t
      WHERE c.${childColumn}::text = t.${column}::text
    `);
    await runQuery(
      `ALTER TABLE ${childTable} ALTER COLUMN ${childColumn} TYPE text USING ${childColumn}::text`,
    );
  }

  await runQuery(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  await runQuery(`ALTER TABLE ${table} RENAME COLUMN ${seqCol} TO ${column}`);
  await runQuery(`ALTER TABLE ${table} ADD PRIMARY KEY (${column})`);
}

export async function allocateNextModuleId(runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  return allocateNextId('module', runQuery);
}

export async function allocateNextChapterId(runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  return allocateNextId('chapter', runQuery);
}

export async function allocateNextStoryId(runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  return allocateNextId('story', runQuery);
}

export async function allocateNextPrincipleId(runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  return allocateNextId('principle', runQuery);
}

export async function insertModule({ title }, runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  const { id } = await insertWithSequentialId('module', ['modulename'], [title], runQuery);
  return id;
}

export async function insertChapter({ title, moduleId }, runQuery = query) {
  await ensureCurriculumIdsReady(runQuery);
  const { id } = await insertWithSequentialId(
    'chapter',
    ['chaptername', 'moduleid'],
    [title, moduleId],
    runQuery,
  );
  return id;
}

export async function insertPrincipleWithSequentialId(name, runQuery = query) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) throw new Error('Principle name is required');
  await ensureCurriculumIdsReady(runQuery);
  const { id } = await insertWithSequentialId('principle', ['principlename'], [trimmed], runQuery);
  return { id, name: trimmed };
}

/** Backward-compatible aliases */
export const parsePrincipleSequenceId = (id) => parseSequentialId(ID_PREFIX.principle, id);
export const formatPrincipleSequenceId = (n) => formatSequentialId(ID_PREFIX.principle, n);
