export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { deleteUser, getUserById } from '@/lib/db';
import { auth } from '@/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id);

        if (session.user.id === id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        // Super Admin Protection
        const targetUser = await getUserById(userId);
        if (targetUser && targetUser.email === 'nghiahcmut95@gmail.com') {
            return NextResponse.json({ error: 'Cannot delete Super Admin' }, { status: 403 });
        }

        await deleteUser(userId, session.user.id ? parseInt(session.user.id) : undefined);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
