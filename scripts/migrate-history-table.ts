
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function migrate() {
    try {
        console.log('Starting migration for history table...');

        // 1. Create new table with ON DELETE CASCADE
        console.log('Creating history_new table...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS history_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                word_id INTEGER,
                query TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
            )
        `);

        // 2. Copy data
        console.log('Copying data...');
        await client.execute(`
            INSERT INTO history_new (id, user_id, type, word_id, query, created_at)
            SELECT id, user_id, type, word_id, query, created_at FROM history
        `);

        // 3. Drop old table
        console.log('Dropping old history table...');
        await client.execute('DROP TABLE history');

        // 4. Rename new table
        console.log('Renaming history_new to history...');
        await client.execute('ALTER TABLE history_new RENAME TO history');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrate();
