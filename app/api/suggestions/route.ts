import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        if (!query.trim()) {
            return NextResponse.json({ suggestions: [] });
        }

        // Get word suggestions from database
        const db = await import('@/lib/db');
        const wordSuggestions = await db.getWordSuggestions(query.toLowerCase(), 5);

        // Get user's search history if logged in
        let historySuggestions: string[] = [];
        if (session?.user?.email) {
            const user = await db.getUserByEmail(session.user.email);
            if (user) {
                const history = await getHistory(user.id, 'SEARCH');
                // Extract unique queries that start with the search query
                historySuggestions = Array.from(new Set(
                    history
                        .filter(h => h.query && h.query.toLowerCase().startsWith(query.toLowerCase()))
                        .map(h => h.query!)
                )).slice(0, 3);
            }
        }

        // Combine suggestions (history first, then words, remove duplicates)
        const allSuggestions = [
            ...historySuggestions,
            ...wordSuggestions.filter(w => !historySuggestions.includes(w))
        ].slice(0, 5);

        return NextResponse.json({ suggestions: allSuggestions });
    } catch (error) {
        console.error('Suggestions error:', error);
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}
