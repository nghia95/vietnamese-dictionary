
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error('Missing TURSO_DATABASE_URL');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function migrate() {
    console.log('Starting migration...');

    try {
        // Check if column exists
        try {
            await client.execute('SELECT avatar FROM users LIMIT 1');
            console.log('✅ Column "avatar" already exists in "users" table.');
        } catch (e) {
            console.log('Column "avatar" likely missing. Attempting to add it...');
            await client.execute('ALTER TABLE users ADD COLUMN avatar TEXT');
            console.log('✅ Added "avatar" column to "users" table.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
