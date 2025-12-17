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
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id);
        const { bannedUntil } = await request.json();

        // bannedUntil can be a ISO string or null
        updateUserBan(userId, bannedUntil);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update ban error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
