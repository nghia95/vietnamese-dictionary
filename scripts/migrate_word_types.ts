
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('--- Running Migration: Word Types Table ---');
    const { createClient } = await import('@libsql/client');

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL || 'file:dictionary.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        // 1. Create table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS word_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);
        console.log('✅ Created word_types table');

        // 2. Seed standard types
        const standardTypes = [
            'Danh từ', 'Động từ', 'Tính từ', 'Trạng từ',
            'Đại từ', 'Giới từ', 'Liên từ', 'Thán từ',
            'Số từ', 'Lượng từ'
        ];

        for (const type of standardTypes) {
            await client.execute({
                sql: 'INSERT OR IGNORE INTO word_types (name) VALUES (?)',
                args: [type]
            });
        }
        console.log('✅ Seeded standard types');

        // 3. Import existing types from definitions
        const existingResult = await client.execute(
            'SELECT DISTINCT type FROM definitions WHERE type IS NOT NULL AND type != ""'
        );

        let importedCount = 0;
        for (const row of existingResult.rows) {
            const type = row.type as string;
            const result = await client.execute({
                sql: 'INSERT OR IGNORE INTO word_types (name) VALUES (?)',
                args: [type]
            });
            if (result.rowsAffected > 0) importedCount++;
        }
        console.log(`✅ Imported ${importedCount} existing types from definitions`);

    } catch (error) {
        console.error('--- Migration Failed ---', error);
    }
}

main();
