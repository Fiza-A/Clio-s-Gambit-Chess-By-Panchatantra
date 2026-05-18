import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    for (const table of res.rows.map(r => r.table_name)) {
       const cols = await pool.query(`
         SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1
       `, [table]);
       console.log(`Columns for ${table}:`, cols.rows.map(r => r.column_name));
    }

  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}

check();
