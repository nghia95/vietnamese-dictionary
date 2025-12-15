export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchWords, addWord } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('search') || '';

        const words = searchWords(query);

        return NextResponse.json({ words });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { word, definition, phonetic } = await request.json();

        // Validate input
        if (!word || !definition) {
            return NextResponse.json(
                { error: 'Word and definition are required' },
                { status: 400 }
            );
        }

        // Add word to database
        const userId = parseInt(session.user.id as string);
        addWord(word, definition, phonetic || null, userId);

        return NextResponse.json(
            { message: 'Word added successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Add word error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
