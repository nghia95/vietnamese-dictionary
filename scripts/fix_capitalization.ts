import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { toTitleCase, getVietnameseSortKey } from '../lib/utils';
import { Word } from '../types';

async function fixCapitalization() {
    console.log('🔄 Starting capitalization fix...');
    const { client } = await import('../lib/db');

    try {
        // Fetch all words
        const result = await client.execute('SELECT id, word, phonetic, image, user_id FROM words');
        const words = result.rows as unknown as Word[];

        console.log(`📊 Found ${words.length} words.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const w of words) {
            try {
                const currentWord = w.word;
                const newWord = toTitleCase(currentWord);

                if (currentWord !== newWord) {
                    const newSortKey = getVietnameseSortKey(newWord);

                    // Check if newWord already exists (to avoid unique constraint violation if we are merging)
                    // Note: This script assumes simple in-place update. If "word" and "Word" both exist, 
                    // updating "word" to "Word" will fail due to unique constraint if you have one?
                    // The schema does NOT have a UNIQUE constraint on 'word' column explicitly 
                    // (based on previous view_file of db.ts, it has an index but no UNIQUE constraint in CREATE TABLE).
                    // Wait, let's check CREATE TABLE in db.ts:
                    // CREATE TABLE IF NOT EXISTS words ( ... word TEXT NOT NULL ... )
                    // It does NOT say UNIQUE.
                    // However, it has an index: CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE)

                    // So duplicates ARE allowed by schema, but might be undesirable. 
                    // The user request says "unified these format".
                    // If "word" and "Word" both exist, we might end up with two "Word"s.
                    // For now, let's just update.

                    await client.execute({
                        sql: 'UPDATE words SET word = ?, sort_key = ? WHERE id = ?',
                        args: [newWord, newSortKey, w.id]
                    });

                    console.log(`✅ Updated: "${currentWord}" -> "${newWord}"`);
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.error(`❌ Error updating word ID ${w.id} (${w.word}):`, err);
                errorCount++;
            }
        }

        console.log('🎉 Migration complete!');
        console.log(`Summary: Updated ${updatedCount}, Skipped ${skippedCount}, Errors ${errorCount}`);

    } catch (err) {
        console.error('❌ specific error:', err);
    }
}

fixCapitalization();
