import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    const { searchWords } = await import('../lib/db');

    console.log('--- Verifying Search "ăn" ---');
    const results1 = await searchWords('ăn');
    console.log(`Found ${results1.length} results.`);
    results1.forEach(w => console.log(` - ${w.word} (id: ${w.id})`));

    if (results1.length > 0) {
        console.log('✅ Search "ăn" passed (found results).');
    } else {
        console.log('⚠️ Search "ăn" found NOTHING. Check if "Ăn" exists in DB.');
    }

    console.log('\n--- Verifying Filter "A" + Search "ăn" ---');
    // Filter A should NOT include 'ă' anymore
    const results3 = await searchWords('ăn', 'A');
    console.log(`Found ${results3.length} results.`);

    if (results3.length === 0) {
        console.log('✅ Filter "A" does NOT include "Ăn" (Separation test passed).');
    } else {
        console.log('⚠️ Filter "A" includes "Ăn" (Should be separated).');
        results3.forEach(w => console.log(` - ${w.word}`));
    }

    console.log('\n--- Verifying Filter "Ă" + Search "ăn" ---');
    // Filter Ă should include 'Ăn'
    const results4 = await searchWords('ăn', 'Ă');
    console.log(`Found ${results4.length} results.`);

    if (results4.length > 0) {
        console.log('✅ Filter "Ă" includes "Ăn" (Inclusion test passed).');
    } else {
        console.log('⚠️ Filter "Ă" does NOT include "Ăn".');
    }
}

verify();
