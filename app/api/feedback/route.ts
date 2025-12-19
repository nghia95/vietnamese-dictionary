export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getAllFeedbacks } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { wordId, content } = await request.json();
        const userId = parseInt(session.user.id);

        if (!content) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        await addFeedback(wordId || null, userId, content);
        return NextResponse.json({ message: 'Feedback sent' }, { status: 201 });
    } catch (error) {
        console.error('Error sending feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const feedbacks = await getAllFeedbacks();
        return NextResponse.json({ feedbacks });
    } catch (error) {
        console.error('Error getting feedbacks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
