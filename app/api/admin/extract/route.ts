
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
            model: 'gemini-3-flash-preview',
        });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type;
        const guideFile = formData.get('guideFile') as File | null;

        let promptText = `
            Analyze this dictionary data and extract all the words and their definitions.
            
            ${guideFile ? 'IMPORTANT: Use the provided Symbol Guide image to interpret abbreviations (e.g. "d" -> "danh từ"), symbols, and update word types/definitions accordingly.' : ''}

            OUTPUT REQUIREMENT:
            You must return a raw JSON array. Do not include markdown code blocks.
            
            SCHEMA:
            Array<Object {
                word: string,
                type: string,
                definitions: string[],
                synonyms: string[],
                antonyms: string[]
            }>

            Ignore headers and page numbers.
        `;

        const contentParts: any[] = [];
        let isTextBased = false;

        // Handle File Types
        if (mimeType === 'application/pdf') {
            contentParts.push(promptText);
            contentParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: 'application/pdf'
                }
            });
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel' ||
            mimeType === 'text/csv' ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls')
        ) {
            // Processing Spreadsheets/CSV
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            contentParts.push(promptText);
            contentParts.push(`\n\nDATA TO EXTRACT:\n${JSON.stringify(jsonData, null, 2)}`);
            isTextBased = true;
        } else {
            // Default: Assume Image
            contentParts.push(promptText);
            contentParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            });
        }

        // Handle Guide File (Only if not text based, or if user wants to use it regardless?)
        // Usually guide file is visual. If we are parsing CSV, we might not need visual guide, but user might upload one.
        // We will attach it if it exists.
        if (guideFile) {
            const guideArrayBuffer = await guideFile.arrayBuffer();
            const base64Guide = Buffer.from(guideArrayBuffer).toString('base64');
            contentParts.push({
                inlineData: {
                    data: base64Guide,
                    mimeType: guideFile.type
                }
            });
        }

        // We need to move the generation call here as prompt construction is dynamic now
        // Removing the old logic blocks below and keeping the rest.

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
