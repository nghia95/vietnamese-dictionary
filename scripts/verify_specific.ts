import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Dynamic import to ensure DB connects after dotenv
(async () => {
    const { searchWords } = await import('../lib/db');

    console.log('🔍 key word verification...');
    const results = await searchWords('A-xen');

    const word = results.find(w => w.word === 'A-xen');
    if (word) {
        console.log(`✅ Found word: "${word.word}"`);
    } else {
        console.error('❌ "A-xen" not found or incorrect.');
        const all = await searchWords('a-xen');
        console.log('Found:', all.map(w => w.word));
    }
})();
