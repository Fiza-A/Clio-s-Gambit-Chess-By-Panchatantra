import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  try {
    const tables = ['Login', 'module', 'chapter'];
    for (const table of tables) {
      const res = await pool.query(`SELECT * FROM "${table}" LIMIT 5`);
      console.log(`Data from ${table}:`, res.rows);
    }
    await pool.end();
  } catch (err) {
    console.error('Failed to check data:', err);
    process.exit(1);
  }
}

checkData();
