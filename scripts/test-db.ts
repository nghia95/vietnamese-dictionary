import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Testing DB connection...');
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('Database URL:', url ? (url.includes('turso.io') ? 'Turso Remote' : 'Local/Other') : 'Defaulting to file:dictionary.db');
console.log('Auth Token:', token ? 'Present' : 'Missing');

const client = createClient({
    url: url || 'file:dictionary.db',
    authToken: token,
});

async function main() {
    try {
        console.log('Executing query...');
        const start = Date.now();
        const result = await client.execute('SELECT 1 as val');
        console.log('✅ Connected successfully in', Date.now() - start, 'ms');
        console.log('Result:', result.rows);
    } catch (e) {
        console.error('❌ Connection failed:', e);
    }
}

main();
