export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCommentsForWord, addComment } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const wordId = searchParams.get('wordId');

        if (!wordId) {
            return NextResponse.json({ error: 'Word ID required' }, { status: 400 });
        }

        const session = await auth();
        const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

        const comments = await getCommentsForWord(parseInt(wordId), userId);
        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { wordId, content, parentId } = await request.json();
        const userId = parseInt(session.user.id);

        if (!wordId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const commentId = await addComment(wordId, userId, content, parentId);
        return NextResponse.json({ id: commentId, message: 'Comment added' }, { status: 201 });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
