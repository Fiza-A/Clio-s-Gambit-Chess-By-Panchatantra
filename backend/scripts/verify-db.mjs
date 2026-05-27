import { verifyDatabaseConnection } from '../data/database.js';

const result = await verifyDatabaseConnection();
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
