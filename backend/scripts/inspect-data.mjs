import { query } from '../data/database.js';

const stories = await query('SELECT id, title FROM stories LIMIT 5');
const modules = await query('SELECT * FROM module LIMIT 3');
const chapters = await query('SELECT * FROM chapter LIMIT 3');
console.log('stories sample:', stories.rows);
console.log('modules sample:', modules.rows);
console.log('chapters sample:', chapters.rows);
