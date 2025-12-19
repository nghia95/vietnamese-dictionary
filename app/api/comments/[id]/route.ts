export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { deleteComment, hideComment } from '@/lib/db';
import { auth } from '@/auth';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const params = await context.params;
        const commentId = parseInt(params.id);

        await deleteComment(commentId);
        return NextResponse.json({ message: 'Deleted' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const params = await context.params;
        const commentId = parseInt(params.id);
        const { isHidden } = await request.json();

        await hideComment(commentId, isHidden);
        return NextResponse.json({ message: 'Updated' });
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
