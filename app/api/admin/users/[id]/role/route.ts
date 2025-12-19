export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db';
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
        const { role } = await request.json();

        if (!role || (role !== 'admin' && role !== 'user')) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        await updateUserRole(userId, role);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update role error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
