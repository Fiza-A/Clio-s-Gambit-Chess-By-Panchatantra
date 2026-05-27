import { query } from '../data/database.js';

for (const table of ['stories', 'module', 'chapter', 'story_mapping', 'Login']) {
  try {
    const cols = await query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    );
    console.log(`\n=== ${table} ===`);
    if (!cols.rows.length) console.log('(missing)');
    else cols.rows.forEach((c) => console.log(`  ${c.column_name}: ${c.data_type}`));
  } catch (e) {
    console.log(`\n=== ${table} === ERROR`, e.message);
  }
}
