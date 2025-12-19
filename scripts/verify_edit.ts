import { addWordWithDefinitions, searchWords, updateWord, getWordById } from '../lib/db';

async function verify() {
    console.log('🧪 Starting Edit Feature verification...');

    const timestamp = Date.now();
    const testWord = `edit_test_${timestamp}`;

    console.log(`📝 Adding word: ${testWord}`);

    await addWordWithDefinitions(
        testWord,
        'original-phonetic',
        [{ definition: 'Original def', source: 'Original source' }],
        ['Original etymology'],
        ['orig-syn'],
        ['orig-ant'],
        null // No user ID for this test
    );

    const results = await searchWords(testWord);
    if (results.length === 0) {
        console.error('❌ Failed to add original word');
        process.exit(1);
    }
    const wordId = results[0].id;
    console.log(`✅ Word added with ID: ${wordId}`);

    console.log('✏️ Updating word...');
    const success = await updateWord(
        wordId,
        `${testWord}_updated`,
        'updated-phonetic',
        [{ definition: 'Updated def', source: 'Updated source' }],
        ['Updated etymology'],
        ['updated-syn'],
        ['updated-ant']
    );

    if (!success) {
        console.error('❌ Update function returned false');
        process.exit(1);
    }

    console.log('🔍 Verifying updates...');
    const updatedWord = await getWordById(wordId);

    if (!updatedWord) {
        console.error('❌ Failed to retrieve updated word');
        process.exit(1);
    }

    let passed = true;

    if (updatedWord.word !== `${testWord}_updated`) {
        console.error(`❌ Word mismatch. Expected ${testWord}_updated, got ${updatedWord.word}`);
        passed = false;
    }

    if (updatedWord.phonetic !== 'updated-phonetic') {
        console.error(`❌ Phonetic mismatch. Expected updated-phonetic, got ${updatedWord.phonetic}`);
        passed = false;
    }

    if (updatedWord.definitions[0].definition !== 'Updated def') {
        console.error(`❌ Definition mismatch`);
        passed = false;
    }

    if (updatedWord.etymologies[0] !== 'Updated etymology') {
        console.error(`❌ Etymology mismatch`);
        passed = false;
    }

    if (passed) {
        console.log('✅ Backend Verification Passed!');
    } else {
        console.error('❌ Backend Verification Failed');
        process.exit(1);
    }
}

verify();
