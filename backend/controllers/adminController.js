import bcrypt from 'bcrypt';
import { readDb, writeDb } from '../data/mockDb.js';
import { makeId } from '../utils/id.js';
import { query } from '../data/database.js';

const byId = (items, id) => items.find((item) => item.id === id);

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
export const curriculum = async (_req, res) => {
  console.log('[ADMIN API] GET /curriculum - Fetching from DB');
  try {
    // Fetch with parent names for better UI context
    const modulesRes = await query('SELECT * FROM "module" ORDER BY order_index ASC');
    const chaptersRes = await query(`
      SELECT c.*, m.module_name 
      FROM "chapter" c
      LEFT JOIN "module" m ON c.module_id = m.module_id
      ORDER BY c.order_index ASC
    `);
    const storiesRes = await query(`
      SELECT s.*, c.chapter_name, m.module_name
      FROM "story" s
      LEFT JOIN "chapter" c ON s.chapter_id = c.chapter_id
      LEFT JOIN "module" m ON s.module_id = m.module_id
      ORDER BY s.order_index ASC
    `);
    const principlesRes = await query('SELECT * FROM "principles" ORDER BY name ASC');
    
    res.json({
      modules: modulesRes.rows.map(m => ({
        module_id: m.module_id,
        title: m.module_name,
        subtitle: m.subtitle,
        level: m.level,
        order_index: m.order_index,
        chaptersCount: parseIds(m.chapter_ids).length
      })),
      chapters: chaptersRes.rows.map(c => ({
        chapter_id: c.chapter_id,
        module_id: c.module_id,
        module_name: c.module_name,
        title: c.chapter_name,
        order_index: c.order_index,
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
        content: s.content,
        order_index: s.order_index,
        status: s.status || 'published',
        tags: parseIds(s.tags),
        principle_ids: parseIds(s.principle_ids)
      })),
      principles: principlesRes.rows
    });
  } catch (err) {
    console.error('[ADMIN API] Error in curriculum:', err);
    res.status(500).json({ error: 'Failed to fetch curriculum data' });
  }
};

export const modules = {
  create: async (req, res) => {
    try {
      const { title, subtitle, level, order_index } = req.body;
      const id = `mod-${Date.now()}`;
      await query(
        'INSERT INTO "module" (module_id, module_name, subtitle, level, order_index, chapter_ids) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, title, subtitle, level, order_index || 0, '[]']
      );
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, subtitle, level, order_index } = req.body;
      await query(
        'UPDATE "module" SET module_name = $1, subtitle = $2, level = $3, order_index = $4 WHERE module_id = $5',
        [title, subtitle, level, order_index, req.params.id]
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      // Prevent deletion if module has chapters
      const chaptersCount = await query('SELECT COUNT(*) FROM "chapter" WHERE module_id = $1', [req.params.id]);
      if (parseInt(chaptersCount.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete module that has chapters. Please delete or move chapters first.' });
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
      const { title, module_id, order_index } = req.body;
      const id = `ch-${Date.now()}`;
      await query(
        'INSERT INTO "chapter" (chapter_id, chapter_name, module_id, order_index, story_ids) VALUES ($1, $2, $3, $4, $5)',
        [id, title, module_id, order_index || 0, '[]']
      );
      // Update module's chapter_ids
      const modRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [module_id]);
      const chapterIds = parseIds(modRes.rows[0]?.chapter_ids);
      chapterIds.push(id);
      await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(chapterIds), module_id]);
      
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, module_id, order_index } = req.body;
      // Get old module_id to update if changed
      const oldChapter = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [req.params.id]);
      const oldModuleId = oldChapter.rows[0]?.module_id;

      await query(
        'UPDATE "chapter" SET chapter_name = $1, module_id = $2, order_index = $3 WHERE chapter_id = $4',
        [title, module_id, order_index, req.params.id]
      );

      if (oldModuleId && oldModuleId !== module_id) {
        // Remove from old module
        const oldModRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [oldModuleId]);
        const oldIds = parseIds(oldModRes.rows[0]?.chapter_ids).filter(id => id !== req.params.id);
        await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(oldIds), oldModuleId]);
        
        // Add to new module
        const newModRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [module_id]);
        const newIds = parseIds(newModRes.rows[0]?.chapter_ids);
        if (!newIds.includes(req.params.id)) newIds.push(req.params.id);
        await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(newIds), module_id]);
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      // Prevent deletion if chapter has stories
      const storiesCount = await query('SELECT COUNT(*) FROM "story" WHERE chapter_id = $1', [req.params.id]);
      if (parseInt(storiesCount.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete chapter that has stories. Please delete or move stories first.' });
      }

      // Remove from module chapter_ids
      const chapter = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [req.params.id]);
      const moduleId = chapter.rows[0]?.module_id;
      if (moduleId) {
        const modRes = await query('SELECT chapter_ids FROM "module" WHERE module_id = $1', [moduleId]);
        const ids = parseIds(modRes.rows[0]?.chapter_ids).filter(id => id !== req.params.id);
        await query('UPDATE "module" SET chapter_ids = $1 WHERE module_id = $2', [JSON.stringify(ids), moduleId]);
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
      const result = await query('SELECT * FROM "story" ORDER BY order_index ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const { title, description, content, chapter_id, module_id, order_index, status, tags, principle_ids } = req.body;
      const id = `st-${Date.now()}`;
      
      // If module_id not provided, get it from chapter
      let finalModuleId = module_id;
      if (!finalModuleId && chapter_id) {
        const chapterRes = await query('SELECT module_id FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
        finalModuleId = chapterRes.rows[0]?.module_id;
      }

      await query(
        'INSERT INTO "story" (story_id, title, description, content, chapter_id, module_id, order_index, status, tags, principle_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [id, title, description, content, chapter_id, finalModuleId, order_index || 0, status || 'published', JSON.stringify(tags || []), JSON.stringify(principle_ids || [])]
      );

      // Update chapter's story_ids
      if (chapter_id) {
        const chapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
        const storyIds = parseIds(chapRes.rows[0]?.story_ids);
        storyIds.push(id);
        await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(storyIds), chapter_id]);
      }

      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const { title, description, content, chapter_id, module_id, order_index, status, tags, principle_ids } = req.body;
      
      // Get old chapter_id to update if changed
      const oldStory = await query('SELECT chapter_id FROM "story" WHERE story_id = $1', [req.params.id]);
      const oldChapterId = oldStory.rows[0]?.chapter_id;

      await query(
        'UPDATE "story" SET title = $1, description = $2, content = $3, chapter_id = $4, module_id = $5, order_index = $6, status = $7, tags = $8, principle_ids = $9 WHERE story_id = $10',
        [title, description, content, chapter_id, module_id, order_index, status, JSON.stringify(tags || []), JSON.stringify(principle_ids || []), req.params.id]
      );

      if (oldChapterId && oldChapterId !== chapter_id) {
        // Remove from old chapter
        const oldChapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [oldChapterId]);
        const oldIds = parseIds(oldChapRes.rows[0]?.story_ids).filter(id => id !== req.params.id);
        await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(oldIds), oldChapterId]);
        
        // Add to new chapter
        if (chapter_id) {
          const newChapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapter_id]);
          const newIds = parseIds(newChapRes.rows[0]?.story_ids);
          if (!newIds.includes(req.params.id)) newIds.push(req.params.id);
          await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(newIds), chapter_id]);
        }
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      // Remove from chapter story_ids
      const story = await query('SELECT chapter_id FROM "story" WHERE story_id = $1', [req.params.id]);
      const chapterId = story.rows[0]?.chapter_id;
      if (chapterId) {
        const chapRes = await query('SELECT story_ids FROM "chapter" WHERE chapter_id = $1', [chapterId]);
        const ids = parseIds(chapRes.rows[0]?.story_ids).filter(id => id !== req.params.id);
        await query('UPDATE "chapter" SET story_ids = $1 WHERE chapter_id = $2', [JSON.stringify(ids), chapterId]);
      }

      await query('DELETE FROM "story" WHERE story_id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const user = (req, res) => res.json(byId(readDb().admin.users, req.params.id) || {});
export const principles = crud('principles');
export const puzzles = crud('puzzles');
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
