import { addWordWithDefinitions, searchWords } from '../lib/db';
import { toTitleCase } from '../lib/utils';

async function verifyCapitalization() {
    console.log('🧪 Starting Capitalization Verification...');

    const timestamp = Date.now();
    const inputWord = `tEsT_Word_${timestamp}`;
    const expectedWord = toTitleCase(inputWord); // Should be "Test_word_..." or similar depending on implementation

    console.log(`📝 Adding word: "${inputWord}"`);
    console.log(`🎯 Expecting:   "${expectedWord}"`);

    try {
        await addWordWithDefinitions(
            inputWord,
            'phonetic',
            null,
            [{ definition: 'Def', source: 'Source' }],
            [],
            [],
            [],
            null
        );

        const results = await searchWords(expectedWord);
        const savedWord = results.find(w => w.word.toLowerCase() === expectedWord.toLowerCase());

        if (!savedWord) {
            console.error(`❌ Failed to find word "${expectedWord}" in database.`);
            const allResults = await searchWords(inputWord);
            console.log('Found similar words:', allResults.map(w => w.word));
            process.exit(1);
        }

        if (savedWord.word === expectedWord) {
            console.log(`✅ Success! Word saved as "${savedWord.word}"`);
        } else {
            console.error(`❌ Failure! Word saved as "${savedWord.word}" but expected "${expectedWord}"`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
        process.exit(1);
    }
}

verifyCapitalization();
