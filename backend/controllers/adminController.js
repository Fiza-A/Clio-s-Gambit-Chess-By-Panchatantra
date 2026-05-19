import bcrypt from 'bcrypt';
import { readDb, writeDb } from '../data/mockDb.js';
import { makeId } from '../utils/id.js';
import { query } from '../data/database.js';
import * as chessComService from '../services/chessComService.js';

import fetch from 'node-fetch';

const byId = (items, id) => items.find((item) => item.id === id);

/** Short-lived cache for GET /admin/players (avoids duplicate SELECTs from Strict Mode / multiple tabs). */
const PLAYERS_LIST_TTL_MS = 45_000;
let playersListCache = { expiresAt: 0, rows: null };

function invalidatePlayersListCache() {
  playersListCache = { expiresAt: 0, rows: null };
}

export const parseIds = (idsString) => {
  if (!idsString) return [];
  if (Array.isArray(idsString)) return idsString;
  if (typeof idsString !== 'string') return [];
  
  const trimmed = idsString.trim();
  if (!trimmed) return [];

  try {
    // Try standard JSON parse first
    return JSON.parse(trimmed.replace(/'/g, '"'));
  } catch (e) {
    // If it's like [CHAP1, CHAP2], manually parse it
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    return [];
  }
};

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
    const usersCount = await query('SELECT COUNT(*) FROM "Login"');
    const modulesCount = await query('SELECT COUNT(*) FROM "module"');
    const chaptersCount = await query('SELECT COUNT(*) FROM "chapter"');
    const storiesCount = await query('SELECT COUNT(*) FROM "story"');
    
    const baseDashboard = readDb().dashboards.admin;
    
    // Update real-time stats
    baseDashboard.stats[0].value = usersCount.rows[0].count; // Total Users
    baseDashboard.stats[2].value = storiesCount.rows[0].count; // Total Stories
    baseDashboard.stats[2].subtitle = `${modulesCount.rows[0].count} Modules · ${chaptersCount.rows[0].count} Chapters`;
    
    // Update content overview
    baseDashboard.content[0].value = modulesCount.rows[0].count;
    baseDashboard.content[1].value = chaptersCount.rows[0].count;
    baseDashboard.content[2].value = storiesCount.rows[0].count;

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
    const formattedUsers = result.rows.map(user => ({
      id: user.Chess_com_ID || user.email,
      name: user.Player_Name,
      role: user.Role,
      status: 'ACTIVE', // Defaulting to ACTIVE since column doesn't exist in DB
      email: user.email
    }));
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
        'INSERT INTO "Login" (email, password, "Player_Name", "Role", "Chess_com_ID") VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, name, role || 'student', chessId]
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { name, role } = req.body;
      await query(
        'UPDATE "Login" SET "Player_Name" = $1, "Role" = $2 WHERE "Chess_com_ID" = $3 OR email = $3',
        [name, role, req.params.id]
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
  console.log('[DEBUG] Calling nestedStories V2 - NO order_index');
  try { 
    const sql = ` 
      SELECT 
        m.module_id, 
        m.module_name, 

        c.chapter_id, 
        c.chapter_name, 

        s.story_id, 
        s.title AS story_title, 
        s.description AS story_description, 
        s.status AS story_status, 

        sm.mapping_id, 
        sm.story_text, 
        sm.principle_id, 

        p.id AS joined_principle_id, 
        p.name AS principle_name 

      FROM public.module m 

      LEFT JOIN public.chapter c 
        ON LOWER(TRIM(c.module_id)) = LOWER(TRIM(m.module_id)) 

      LEFT JOIN public.story s 
        ON LOWER(TRIM(s.chapter_id)) = LOWER(TRIM(c.chapter_id)) 

      LEFT JOIN public.story_mapping sm 
        ON LOWER(TRIM(sm.story_id)) = LOWER(TRIM(s.story_id)) 

      LEFT JOIN public.principles p 
        ON LOWER(TRIM(p.id)) = LOWER(TRIM(sm.principle_id)) 

      ORDER BY 
        m.module_name ASC, 
        c.chapter_name ASC, 
        s.title ASC, 
        sm.mapping_id ASC; 
    `; 

    const result = await query(sql); 
    const rows = result.rows; 

    console.log('[nestedStories] principle debug:', rows.slice(0, 20).map(r => ({ 
      mapping_id: r.mapping_id, 
      story_id: r.story_id, 
      story_title: r.story_title, 
      principle_id: r.principle_id, 
      joined_principle_id: r.joined_principle_id, 
      principle_name: r.principle_name 
    }))); 

    const modulesMap = new Map(); 

    rows.forEach(row => { 
      if (!modulesMap.has(row.module_id)) { 
        modulesMap.set(row.module_id, { 
          id: row.module_id, 
          name: row.module_name, 
          subtitle: '', 
          level: '', 
          order: 0, 
          chapters: new Map() 
        }); 
      } 

      const module = modulesMap.get(row.module_id); 

      if (row.chapter_id && !module.chapters.has(row.chapter_id)) { 
        module.chapters.set(row.chapter_id, { 
          id: row.chapter_id, 
          name: row.chapter_name, 
          order: 0, 
          stories: new Map() 
        }); 
      } 

      if (row.chapter_id) { 
        const chapter = module.chapters.get(row.chapter_id); 

        if (row.story_id && !chapter.stories.has(row.story_id)) { 
          chapter.stories.set(row.story_id, { 
            id: row.story_id, 
            title: row.story_title, 
            description: row.story_description, 
            order: 0, 
            status: (row.story_status || 'published').toLowerCase(), 
            mappings: [] 
          }); 
        } 

        if (row.mapping_id && row.story_id) { 
          const story = chapter.stories.get(row.story_id); 

          story.mappings.push({ 
            id: row.mapping_id, 
            mappingId: row.mapping_id, 

            storyId: row.story_id, 
            storyName: row.story_title, 
            storyDescription: row.story_description, 

            principleId: row.principle_id, 
            principleName: row.principle_name || null, 

            storyText: row.story_text || '', 
            isDone: row.isdone || false 
          }); 
        } 
      } 
    }); 

    const nestedData = Array.from(modulesMap.values()).map(m => ({ 
      ...m, 
      chapters: Array.from(m.chapters.values()).map(c => ({ 
        ...c, 
        stories: Array.from(c.stories.values()) 
      })) 
    })); 

    res.json({ modules: nestedData }); 
  } catch (err) { 
    console.error('[ADMIN API] Error in nestedStories:', err); 
    res.status(500).json({ 
      error: 'Failed to fetch nested curriculum stories', 
      details: err.message 
    }); 
  } 
};

export const curriculum = async (_req, res) => {
  console.log('[DEBUG] Calling curriculum V2 - NO order_index');
  try {
    // Fetch modules
    const modulesRes = await query('SELECT * FROM "module" ORDER BY module_name ASC');
    
    // Fetch chapters with module name
    const chaptersRes = await query(`
      SELECT c.*, m.module_name 
      FROM "chapter" c
      LEFT JOIN "module" m ON c.module_id = m.module_id
      ORDER BY c.chapter_name ASC
    `);
    
    // Fetch stories with chapter and module names
    const storiesRes = await query(`
      SELECT s.*, c.chapter_name, m.module_name
      FROM "story" s
      LEFT JOIN "chapter" c ON s.chapter_id = c.chapter_id
      LEFT JOIN "module" m ON s.module_id = m.module_id
      ORDER BY s.title ASC
    `);
    
    res.json({
      modules: modulesRes.rows.map(m => ({
        module_id: m.module_id,
        title: m.module_name,
        chaptersCount: parseIds(m.chapter_ids).length
      })),
      chapters: chaptersRes.rows.map(c => ({
        chapter_id: c.chapter_id,
        module_id: c.module_id,
        module_name: c.module_name,
        title: c.chapter_name,
        storiesCount: parseIds(c.story_ids).length
      })),
      stories: storiesRes.rows.map(s => ({
        story_id: s.story_id,
        chapter_id: s.chapter_id,
        chapter_name: s.chapter_name,
        module_id: s.module_id,
        module_name: s.module_name,
        title: s.title,
        description: s.description,
        status: s.status || 'published',
        tags: parseIds(s.tags)
      }))
    });
  } catch (err) {
    console.error('[ADMIN API] Error in curriculum:', err);
    res.status(500).json({ error: 'Failed to fetch curriculum data', details: err.message });
  }
};

export const modules = {
  create: async (req, res) => {
    try {
      const { title } = req.body;
      const id = `mod-${Date.now()}`;
      await query(
        'INSERT INTO "module" (module_id, module_name, chapter_ids) VALUES ($1, $2, $3)',
        [id, title, '[]']
      );
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title } = req.body;
      await query(
        'UPDATE "module" SET module_name = $1 WHERE module_id = $2',
        [title, req.params.id]
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const chaptersCount = await query('SELECT COUNT(*) FROM "chapter" WHERE module_id = $1', [req.params.id]);
      if (parseInt(chaptersCount.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete module that has chapters.' });
      }
      await query('DELETE FROM "module" WHERE module_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const chapters = {
  create: async (req, res) => {
    try {
      const { title, module_id } = req.body;
      const id = `ch-${Date.now()}`;
      await query(
        'INSERT INTO "chapter" (chapter_id, chapter_name, module_id, story_ids) VALUES ($1, $2, $3, $4)',
        [id, title, module_id, '[]']
      );
      
      const modRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [module_id]);
      if (modRes.rows.length > 0) {
        const chapterIds = parseIds(modRes.rows[0].chapter_ids);
        chapterIds.push(id);
        await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(chapterIds), module_id]);
      }
      
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, module_id } = req.body;
      const oldChapter = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [req.params.id]);
      const oldModuleId = oldChapter.rows[0]?.module_id;

      await query(
        'UPDATE "chapter" SET chapter_name = $1, module_id = $2 WHERE chapter_id = $3',
        [title, module_id, req.params.id]
      );

      if (oldModuleId && oldModuleId !== module_id) {
        const oldModRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [oldModuleId]);
        if (oldModRes.rows.length > 0) {
          const oldIds = parseIds(oldModRes.rows[0].chapter_ids).filter(id => id !== req.params.id);
          await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(oldIds), oldModuleId]);
        }
        
        const newModRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [module_id]);
        if (newModRes.rows.length > 0) {
          const newIds = parseIds(newModRes.rows[0].chapter_ids);
          if (!newIds.includes(req.params.id)) newIds.push(req.params.id);
          await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(newIds), module_id]);
        }
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const storiesCount = await query('SELECT COUNT(*) FROM "story" WHERE chapter_id = $1', [req.params.id]);
      if (parseInt(storiesCount.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete chapter that has stories.' });
      }

      const chapter = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [req.params.id]);
      const moduleId = chapter.rows[0]?.module_id;
      if (moduleId) {
        const modRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [moduleId]);
        if (modRes.rows.length > 0) {
          const ids = parseIds(modRes.rows[0].chapter_ids).filter(id => id !== req.params.id);
          await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(ids), moduleId]);
        }
      }

      await query('DELETE FROM "chapter" WHERE chapter_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const stories = {
  list: async (_req, res) => {
    try {
      const result = await query('SELECT * FROM "story" ORDER BY title ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { title, description, chapter_id, module_id, status, tags } = req.body;
      const id = `st-${Date.now()}`;
      
      let finalModuleId = module_id;
      if (!finalModuleId && chapter_id) {
        const chapterRes = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
        finalModuleId = chapterRes.rows[0]?.module_id;
      }

      await query(
        'INSERT INTO "story" (story_id, title, description, chapter_id, module_id, status, tags) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, title, description, chapter_id, finalModuleId, status || 'published', JSON.stringify(tags || [])]
      );

      if (chapter_id) {
        const chapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
        if (chapRes.rows.length > 0) {
          const storyIds = parseIds(chapRes.rows[0].story_ids);
          storyIds.push(id);
          await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(storyIds), chapter_id]);
        }
      }

      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, description, chapter_id, module_id, status, tags } = req.body;
      
      const oldStory = await query('SELECT chapter_id FROM "story" WHERE story_id = $1', [req.params.id]);
      const oldChapterId = oldStory.rows[0]?.chapter_id;

      await query(
        'UPDATE "story" SET title = $1, description = $2, chapter_id = $3, module_id = $4, status = $5, tags = $6 WHERE story_id = $7',
        [title, description, chapter_id, module_id, status, JSON.stringify(tags || []), req.params.id]
      );

      if (oldChapterId && oldChapterId !== chapter_id) {
        const oldChapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [oldChapterId]);
        if (oldChapRes.rows.length > 0) {
          const oldIds = parseIds(oldChapRes.rows[0].story_ids).filter(id => id !== req.params.id);
          await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(oldIds), oldChapterId]);
        }
        
        if (chapter_id) {
          const newChapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
          if (newChapRes.rows.length > 0) {
            const newIds = parseIds(newChapRes.rows[0].story_ids);
            if (!newIds.includes(req.params.id)) newIds.push(req.params.id);
            await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(newIds), chapter_id]);
          }
        }
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const story = await query('SELECT chapter_id FROM "story" WHERE story_id = $1', [req.params.id]);
      const chapterId = story.rows[0]?.chapter_id;
      if (chapterId) {
        const chapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapterId]);
        if (chapRes.rows.length > 0) {
          const ids = parseIds(chapRes.rows[0].story_ids).filter(id => id !== req.params.id);
          await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(ids), chapterId]);
        }
      }

      await query('DELETE FROM "story" WHERE story_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      if (!['published', 'on_hold'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const result = await query(
        'UPDATE public.story SET status = $1 WHERE story_id = $2 RETURNING *',
        [status, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const storyMappings = {
  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const isdone = status === 'published';
      const result = await query(
        'UPDATE public.story_mapping SET isdone = $1 WHERE mapping_id = $2 RETURNING *',
        [isdone, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { storyText, status } = req.body;
      let isdone = null;
      if (status !== undefined) {
        isdone = status === 'published';
      }
      const result = await query(
        'UPDATE public.story_mapping SET story_text = COALESCE($1, story_text), isdone = CASE WHEN $2::boolean IS NULL THEN isdone ELSE $2::boolean END WHERE mapping_id = $3 RETURNING *',
        [storyText, isdone, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
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
      const result = await query('SELECT id, name FROM public.principles ORDER BY name ASC');
      console.log(`[ADMIN API] Principles found: ${result.rows.length}`);
      res.json(result.rows);
    } catch (err) {
      console.error('[ADMIN API] Error fetching principles:', err);
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { name } = req.body;
      const id = `principle-${Date.now()}`;
      const result = await query(
        'INSERT INTO public.principles (id, name) VALUES ($1, $2) RETURNING id, name',
        [id, name]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { name } = req.body;
      const result = await query(
        'UPDATE public.principles SET name = $1 WHERE id = $2 RETURNING id, name',
        [name, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query('DELETE FROM public.principles WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
export const positions = {
  list: async (_req, res) => {
    try {
      const result = await query('SELECT principle_id as id, principle, fen_with_move, puzzle_list, isdone FROM public.principle_position ORDER BY principle_id ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { id, principle, fen_with_move, puzzle_list, isdone } = req.body;
      const result = await query(
        'INSERT INTO public.principle_position (principle_id, principle, fen_with_move, puzzle_list, isdone) VALUES ($1, $2, $3, $4, $5) RETURNING principle_id as id, principle, fen_with_move, puzzle_list, isdone',
        [id, principle, fen_with_move, puzzle_list, isdone || false]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { principle, fen_with_move, puzzle_list, isdone } = req.body;
      const result = await query(
        'UPDATE public.principle_position SET principle = $1, fen_with_move = $2, puzzle_list = $3, isdone = $4 WHERE principle_id = $5 RETURNING principle_id as id, principle, fen_with_move, puzzle_list, isdone',
        [principle, fen_with_move, puzzle_list, isdone, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query('DELETE FROM public.principle_position WHERE principle_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const puzzles = {
  list: async (_req, res) => {
    try {
      const result = await query(`
        SELECT 
          cp.chess_puzzle_id as id, 
          cp.principle_id, 
          cp.fen_with_move, 
          cp.isdone, 
          cp.answer,
          pp.principle as principle_name
        FROM public.chess_puzzle cp
        LEFT JOIN public.principle_position pp ON pp.principle_id = cp.principle_id
        ORDER BY cp.chess_puzzle_id ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { id, principle_id, fen_with_move, isdone, answer } = req.body;
      const result = await query(
        'INSERT INTO public.chess_puzzle (chess_puzzle_id, principle_id, fen_with_move, isdone, answer) VALUES ($1, $2, $3, $4, $5) RETURNING chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer',
        [id, principle_id, fen_with_move, isdone || false, answer]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { principle_id, fen_with_move, isdone, answer } = req.body;
      const result = await query(
        'UPDATE public.chess_puzzle SET principle_id = $1, fen_with_move = $2, isdone = $3, answer = $4 WHERE chess_puzzle_id = $5 RETURNING chess_puzzle_id as id, principle_id, fen_with_move, isdone, answer',
        [principle_id, fen_with_move, isdone, answer, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      await query('DELETE FROM public.chess_puzzle WHERE chess_puzzle_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
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
