
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.error('❌ API Key missing in .env.local');
    process.exit(1);
}

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey!);
        // We can't list models directly with the high-level SDK easily in one line, 
        // usually we try a known model or use the REST API. 
        // But the SDK *does* have a way if we look at the error message usually? 
        // Actually the node SDK doesn't expose listModels on the main class easily in all versions.
        // Let's try `gemini-pro` which is the most standard one, or `gemini-1.0-pro`.

        // Let's try to just use 'gemini-pro' as a fallback test.
        console.log('Testing "gemini-pro" ...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hello');
        console.log('✅ gemini-pro works!');
        console.log(result.response.text());

        console.log('Testing "gemini-1.5-flash-latest" ...');
        const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result2 = await model2.generateContent('Hello');
        console.log('✅ gemini-1.5-flash-latest works!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

listModels();
