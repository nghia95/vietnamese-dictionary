import { NextRequest, NextResponse } from 'next/server';
import { addWordWithDefinitions, getUserByEmail, findAllWordsExact, appendDefinitions, appendRelatedWords } from '@/lib/db';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to sanitize word by removing surrounding quotes and trimming whitespace
function sanitizeWord(word: string): string {
    return word.trim().replace(/^["'"']|["'"']$/g, '');
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        // TODO: Add robust admin check.
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

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } }) : null;

        const effectiveSource = sourceName && sourceName.trim() ? sourceName.trim() : 'AI Import';
        const results = [];

        for (const item of imports) {
            try {
                // Prepare definitions
                const newDefinitions: { definition: string; source: string }[] = [];
                if (item.definitions && Array.isArray(item.definitions)) {
                    item.definitions.forEach((def: string) => {
                        newDefinitions.push({
                            definition: item.type ? `(${item.type}) ${def}` : def,
                            source: effectiveSource
                        });
                    });
                } else if (item.definition) {
                    // Fallback for legacy format if any
                    newDefinitions.push({
                        definition: item.type ? `(${item.type}) ${item.definition}` : item.definition,
                        source: effectiveSource
                    });
                }

                const firstDef = newDefinitions.length > 0 ? newDefinitions[0].definition : '';

                // Sanitize word
                const sanitizedWord = sanitizeWord(item.word);

                // Find ALL existing homonyms
                const existingWords = await findAllWordsExact(sanitizedWord);

                let targetWordId: number | null = null;
                let action = 'created';

                if (existingWords.length > 0 && model) {
                    // Check semantic similarity with AI
                    const existingContexts = existingWords.map(w => ({
                        id: w.id,
                        definitions: w.definitions.map(d => d.definition).join('; ')
                    }));

                    const prompt = `
                        I am importing new definitions for the word "${sanitizedWord}".
                        New Definitions: ${JSON.stringify(newDefinitions.map(d => d.definition))}

                        Existing Word Cards for "${sanitizedWord}":
                        ${JSON.stringify(existingContexts)}

                        Task:
                        Determine if the new definitions belong to any of the existing word cards based on meaning similarity (e.g. polysemy, broader scope).
                        If it's a completely different meaning (homonym), return null.
                        If it matches an existing card's meaning scope, return that card's ID.

                        OUTPUT JSON: { "matchParams": { "id": number | null }, "reason": "string" }
                    `;

                    try {
                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        const json = JSON.parse(response.text());

                        if (json.matchParams && json.matchParams.id) {
                            targetWordId = json.matchParams.id;
                            action = 'merged';
                        }
                    } catch (e) {
                        console.error('AI Semantic Check Failed:', e);
                        // Fallback: If only 1 exists, assume merge. If multiple, default to create new or just pick first?
                        // Safer to create new if unsure, BUT default behavior before was merge to first.
                        // Let's default to merging to the first one if strict homonyms aren't common, 
                        // but user specifically asked for this check. 
                        // If AI fails, let's just merge to the first one to avoid duplicate hell.
                        targetWordId = existingWords[0].id;
                        action = 'merged (fallback)';
                    }
                } else if (existingWords.length > 0) {
                    // No AI available, fallback to first match
                    targetWordId = existingWords[0].id;
                    action = 'merged';
                }

                if (targetWordId) {
                    // Append definitions
                    if (newDefinitions.length > 0) {
                        await appendDefinitions(targetWordId, newDefinitions);
                    }

                    // Append synonyms if any
                    if (item.synonyms && item.synonyms.length > 0) {
                        await appendRelatedWords(targetWordId, item.synonyms, 'synonym');
                    }

                    // Append antonyms if any
                    if (item.antonyms && item.antonyms.length > 0) {
                        await appendRelatedWords(targetWordId, item.antonyms, 'antonym');
                    }

                    results.push({ word: sanitizedWord, status: 'success', id: targetWordId, action });
                } else {
                    // Create new word
                    const wordId = await addWordWithDefinitions(
                        sanitizedWord,
                        null, // phonetic
                        null, // image
                        newDefinitions,
                        [], // etymologies
                        item.synonyms || [],
                        item.antonyms || [], // antonyms
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
