import { query } from './data/database.js';
import * as chessComService from './services/chessComService.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function populate() {
  console.log('Starting players table population...');
  try {
    // 1. Get all users with Chess.com IDs from Login table
    const usersRes = await query('SELECT "Chess_com_ID", "Player_Name", "Role" FROM "Login" WHERE "Chess_com_ID" IS NOT NULL AND "Chess_com_ID" != \'\'');
    const users = usersRes.rows;
    console.log(`Found ${users.length} users to process.`);
    
    let added = 0;
    let updated = 0;
    let errors = [];

    const fetchOptions = {
      headers: {
        'User-Agent': 'Chess-by-Panchatantra/1.0'
      }
    };

    for (const user of users) {
      const chessId = user.Chess_com_ID.trim();
      console.log(`Processing ${chessId}...`);
      
      let currentElo = 0;
      let joiningDate = new Date().toISOString().split('T')[0];
      let profileName = user.Player_Name || chessId;

      try {
        // Wait 10 seconds between players to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 2. Fetch data from Chess.com API sequentially
        const profileUrl = chessComService.getChessComProfileUrl(chessId);
        const statsUrl = chessComService.getChessComStatsUrl(chessId);

        console.log(`  Fetching profile for ${chessId} from ${profileUrl}...`);
        const profileRes = await fetch(profileUrl, fetchOptions);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profileName = profileData.name || profileName;
          if (profileData.joined) {
            joiningDate = new Date(profileData.joined * 1000).toISOString().split('T')[0];
          }
        } else {
          console.error(`  Profile Fetch Failed for ${chessId}: Status ${profileRes.status}`);
        }

        // Wait 5 seconds between profile and stats
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log(`  Fetching stats for ${chessId} from ${statsUrl}...`);
        const statsRes = await fetch(statsUrl, fetchOptions);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          currentElo = Math.max(
            statsData.chess_blitz?.last?.rating || 0,
            statsData.chess_rapid?.last?.rating || 0,
            statsData.chess_bullet?.last?.rating || 0,
            statsData.tactics?.highest?.rating || 0
          );
        } else {
          console.error(`  Stats Fetch Failed for ${chessId}: Status ${statsRes.status}`);
        }

        console.log(`  Fetched: ${profileName} (ELO: ${currentElo})`);
      } catch (err) {
        console.error(`  Warning: Could not fetch from Chess.com for ${chessId}:`, err.message);
        errors.push({ id: chessId, error: err.message });
        // Continue with default values so table is not empty
      }

      try {
        // 3. Update or Insert into players table
        const checkRes = await query('SELECT "Chess_com_ID" FROM public.players WHERE "Chess_com_ID" = $1', [chessId]);
        
        if (checkRes.rows.length > 0) {
          await query(
            'UPDATE public.players SET "Player_Name" = $1, "current_elo" = $2 WHERE "Chess_com_ID" = $3',
            [profileName, currentElo, chessId]
          );
          updated++;
        } else {
          await query(
            'INSERT INTO public.players ("Chess_com_ID", "Player_Name", "Joining_Date", "current_elo", "activity_tracker") VALUES ($1, $2, $3, $4, $5)',
            [chessId, profileName, joiningDate, currentElo, JSON.stringify({})]
          );
          added++;
        }
      } catch (dbErr) {
        console.error(`  Database Error for ${chessId}:`, dbErr.message);
      }
    }

    console.log(`\nPopulation Complete!`);
    console.log(`Added: ${added}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during population:', err);
    process.exit(1);
  }
}

populate();
