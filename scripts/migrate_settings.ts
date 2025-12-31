import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import to load env first
(async () => {
    const { initializeDatabase } = await import('../lib/db');

    try {
        console.log('🔄 Running database initialization/migration...');
        await initializeDatabase();
        console.log('✅ Database initialization complete (settings table should be created).');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    }
})();
