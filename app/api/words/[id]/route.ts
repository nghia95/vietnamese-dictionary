export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getWordById, updateWord } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const wordId = parseInt(id);

        if (isNaN(wordId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const word = getWordById(wordId);

        if (!word) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        return NextResponse.json({ word });
    } catch (error) {
        console.error('Get word error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized: Only admins can edit words' }, { status: 403 });
        }

        const { id } = await params;
        const wordId = parseInt(id);
        if (isNaN(wordId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const existingWord = getWordById(wordId);
        if (!existingWord) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }



        const body = await request.json();
        const { word, phonetic, definitions, etymologies, synonyms, antonyms } = body;

        // Validation
        if (!word || !definitions || !Array.isArray(definitions) || definitions.length === 0) {
            return NextResponse.json(
                { error: 'Word and at least one definition are required' },
                { status: 400 }
            );
        }

        const success = updateWord(
            wordId,
            word,
            phonetic || null,
            definitions,
            etymologies || [],
            synonyms || [],
            antonyms || []
        );

        if (success) {
            return NextResponse.json({ message: 'Word updated successfully' });
        } else {
            return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
        }

    } catch (error) {
        console.error('Update word error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
