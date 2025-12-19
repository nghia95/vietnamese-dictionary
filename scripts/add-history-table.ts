import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

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
        console.log('Creating history table...');

        await client.execute(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'SEARCH' or 'VIEW'
        word_id INTEGER, -- For VIEW type
        query TEXT, -- For SEARCH type
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (word_id) REFERENCES words(id)
      )
    `);

        console.log('History table created successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
