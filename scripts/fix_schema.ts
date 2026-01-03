import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkSchema() {
    console.log('Loading client...');
    // Dynamically import client after env vars are loaded
    const { client } = await import('../lib/db');
    console.log('Checking schema...');

    try {
        // Check definitions table info
        const result = await client.execute("PRAGMA table_info(definitions)");
        console.log('Columns in definitions table:');
        const columns = result.rows.map(row => row.name);
        console.log(columns);

        if (!columns.includes('type')) {
            console.log('Adding missing column: type');
            await client.execute("ALTER TABLE definitions ADD COLUMN type TEXT");
            console.log('✅ Added type column');
        }

        if (!columns.includes('order')) {
            console.log('Adding missing column: order');
            await client.execute("ALTER TABLE definitions ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0");
            console.log('✅ Added order column');
        }

    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkSchema();
