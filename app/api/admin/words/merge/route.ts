import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@libsql/client';
import { getWordById } from '@/lib/db';

const url = process.env.TURSO_DATABASE_URL || 'file:dictionary.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { wordIds } = await req.json();

        if (!Array.isArray(wordIds) || wordIds.length < 2) {
            return NextResponse.json({ error: 'Please select at least 2 words to merge' }, { status: 400 });
        }

        // 1. Fetch all words to verify they are identical
        const words = [];
        for (const id of wordIds) {
            const w = await getWordById(id);
            if (w) words.push(w);
        }

        if (words.length !== wordIds.length) {
            return NextResponse.json({ error: 'One or more words not found' }, { status: 404 });
        }

        // 2. Check if all words have the exact same text (case-insensitive or exact, usually case-insensitive for this case)
        const firstWordText = words[0].word.trim().toLowerCase();
        const allSame = words.every(w => w.word.trim().toLowerCase() === firstWordText);

        if (!allSame) {
            return NextResponse.json({
                error: 'Thao tác không thể thực hiện vì có ít nhất hai từ khác nhau trong những mục được chọn'
            }, { status: 400 });
        }

        // 3. Perform Merge
        // Primary word: The one with the lowest ID (usually created first)
        // We sort words by ID asc
        words.sort((a, b) => a.id - b.id);
        const primaryWord = words[0];
        const secondaryWords = words.slice(1);
        const secondaryIds = secondaryWords.map(w => w.id);

        // We can't do a real transaction with the HTTP client easily without `transaction()` method if supported
        // But we will just execute sequentially. If it fails halfway, it's messy but rare in this scope.
        // Ideally use client.transaction if available or just sequential creates.
        // LibSQL client `execute` can handle multiple statements? No, standard client. 
        // We will do sequential updates.

        const placeholders = secondaryIds.map(() => '?').join(',');

        // Prepare batch statements
        const statements = [
            // Move Definitions
            {
                sql: `UPDATE definitions SET word_id = ? WHERE word_id IN (${placeholders})`,
                args: [primaryWord.id, ...secondaryIds]
            },
            // Move Etymologies
            {
                sql: `UPDATE etymologies SET word_id = ? WHERE word_id IN (${placeholders})`,
                args: [primaryWord.id, ...secondaryIds]
            },
            // Move Related Words
            {
                sql: `UPDATE related_words SET word_id = ? WHERE word_id IN (${placeholders})`,
                args: [primaryWord.id, ...secondaryIds]
            },
            // Move Comments
            {
                sql: `UPDATE comments SET word_id = ? WHERE word_id IN (${placeholders})`,
                args: [primaryWord.id, ...secondaryIds]
            },
            // Move Feedbacks
            {
                sql: `UPDATE feedbacks SET word_id = ? WHERE word_id IN (${placeholders})`,
                args: [primaryWord.id, ...secondaryIds]
            },
            // Delete Secondary Words
            {
                sql: `DELETE FROM words WHERE id IN (${placeholders})`,
                args: [...secondaryIds]
            }
        ];

        // Execute as a single batch transaction
        await client.batch(statements, 'write');

        return NextResponse.json({ success: true, message: `Merged ${secondaryWords.length} words into "${primaryWord.word}"` });

    } catch (error) {
        console.error('Merge error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
