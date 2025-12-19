import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Migrating database...');
console.log(`URL: ${url?.includes('turso') ? 'Turso Remote' : url}`);

if (!url) {
    console.error('❌ TURSO_DATABASE_URL is missing!');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    try {
        // Create comments table
        console.log('Creating comments table...');
        await client.execute(`
        CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER,
        likes_count INTEGER DEFAULT 0,
        is_hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        )
    `);

        // Create comment_likes table
        console.log('Creating comment_likes table...');
        await client.execute(`
        CREATE TABLE IF NOT EXISTS comment_likes (
        comment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (comment_id, user_id),
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

        // Create feedbacks table
        console.log('Creating feedbacks table...');
        await client.execute(`
        CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

        // Indexes
        console.log('Creating indexes...');
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_comments_word_id ON comments(word_id)`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`);

        console.log('✅ Migration complete!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    }
}

main();
