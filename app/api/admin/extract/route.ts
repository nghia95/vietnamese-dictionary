
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

        const prompt = `
            Analyze this dictionary page image and extract all the words and their definitions.
            
            OUTPUT REQUIREMENT:
            You must return a raw JSON array. Do not include markdown code blocks.
            
            SCHEMA:
            Array<Object {
                word: string, // The main word being defined
                type: string, // Part of speech (e.g. "d.", "đg.") or empty
                definition: string, // Full definition text
                synonyms: string[] // List of synonyms if present
            }>

            Ignore headers and page numbers.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ]);

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
