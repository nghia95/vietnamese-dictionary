import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('🔧 Cleaning up quoted word names...');
console.log('Database URL:', url.includes('turso') ? 'Turso Remote' : url);
console.log('Auth Token:', authToken ? 'Present' : 'Missing');

const client = createClient({
    url,
    authToken,
});

function sanitizeWord(word: string): string {
    return word.trim().replace(/^["'"']|["'"']$/g, '');
}

async function cleanupQuotes() {
    try {
        // Find all words with surrounding quotes
        const wordsResult = await client.execute('SELECT id, word FROM words');

        let cleanedCount = 0;
        const updates: Array<{ id: number; old: string; new: string }> = [];

        for (const row of wordsResult.rows) {
            const id = row.id as number;
            const originalWord = row.word as string;
            const sanitizedWord = sanitizeWord(originalWord);

            if (originalWord !== sanitizedWord) {
                updates.push({ id, old: originalWord, new: sanitizedWord });
            }
        }

        if (updates.length === 0) {
            console.log('✅ No words found with surrounding quotes. Database is clean!');
            return;
        }

        console.log(`\n📝 Found ${updates.length} words with quotes to clean:\n`);

        // Show first 10 examples
        const examples = updates.slice(0, 10);
        for (const { id, old, new: newWord } of examples) {
            console.log(`  ID ${id}: "${old}" → "${newWord}"`);
        }
        if (updates.length > 10) {
            console.log(`  ... and ${updates.length - 10} more`);
        }

        console.log('\n🔨 Starting cleanup...');

        // Update each word
        for (const { id, new: newWord } of updates) {
            await client.execute({
                sql: 'UPDATE words SET word = ? WHERE id = ?',
                args: [newWord, id]
            });
            cleanedCount++;
        }

        console.log(`\n✅ Successfully cleaned ${cleanedCount} words!`);
        console.log('🎉 Database cleanup complete.\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupQuotes();
