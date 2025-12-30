export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchWords, addWordWithDefinitions } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('search') || '';
        const letter = searchParams.get('letter') || undefined;

        const words = await searchWords(query, letter);

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

        if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admins and moderators can add words' },
                { status: 403 }
            );
        }

        const { word, phonetic, image, definitions, etymologies, synonyms, antonyms } = await request.json();

        // Validate input
        if (!word || !definitions || !Array.isArray(definitions) || definitions.length === 0) {
            return NextResponse.json(
                { error: 'Word and at least one definition are required' },
                { status: 400 }
            );
        }

        // Validate each definition has both definition and source
        for (const def of definitions) {
            if (!def.definition || !def.source) {
                return NextResponse.json(
                    { error: 'Each definition must have both definition text and source' },
                    { status: 400 }
                );
            }
        }

        // Add word with definitions to database
        const userId = parseInt(session.user.id as string);
        await addWordWithDefinitions(
            word,
            phonetic || null,
            image || null,
            definitions,
            etymologies || [],
            synonyms || [],
            antonyms || [],
            userId
        );

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
