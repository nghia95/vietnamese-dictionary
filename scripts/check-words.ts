import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Database URL:', url.includes('turso') ? 'Turso Remote' : url);
console.log('Auth Token:', authToken ? 'Present' : 'Missing');

const client = createClient({
    url,
    authToken,
});

async function checkWords() {
    try {
        // Count words
        const countResult = await client.execute('SELECT COUNT(*) as count FROM words');
        console.log('\n📊 Total words:', countResult.rows[0]?.count);

        // Show all words
        const wordsResult = await client.execute(`
            SELECT w.id, w.word, w.phonetic, u.name as user_name, w.created_at 
            FROM words w
            LEFT JOIN users u ON w.user_id = u.id
            LIMIT 20
        `);

        console.log('\n📝 Words (first 20):');
        for (const row of wordsResult.rows) {
            console.log(`  ${row.id}: ${row.word} (${row.phonetic || 'no phonetic'}) - added by ${row.user_name || 'unknown'} on ${row.created_at}`);
        }

        // Count definitions
        const defCountResult = await client.execute('SELECT COUNT(*) as count FROM definitions');
        console.log('\n📖 Total definitions:', defCountResult.rows[0]?.count);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkWords();
