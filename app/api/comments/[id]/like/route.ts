export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { toggleCommentLike } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const commentId = parseInt(params.id);
        const userId = parseInt(session.user.id);

        const isLiked = await toggleCommentLike(commentId, userId);
        return NextResponse.json({ isLiked });
    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
