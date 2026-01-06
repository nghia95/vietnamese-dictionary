
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // Handle optional guide file
        const guideFile = formData.get('guideFile') as File | null;
        let base64Guide = '';
        if (guideFile) {
            const guideArrayBuffer = await guideFile.arrayBuffer();
            base64Guide = Buffer.from(guideArrayBuffer).toString('base64');
        }

        const prompt = `
            Analyze this dictionary page image (and optional symbol guide) and extract all the words and their definitions.
            
            ${guideFile ? 'IMPORTANT: Use the provided Symbol Guide image to interpret abbreviations (e.g. "d" -> "danh từ"), symbols, and update word types/definitions accordingly.' : ''}

            OUTPUT REQUIREMENT:
            You must return a raw JSON array. Do not include markdown code blocks.
            
            SCHEMA:
            Array<Object {
                word: string, // The main word being defined
                type: string, // Part of speech (expanded from symbols if guide provided, e.g. "danh từ")
                definitions: string[], // List of definitions. Split distinct meanings (e.g. 1, 2, 3 or I, II) into separate strings. Remove the numbering/bullets.
                synonyms: string[], // List of synonyms if present
                antonyms: string[] // List of antonyms if present
            }>

            Ignore headers and page numbers.
        `;

        const contentParts: any[] = [
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ];

        if (guideFile && base64Guide) {
            contentParts.push({
                inlineData: {
                    data: base64Guide,
                    mimeType: guideFile.type
                }
            });
        }

        const result = await model.generateContent(contentParts);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present (just in case model ignores constraint)
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').replace(/```\n?/g, '').trim();

        try {
            const data = JSON.parse(cleanedText);
            return NextResponse.json({ data });
        } catch (e) {
            console.error('Failed to parse Gemini response:', text);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
        }

    } catch (error) {
        console.error('Extraction error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : String(error),
            details: error
        }, { status: 500 });
    }
}
