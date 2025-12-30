
import { NextRequest, NextResponse } from 'next/server';
import { addWordWithDefinitions, getUserByEmail, findWordExact, appendDefinitions, appendRelatedWords } from '@/lib/db'; // Make sure this import matches your db implementation
import { auth } from '@/auth'; // Assuming you have auth setup

// Helper function to sanitize word by removing surrounding quotes and trimming whitespace
function sanitizeWord(word: string): string {
    return word.trim().replace(/^["'"']|["'"']$/g, '');
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        // TODO: Add robust admin check. For now, assuming authenticated user is enough or check specific email
        const userEmail = session?.user?.email;

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getUserByEmail(userEmail);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { imports, sourceName } = await request.json();

        if (!Array.isArray(imports)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const effectiveSource = sourceName && sourceName.trim() ? sourceName.trim() : 'AI Import';
        const results = [];

        for (const item of imports) {
            try {
                // Prepare data
                // item: { word, type, definition, synonyms }
                let fullDef = item.definition;
                if (item.type) {
                    fullDef = `(${item.type}) ${fullDef}`;
                }

                // Sanitize word to remove surrounding quotes
                const sanitizedWord = sanitizeWord(item.word);

                // Check if word exists
                const existingWord = await findWordExact(sanitizedWord);

                if (existingWord) {
                    // Append definition
                    await appendDefinitions(existingWord.id, [{
                        definition: fullDef,
                        source: effectiveSource
                    }]);

                    // Append synonyms if any
                    if (item.synonyms && item.synonyms.length > 0) {
                        await appendRelatedWords(existingWord.id, item.synonyms, 'synonym');
                    }

                    results.push({ word: sanitizedWord, status: 'success', id: existingWord.id, action: 'merged' });
                } else {
                    // Create new word
                    const wordId = await addWordWithDefinitions(
                        sanitizedWord,
                        null, // phonetic
                        null, // image
                        [{ definition: fullDef, source: effectiveSource }],
                        [], // etymologies
                        item.synonyms || [],
                        [], // antonyms
                        user.id
                    );
                    results.push({ word: sanitizedWord, status: 'success', id: wordId, action: 'created' });
                }

            } catch (err) {
                console.error(`Failed to import word ${item.word}:`, err);
                results.push({ word: item.word, status: 'error', error: String(err) });
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
