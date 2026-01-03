import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
    const { searchWords } = await import('../lib/db');

    console.log('\n--- Checking Word "Á đông" in Filter A ---');
    // This calls the ACTUAL searchWords function with letter 'A'
    const words = await searchWords('', 'A');
    console.log(`Matched ${words.length} words for filter 'A'`);

    const found = words.find(w => w.word === 'Á đông');

    if (found) {
        console.log('✅ Found "Á đông" in filter results! (ID: ' + found.id + ')');
    } else {
        console.log('❌ "Á đông" NOT found in filter results. (Count: ' + words.length + ')');
        if (words.length >= 50 && words.length < 1000) {
            console.log('⚠️ Count is ' + words.length + ', limit might be influencing?');
        }
    }
}

check();
