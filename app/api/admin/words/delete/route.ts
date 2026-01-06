import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@libsql/client';

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

        if (!Array.isArray(wordIds) || wordIds.length === 0) {
            return NextResponse.json({ error: 'Please select at least 1 word to delete' }, { status: 400 });
        }

        const placeholders = wordIds.map(() => '?').join(',');

        // Prepare statements for bulk deletion
        // Note: SQLite foreign keys with ON DELETE CASCADE should handle dependent table cleanups automatically 
        // if configured. However, our schema definitions in db.ts show CASCADE for most relationships,
        // so deleting from `words` table SHOULD cascade to definitions, etymologies, related_words.
        // Comments and Feedbacks also have CASCADE or SET NULL.

        // Let's verify schema from db.ts:
        // definitions -> ON DELETE CASCADE - OK
        // etymologies -> ON DELETE CASCADE - OK
        // related_words -> ON DELETE CASCADE - OK
        // comments -> ON DELETE CASCADE - OK
        // feedbacks -> ON DELETE SET NULL - OK (Feedbacks kept but word_id null)

        // So we only need to delete from the words table!

        await client.execute({
            sql: `DELETE FROM words WHERE id IN (${placeholders})`,
            args: [...wordIds]
        });

        return NextResponse.json({ success: true, message: `Đã xóa thành công ${wordIds.length} từ` });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
