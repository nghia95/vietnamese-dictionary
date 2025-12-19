export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { deleteUser } from '@/lib/db';
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

        await deleteUser(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
