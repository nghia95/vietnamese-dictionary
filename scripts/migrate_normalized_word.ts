import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Loading client...');
    const { client } = await import('../lib/db');

    console.log('Checking words table schema...');
    try {
        const tableInfo = await client.execute("PRAGMA table_info(words)");
        const columns = tableInfo.rows.map(row => row.name);

        if (!columns.includes('normalized_word')) {
            console.log('Adding missing column: normalized_word');
            await client.execute("ALTER TABLE words ADD COLUMN normalized_word TEXT");
            console.log('✅ Added normalized_word column');

            // Backfill
            console.log('Backfilling normalized_word...');
            const words = await client.execute("SELECT id, word FROM words");
            let count = 0;
            for (const row of words.rows) {
                const word = row.word as string;
                const normalized = word.toLowerCase();
                await client.execute({
                    sql: "UPDATE words SET normalized_word = ? WHERE id = ?",
                    args: [normalized, row.id]
                });
                count++;
            }
            console.log(`✅ Backfilled ${count} words.`);
        } else {
            console.log('normalized_word column already exists.');
        }

        // Create index to speed up search
        console.log('Creating index on normalized_word...');
        await client.execute("CREATE INDEX IF NOT EXISTS idx_words_normalized_word ON words(normalized_word)");
        console.log('✅ Index created.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
