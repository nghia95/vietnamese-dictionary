export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { updateUserBan } from '@/lib/db';
import { auth } from '@/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id);
        const { bannedUntil } = await request.json();

        // Hierarchy check
        const { getUserById } = await import('@/lib/db');
        const targetUser = await getUserById(userId);

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent Moderator from banning Admin or other Moderator
        if (session.user.role === 'moderator' && (targetUser.role === 'admin' || targetUser.role === 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized: Moderators cannot ban Admins or Moderators' }, { status: 403 });
        }

        // Prevent Admin from banning other Admin (optional but good practice)
        if (session.user.role === 'admin' && targetUser.role === 'admin') {
            return NextResponse.json({ error: 'Unauthorized: Cannot ban an Admin' }, { status: 403 });
        }

        // bannedUntil can be a ISO string or null
        await updateUserBan(userId, bannedUntil);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update ban error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
