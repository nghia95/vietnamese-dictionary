import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addToHistory, getHistory, clearHistory } from '@/lib/db';

export async function GET(request: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'SEARCH' | 'VIEW' | undefined;
    const userId = parseInt(session.user.id as string);

    try {
        const history = await getHistory(userId, type);
        return NextResponse.json({ history });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, wordId, query } = body;
    const userId = parseInt(session.user.id as string);

    if (!type || (type !== 'SEARCH' && type !== 'VIEW')) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    try {
        await addToHistory(userId, type, { wordId, query });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // 'ALL', 'SEARCH', 'VIEW'
    const userId = parseInt(session.user.id as string);

    try {
        if (type === 'ALL') {
            await clearHistory(userId);
        } else {
            await clearHistory(userId, type);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
    }
}
