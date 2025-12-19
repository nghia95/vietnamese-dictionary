import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { getVietnameseSortKey } from '../lib/utils';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function migrate() {
    try {
        console.log('Adding sort_key column to words table...');
        try {
            await client.execute('ALTER TABLE words ADD COLUMN sort_key TEXT');
        } catch (e) {
            console.log('Column sort_key might already exist, proceeding to backfill...');
        }

        console.log('Fetching existing words...');
        const result = await client.execute('SELECT id, word FROM words');
        const words = result.rows;

        console.log(`Found ${words.length} words to update.`);

        for (const row of words) {
            const id = row.id as number;
            const word = row.word as string;
            const sortKey = getVietnameseSortKey(word);

            await client.execute({
                sql: 'UPDATE words SET sort_key = ? WHERE id = ?',
                args: [sortKey, id]
            });
            if (id % 50 === 0) process.stdout.write('.');
        }

        console.log('\nMigration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
