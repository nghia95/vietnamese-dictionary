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
        console.log('Adding image column to words table...');
        await client.execute('ALTER TABLE words ADD COLUMN image TEXT');
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
