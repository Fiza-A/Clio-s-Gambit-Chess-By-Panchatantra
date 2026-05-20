import { query } from './data/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
  try {
    console.log('Starting migration for activity tables...');
    
    // 1. Create players_activity table
    await query(`
      CREATE TABLE IF NOT EXISTS public.players_activity (
        "index" SERIAL PRIMARY KEY,
        "Chess_com_ID" text NOT NULL,
        "status" text,
        "total_games" integer DEFAULT 0,
        "blitz_rating" integer[],
        "rapid_rating" integer[],
        "rapid_results" text[],
        "blitz_results" text[],
        "fetch_lock" boolean DEFAULT false,
        "date" text NOT NULL,
        "blitz_times" text[],
        "rapid_times" text[]
      );
    `);

    // 2. Create player_games table
    await query(`
      CREATE TABLE IF NOT EXISTS public.player_games (
        "game_id" text PRIMARY KEY,
        "chess_com_id" text NOT NULL,
        "game_date" date NOT NULL,
        "pgn" text,
        "white_player" text,
        "black_player" text,
        "is_brilliant_found" boolean DEFAULT false,
        "brilliant_moves" jsonb
      );
    `);

    console.log('Activity tables created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
