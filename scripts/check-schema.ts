
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function checkSchema() {
    try {
        console.log('Checking schema for table: history');
        const result = await client.execute("SELECT sql FROM sqlite_master WHERE name='history'");
        if (result.rows.length > 0) {
            console.log('Schema:', result.rows[0].sql);
        } else {
            console.log('Table history not found.');
        }

        console.log('\nChecking pragma foreign_keys:');
        const pragma = await client.execute("PRAGMA foreign_keys");
        console.log(pragma.rows);

    } catch (e) {
        console.error(e);
    }
}

checkSchema();
