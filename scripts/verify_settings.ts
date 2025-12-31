import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import to force env load
(async () => {
    const { updateSetting, getSetting, getAllSettings, client } = await import('../lib/db');

    console.log('🧪 Verifying Settings...');

    try {
        const testKey = 'test_key_' + Date.now();
        const testValue = 'test_value';
        // Admin ID usually 1, or fetch one. Just use 1 for test.
        // We need existing user for FK constraint?
        // Let's check users.
        const users = await client.execute('SELECT id FROM users LIMIT 1');
        const userId = (users.rows[0]?.id as number) || 1;

        console.log(`📝 Setting ${testKey} = ${testValue}`);
        await updateSetting(testKey, testValue, userId);

        const val = await getSetting(testKey);
        console.log(`🔍 Retrieved: ${val}`);

        if (val === testValue) {
            console.log('✅ Single setting verification passed');
        } else {
            console.error('❌ Mismatch');
        }

        const all = await getAllSettings();
        if (all[testKey] === testValue) {
            console.log('✅ getAllSettings verification passed');
        } else {
            console.error('❌ getAllSettings failed');
        }

        // Clean up
        await client.execute({ sql: 'DELETE FROM settings WHERE key = ?', args: [testKey] });

    } catch (err) {
        console.error('❌ Verification failed:', err);
    }
})();
