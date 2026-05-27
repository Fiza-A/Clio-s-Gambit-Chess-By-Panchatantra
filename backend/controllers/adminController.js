import bcrypt from 'bcrypt';
import { readDb, writeDb } from '../data/mockDb.js';
import { makeId } from '../utils/id.js';
import { query, getDbSchema } from '../data/database.js';
import {
  T,
  mappingKey,
  parseMappingKey,
  normalizeStoryMessages,
  mapModuleListRow,
  mapChapterListRow,
  mapStoryListRow,
  mapPrincipleRow,
} from '../data/dbSchema.js';
import {
  allocateNextStoryId,
  compareChapterRowsById,
  compareModuleRowsById,
  comparePrincipleRowsById,
  compareStoryRowsById,
  ensureCurriculumIdsReady,
  insertModule,
  insertChapter,
  insertPrincipleWithSequentialId,
} from '../data/curriculumIds.js';
import * as chessComService from '../services/chessComService.js';
import { parseIds } from '../utils/parseIds.js';

import fetch from 'node-fetch';

export { parseIds };

const byId = (items, id) => items.find((item) => item.id === id);

/** Short-lived cache for GET /admin/players (avoids duplicate SELECTs from Strict Mode / multiple tabs). */
const PLAYERS_LIST_TTL_MS = 45_000;
let playersListCache = { expiresAt: 0, rows: null };

function invalidatePlayersListCache() {
  playersListCache = { expiresAt: 0, rows: null };
}

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

export const dashboard = async (_req, res) => {
  try {
    const usersCount = await query(`SELECT COUNT(*)::int AS count FROM "${T.login}"`);
    const modulesCount = await query(`SELECT COUNT(*)::int AS count FROM ${T.module}`);
    const chaptersCount = await query(`SELECT COUNT(*)::int AS count FROM ${T.chapter}`);
    const storiesCount = await query(`SELECT COUNT(*)::int AS count FROM ${T.stories}`);

    const baseDashboard = readDb().dashboards.admin;

    baseDashboard.stats[0].value = usersCount.rows[0]?.count ?? 0;
    baseDashboard.stats[2].value = storiesCount.rows[0]?.count ?? 0;
    baseDashboard.stats[2].subtitle = `${modulesCount.rows[0]?.count ?? 0} Modules · ${chaptersCount.rows[0]?.count ?? 0} Chapters`;

    baseDashboard.content[0].value = modulesCount.rows[0]?.count ?? 0;
    baseDashboard.content[1].value = chaptersCount.rows[0]?.count ?? 0;
    baseDashboard.content[2].value = storiesCount.rows[0]?.count ?? 0;

    res.json(baseDashboard);
  } catch (err) {
    console.error('[ADMIN API] Error in dashboard:', err);
    res.json(readDb().dashboards.admin); // Fallback to mock if DB fails
  }
};

// Real-time Users from Database
export async function usersList(req, res) {
  console.log('[ADMIN API] GET /users - Fetching from DB');
  try {
    const result = await query('SELECT * FROM "Login"');
    console.log(`[ADMIN API] Successfully fetched ${result.rows.length} users from DB`);
    const formattedUsers = result.rows.map((user) => {
      const active = user.is_active !== false && user.is_active !== 0;
      return {
        id: user.Chess_com_ID || user.email,
        name: user.Player_Name,
        role: user.Role,
        status: active ? 'active' : 'inactive',
        email: user.email,
      };
    });
    res.json(formattedUsers);
  } catch (err) {
    console.error('[ADMIN API] Error in usersList:', err);
    res.status(500).json({ error: 'Failed to fetch real-time user data' });
  }
}

export const users = {
  list: usersList,
  create: async (req, res) => {
    try {
      const { email, password, name, role, chessId } = req.body;
      const hashedPassword = await bcrypt.hash(password || 'password123', 10);
      await query(
        'INSERT INTO "Login" (email, password, "Player_Name", "Role", "Chess_com_ID", is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, hashedPassword, name, role || 'student', chessId, true]
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { name, role, is_active } = req.body;
      const id = req.params.id;
      const sets = [];
      const vals = [];
      let i = 1;
      if (name !== undefined) {
        sets.push(`"Player_Name" = $${i}`);
        vals.push(name);
        i += 1;
      }
      if (role !== undefined) {
        sets.push(`"Role" = $${i}`);
        vals.push(role);
        i += 1;
      }
      if (is_active !== undefined) {
        sets.push(`is_active = $${i}`);
        vals.push(Boolean(is_active));
        i += 1;
      }
      if (!sets.length) {
        return res.status(400).json({ error: 'No updatable fields provided' });
      }
      vals.push(id);
      await query(
        `UPDATE "Login" SET ${sets.join(', ')} WHERE "Chess_com_ID" = $${i} OR email = $${i}`,
        vals,
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query('DELETE FROM "Login" WHERE "Chess_com_ID" = $1 OR email = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
export const nestedStories = async (_req, res) => {
  try {
    await ensureCurriculumIdsReady();
    const sql = `
      SELECT
        m.moduleid,
        m.modulename,
        c.chapterid,
        c.chaptername,
        s.storyid,
        s.storytitle,
        s.storydescription,
        s.storytext,
        spm.principleid,
        p.principlename
      FROM ${T.module} m
      LEFT JOIN ${T.chapter} c ON c.moduleid = m.moduleid
      LEFT JOIN ${T.stories} s ON s.chapterid = c.chapterid
      LEFT JOIN ${T.storyPrincipleMapping} spm ON spm.storyid = s.storyid
      LEFT JOIN ${T.principles} p ON p.principleid = spm.principleid
      ORDER BY m.modulename ASC, c.chaptername ASC, s.storytitle ASC, p.principlename ASC
    `;

    const rows = (await query(sql)).rows;
    const modulesMap = new Map();

    rows.forEach((row) => {
      if (!modulesMap.has(row.moduleid)) {
        modulesMap.set(row.moduleid, {
          id: row.moduleid,
          name: row.modulename,
          subtitle: '',
          level: '',
          order: 0,
          chapters: new Map(),
        });
      }

      const module = modulesMap.get(row.moduleid);

      if (row.chapterid && !module.chapters.has(row.chapterid)) {
        module.chapters.set(row.chapterid, {
          id: row.chapterid,
          name: row.chaptername,
          order: 0,
          stories: new Map(),
        });
      }

      if (!row.chapterid || !row.storyid) return;

      const chapter = module.chapters.get(row.chapterid);

      if (!chapter.stories.has(row.storyid)) {
        chapter.stories.set(row.storyid, {
          id: row.storyid,
          title: row.storytitle,
          description: row.storydescription || '',
          order: 0,
          status: 'published',
          mappings: [],
        });
      }

      if (row.principleid) {
        const story = chapter.stories.get(row.storyid);
        const mid = mappingKey(row.storyid, row.principleid);
        if (!story.mappings.some((m) => m.id === mid)) {
          story.mappings.push({
            id: mid,
            mappingId: mid,
            storyId: row.storyid,
            storyName: row.storytitle,
            storyDescription: row.storydescription || '',
            principleId: row.principleid,
            principleName: row.principlename || null,
            storyText: row.storytext || '',
            isDone: true,
          });
        }
      } else if (!chapter.stories.get(row.storyid).mappings.length) {
        chapter.stories.get(row.storyid).mappings.push({
          id: mappingKey(row.storyid, 'none'),
          mappingId: mappingKey(row.storyid, 'none'),
          storyId: row.storyid,
          storyName: row.storytitle,
          storyDescription: row.storydescription || '',
          principleId: null,
          principleName: null,
          storyText: row.storytext || '',
          isDone: true,
        });
      }
    });

    const nestedData = Array.from(modulesMap.values()).map((m) => ({
      ...m,
      chapters: Array.from(m.chapters.values()).map((c) => ({
        ...c,
        stories: Array.from(c.stories.values()),
      })),
    }));

    res.json({ modules: nestedData });
  } catch (err) {
    console.error('[ADMIN API] Error in nestedStories:', err);
    res.status(500).json({ error: 'Failed to fetch nested curriculum stories', details: err.message });
  }
};

export const curriculum = async (_req, res) => {
  try {
    await ensureCurriculumIdsReady();
    const modulesRes = await query(`SELECT * FROM ${T.module}`);

    const chaptersRes = await query(`
      SELECT c.*, m.modulename,
        (SELECT COUNT(*)::int FROM ${T.stories} s WHERE s.chapterid = c.chapterid) AS stories_count
      FROM ${T.chapter} c
      LEFT JOIN ${T.module} m ON c.moduleid = m.moduleid
      ORDER BY c.chaptername ASC
    `);

    const storiesRes = await query(`
      SELECT s.*, c.chaptername, m.modulename, m.moduleid
      FROM ${T.stories} s
      LEFT JOIN ${T.chapter} c ON s.chapterid = c.chapterid
      LEFT JOIN ${T.module} m ON c.moduleid = m.moduleid
      ORDER BY s.storytitle ASC
    `);

    const chapterCounts = await query(`
      SELECT moduleid, COUNT(*)::int AS count FROM ${T.chapter} GROUP BY moduleid
    `);
    const countByModule = Object.fromEntries(
      chapterCounts.rows.map((r) => [r.moduleid, r.count]),
    );

    const modules = [...modulesRes.rows]
      .sort(compareModuleRowsById)
      .map((m) => mapModuleListRow(m, countByModule[m.moduleid] || 0));
    const chapters = [...chaptersRes.rows]
      .sort(compareChapterRowsById)
      .map((c) => mapChapterListRow(c, c.stories_count));
    const stories = [...storiesRes.rows].sort(compareStoryRowsById).map(mapStoryListRow);

    res.json({ modules, chapters, stories });
  } catch (err) {
    console.error('[ADMIN API] Error in curriculum:', err);
    res.status(500).json({ error: 'Failed to fetch curriculum data', details: err.message });
  }
};

export const modules = {
  create: async (req, res) => {
    try {
      const { title } = req.body;
      const id = await insertModule({ title });
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title } = req.body;
      await query(
        `UPDATE ${T.module} SET modulename = $1 WHERE moduleid = $2`,
        [title, req.params.id],
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const chaptersCount = await query(
        `SELECT COUNT(*)::int AS count FROM ${T.chapter} WHERE moduleid = $1`,
        [req.params.id],
      );
      if ((chaptersCount.rows[0]?.count ?? 0) > 0) {
        return res.status(400).json({ error: 'Cannot delete module that has chapters.' });
      }
      await query(`DELETE FROM ${T.module} WHERE moduleid = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export const chapters = {
  create: async (req, res) => {
    try {
      const { title, module_id } = req.body;
      const id = await insertChapter({ title, moduleId: module_id });
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, module_id } = req.body;
      await query(
        `UPDATE ${T.chapter} SET chaptername = $1, moduleid = $2 WHERE chapterid = $3`,
        [title, module_id, req.params.id],
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const storiesCount = await query(
        `SELECT COUNT(*)::int AS count FROM ${T.stories} WHERE chapterid = $1`,
        [req.params.id],
      );
      if ((storiesCount.rows[0]?.count ?? 0) > 0) {
        return res.status(400).json({ error: 'Cannot delete chapter that has stories.' });
      }
      await query(`DELETE FROM ${T.chapter} WHERE chapterid = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

async function insertStoryWithPrinciple({ storyId, title, description, chapterId, text, principleId }) {
  await query(
    `INSERT INTO ${T.stories} (storyid, storytitle, storydescription, storytext, chapterid)
     VALUES ($1, $2, $3, $4, $5)`,
    [storyId, title, description || '', text, chapterId],
  );
  await query(
    `INSERT INTO ${T.storyPrincipleMapping} (storyid, principleid) VALUES ($1, $2)
     ON CONFLICT (storyid, principleid) DO NOTHING`,
    [storyId, principleId],
  );
}

export const stories = {
  list: async (_req, res) => {
    try {
      const result = await query(`SELECT * FROM ${T.stories} ORDER BY storytitle ASC`);
      res.json(result.rows.map((r) => ({ ...r, story_id: r.storyid, title: r.storytitle })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      await ensureCurriculumIdsReady();
      const { title, description, chapter_id, messages } = req.body;
      const normalizedMessages = normalizeStoryMessages(messages);
      if (!normalizedMessages.length) {
        return res.status(400).json({ error: 'At least one message with a principle is required.' });
      }
      if (!chapter_id) {
        return res.status(400).json({ error: 'Chapter is required.' });
      }

      const createdIds = [];
      for (const msg of normalizedMessages) {
        const storyId = await allocateNextStoryId();
        await insertStoryWithPrinciple({
          storyId,
          title,
          description: description || '',
          chapterId: chapter_id,
          text: msg.text,
          principleId: msg.principleId,
        });
        createdIds.push(storyId);
      }

      res.status(201).json({ ok: true, id: createdIds[0], ids: createdIds });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, description, chapter_id, messages } = req.body;
      const storyId = req.params.id;

      if (title !== undefined || description !== undefined || chapter_id !== undefined) {
        await query(
          `UPDATE ${T.stories}
           SET storytitle = COALESCE($1, storytitle),
               storydescription = COALESCE($2, storydescription),
               chapterid = COALESCE($3, chapterid)
           WHERE storyid = $4`,
          [title, description ?? null, chapter_id ?? null, storyId],
        );
      }

      if (messages !== undefined) {
        const normalizedMessages = normalizeStoryMessages(messages);
        if (!normalizedMessages.length) {
          return res.status(400).json({ error: 'At least one message with a principle is required.' });
        }
        const msg = normalizedMessages[0];
        await query(
          `UPDATE ${T.stories} SET storytext = $1 WHERE storyid = $2`,
          [msg.text, storyId],
        );
        await query(`DELETE FROM ${T.storyPrincipleMapping} WHERE storyid = $1`, [storyId]);
        await query(
          `INSERT INTO ${T.storyPrincipleMapping} (storyid, principleid) VALUES ($1, $2)
           ON CONFLICT (storyid, principleid) DO NOTHING`,
          [storyId, msg.principleId],
        );
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query(`DELETE FROM ${T.storyPrincipleMapping} WHERE storyid = $1`, [req.params.id]);
      await query(`DELETE FROM ${T.stories} WHERE storyid = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateStatus: async (req, res) => {
    res.json({ storyid: req.params.id, status: req.body?.status || 'published' });
  },
};

export const storyMappings = {
  updateStatus: async (req, res) => {
    res.json({ ok: true, id: req.params.id, status: req.body?.status || 'published' });
  },
  update: async (req, res) => {
    try {
      const { storyText } = req.body;
      const { storyId } = parseMappingKey(req.params.id);
      if (!storyId) return res.status(400).json({ error: 'Invalid mapping id' });

      const result = await query(
        `UPDATE ${T.stories} SET storytext = COALESCE($1, storytext) WHERE storyid = $2 RETURNING *`,
        [storyText, storyId],
      );
      res.json(result.rows[0] || { ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export const players = {
  list: async (_req, res) => {
    try {
      const now = Date.now();
      if (playersListCache.rows && now < playersListCache.expiresAt) {
        return res.json(playersListCache.rows);
      }
      const result = await query('SELECT * FROM public.players ORDER BY "Player_Name" ASC');
      playersListCache = { rows: result.rows, expiresAt: now + PLAYERS_LIST_TTL_MS };
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  sync: async (req, res) => {
    console.log('[ADMIN API] Starting Chess.com player sync...');
    const errors = [];
    const skipped = [];
    let updatedCount = 0;

    try {
      // 1. Get all users with Chess.com IDs from public.players
      const playersRes = await query(`
        SELECT "Chess_com_ID"
        FROM public.players
        WHERE "Chess_com_ID" IS NOT NULL
        AND TRIM("Chess_com_ID") != ''
      `);
      const players = playersRes.rows;
      console.log(`[ADMIN API] Found ${players.length} players to sync.`);
      
      for (const player of players) {
        const originalChessComId = player.Chess_com_ID;
        const username = chessComService.normalizeUsername ? chessComService.normalizeUsername(originalChessComId) : String(originalChessComId || '').trim().toLowerCase();

        try {
          const profileUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}`;
          const statsUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`;
          
          console.log('[Chess.com] Fetching profile:', profileUrl);
          const profileResult = await chessComService.fetchChessComJson(profileUrl);
          if (!profileResult.ok && profileResult.status !== 404) {
            throw new Error(profileResult.error);
          }

          await chessComService.sleep(800);

          console.log('[Chess.com] Fetching stats:', statsUrl);
          const statsResult = await chessComService.fetchChessComJson(statsUrl);
          if (!statsResult.ok && statsResult.status !== 404) {
            throw new Error(statsResult.error);
          }

          if (!profileResult.ok && !statsResult.ok) {
            throw new Error(`Both profile and stats fetch failed. Profile: ${profileResult.error}, Stats: ${statsResult.error}`);
          }

          const profile = profileResult.data || {};
          const stats = statsResult.data || {};
          const data = chessComService.extractChessData(profile, stats);

          const result = await query(
            `
            UPDATE public.players
            SET
              "Player_Name" = COALESCE($1, "Player_Name"),
              "Joining_Date" = COALESCE($2, "Joining_Date"),
              current_elo = COALESCE($3, current_elo),

              chess_profile_url = $4,
              chess_country_url = $5,

              rapid_rating = $6,
              rapid_best = $7,
              blitz_rating = $8,
              blitz_best = $9,
              bullet_rating = $10,
              bullet_best = $11,

              fide_rating = $12,
              tactics_highest = $13,
              puzzle_rush_best = $14,

              chess_last_synced_at = NOW()
            WHERE LOWER(TRIM("Chess_com_ID")) = LOWER(TRIM($15))
            RETURNING *
            `,
            [
              data.playerName,
              data.joiningDate,
              data.currentElo,

              data.chessProfileUrl,
              data.chessCountryUrl,

              data.rapidRating,
              data.rapidBest,
              data.blitzRating,
              data.blitzBest,
              data.bulletRating,
              data.bulletBest,

              data.fideRating,
              data.tacticsHighest,
              data.puzzleRushBest,

              originalChessComId
            ]
          );

          if (result.rows.length > 0) {
            console.log('[ADMIN API] Updated player Chess.com details:', result.rows[0].Chess_com_ID);
            updatedCount++;
          } else {
            console.warn('[ADMIN API] No player updated:', originalChessComId);
          }
        } catch (err) {
          console.error('[ADMIN API] Failed player sync:', {
            player: originalChessComId,
            error: err.message,
            status: err.status || null,
            apiResponse: err.body || null
          });

          errors.push({
            player: originalChessComId,
            error: err.message,
            status: err.status || null,
            apiResponse: err.body || null
          });
        }

        await chessComService.sleep(1200);
      }

      console.log(`[ADMIN API] Sync complete. Updated: ${updatedCount}, Errors: ${errors.length}`);
      invalidatePlayersListCache();
      res.json({ 
        message: 'Chess.com details sync complete', 
        added: 0, // Profile sync doesn't add new players currently
        updated: updatedCount,
        updatedCount, 
        errorsCount: errors.length,
        errors,
        skipped: skipped,
        skippedCount: skipped.length
      });
    } catch (err) {
      console.error('[ADMIN API] Sync process fatal error:', err);
      invalidatePlayersListCache();
      res.status(500).json({ error: 'Chess.com sync failed', details: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { Player_Name, Chess_com_ID } = req.body;
      const result = await query(
        'UPDATE public.players SET "Player_Name" = $1 WHERE "Chess_com_ID" = $2 RETURNING *',
        [Player_Name, req.params.id]
      );
      invalidatePlayersListCache();
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query('DELETE FROM public.players WHERE "Chess_com_ID" = $1', [req.params.id]);
      invalidatePlayersListCache();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  togglePause: async (req, res) => {
    try {
      const { id } = req.params;
      const { rows } = await query('SELECT activity_tracker FROM public.players WHERE "Chess_com_ID" = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });
      
      let tracker = rows[0].activity_tracker;
      if (typeof tracker === 'string') tracker = JSON.parse(tracker);
      if (!tracker) tracker = {};
      
      tracker.is_paused = !tracker.is_paused;
      
      await query('UPDATE public.players SET activity_tracker = $1 WHERE "Chess_com_ID" = $2', [JSON.stringify(tracker), id]);
      invalidatePlayersListCache();
      res.json({ ok: true, is_paused: tracker.is_paused });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const user = (req, res) => res.json(byId(readDb().admin.users, req.params.id) || {});
export const principles = {
  list: async (_req, res) => {
    try {
      console.log('[ADMIN API] Fetching principles from DB...');
      await ensureCurriculumIdsReady();
      const result = await query(
        `SELECT principleid AS id, principlename AS name FROM ${T.principles}`,
      );
      const rows = [...result.rows]
        .sort(comparePrincipleRowsById)
        .map((row) => ({
          id: row.id,
          principleId: row.id,
          name: row.name,
        }));
      console.log(`[ADMIN API] Principles found: ${rows.length}`, rows.slice(0, 5));
      res.json(rows);
    } catch (err) {
      console.error('[ADMIN API] Error fetching principles:', err);
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { name } = req.body;
      const row = await insertPrincipleWithSequentialId(name);
      console.log(`[ADMIN API] Created principle ${row.id}: ${row.name}`);
      res.status(201).json({ id: row.id, principleId: row.id, name: row.name });
    } catch (err) {
      console.error('[ADMIN API] principles.create:', err.message);
      res.status(err.message === 'Principle name is required' ? 400 : 500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { name } = req.body;
      const result = await query(
        `UPDATE ${T.principles} SET principlename = $1 WHERE principleid = $2
         RETURNING principleid AS id, principlename AS name`,
        [name, req.params.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query(`DELETE FROM ${T.storyPrincipleMapping} WHERE principleid = $1`, [req.params.id]);
      await query(`DELETE FROM ${T.principles} WHERE principleid = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
/** Legacy `/admin/positions` — backed by `principles` table (database.sql). */
function mapPrincipleToPositionRow(row) {
  return {
    id: row.id,
    principle: row.name,
    fen_with_move: '',
    puzzle_list: '[]',
    isdone: false,
  };
}

export const positions = {
  list: async (_req, res) => {
    try {
      const result = await query(
        `SELECT principleid AS id, principlename AS name FROM ${T.principles}`,
      );
      res.json([...result.rows].sort(comparePrincipleRowsById).map(mapPrincipleToPositionRow));
    } catch (err) {
      console.error('[ADMIN API] positions.list:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const name = String(req.body.principle ?? req.body.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'Principle name is required.' });
      const row = await insertPrincipleWithSequentialId(name);
      res.status(201).json(mapPrincipleToPositionRow(row));
    } catch (err) {
      console.error('[ADMIN API] positions.create:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const name = String(req.body.principle ?? req.body.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'Principle name is required.' });
      const result = await query(
        `UPDATE ${T.principles} SET principlename = $1 WHERE principleid = $2
         RETURNING principleid AS id, principlename AS name`,
        [name, req.params.id],
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Principle not found' });
      res.json(mapPrincipleToPositionRow(result.rows[0]));
    } catch (err) {
      console.error('[ADMIN API] positions.update:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query(`DELETE FROM ${T.storyPrincipleMapping} WHERE principleid = $1`, [req.params.id]);
      await query(`DELETE FROM ${T.principles} WHERE principleid = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('[ADMIN API] positions.remove:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
};

export const puzzles = {
  list: async (_req, res) => {
    try {
      const schema = await getDbSchema();
      if (!schema.hasChessPuzzle) {
        console.warn('[ADMIN API] puzzles.list: chess_puzzle table not in DB — returning []');
        return res.json([]);
      }
      const joinPrinciples = schema.hasPrinciples
        ? `LEFT JOIN ${T.principles} p ON p.principleid = cp.principle_id::text`
        : '';
      const principleSelect = schema.hasPrinciples ? 'p.principlename AS principle_name' : 'NULL AS principle_name';
      const result = await query(`
        SELECT
          cp.chess_puzzle_id AS id,
          cp.principle_id,
          cp.fen_with_move,
          cp.isdone,
          cp.answer,
          ${principleSelect}
        FROM public.chess_puzzle cp
        ${joinPrinciples}
        ORDER BY cp.chess_puzzle_id ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('[ADMIN API] puzzles.list:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const schema = await getDbSchema();
      if (!schema.hasChessPuzzle) {
        return res.status(501).json({ error: 'chess_puzzle table is not configured in this database.' });
      }
      const { id, principle_id, fen_with_move, isdone, answer } = req.body;
      const result = await query(
        'INSERT INTO public.chess_puzzle (chess_puzzle_id, principle_id, fen_with_move, isdone, answer) VALUES ($1, $2, $3, $4, $5) RETURNING chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer',
        [id, principle_id, fen_with_move, isdone || false, answer],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('[ADMIN API] puzzles.create:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const schema = await getDbSchema();
      if (!schema.hasChessPuzzle) {
        return res.status(501).json({ error: 'chess_puzzle table is not configured in this database.' });
      }
      const { principle_id, fen_with_move, isdone, answer } = req.body;
      const result = await query(
        'UPDATE public.chess_puzzle SET principle_id = $1, fen_with_move = $2, isdone = $3, answer = $4 WHERE chess_puzzle_id = $5 RETURNING chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer',
        [principle_id, fen_with_move, isdone, answer, req.params.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error('[ADMIN API] puzzles.update:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const schema = await getDbSchema();
      if (!schema.hasChessPuzzle) {
        return res.status(501).json({ error: 'chess_puzzle table is not configured in this database.' });
      }
      await query('DELETE FROM public.chess_puzzle WHERE chess_puzzle_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('[ADMIN API] puzzles.remove:', err.message);
      res.status(500).json({ error: err.message });
    }
  },
};
export const classes = crud('classes');
export const achievements = crud('achievements');
export function createModule(req, res) {
  return modules.create(req, res);
}
export function updateModule(req, res) {
  return modules.update(req, res);
}
export function deleteModule(req, res) {
  return modules.remove(req, res);
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
