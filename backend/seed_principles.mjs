import { query } from './backend/data/database.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./backend/.env') });

async function seed() {
  try {
    console.log('Mapping principles to stories...');
    
    // Get some principles
    const principlesRes = await query('SELECT id, name FROM "principles"');
    const principles = principlesRes.rows;
    console.log('Available principles:', principles.map(p => p.name).join(', '));

    if (principles.length === 0) {
      console.log('No principles found. Please run migration first.');
      process.exit(1);
    }

    // Get some stories
    const storiesRes = await query('SELECT story_id, title FROM "story" LIMIT 10');
    const stories = storiesRes.rows;

    if (stories.length === 0) {
      console.log('No stories found.');
      process.exit(1);
    }

    // Map principles to stories
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      // Pick 1-2 random principles
      const count = Math.floor(Math.random() * 2) + 1;
      const selected = [];
      for (let j = 0; j < count; j++) {
        const p = principles[Math.floor(Math.random() * principles.length)];
        if (!selected.includes(p.id)) selected.push(p.id);
      }

      console.log(`Linking [${selected.join(', ')}] to story: ${story.title}`);
      await query(
        'UPDATE "story" SET principle_ids = $1 WHERE story_id = $2',
        [JSON.stringify(selected), story.story_id]
      );
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
