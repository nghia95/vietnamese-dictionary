export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { updateFeedbackStatus } from '@/lib/db';
import { auth } from '@/auth';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const params = await context.params;
        const feedbackId = parseInt(params.id);
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ error: 'Status required' }, { status: 400 });
        }

        await updateFeedbackStatus(feedbackId, status);
        return NextResponse.json({ message: 'Updated' });

    } catch (error) {
        console.error('Error updating feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
