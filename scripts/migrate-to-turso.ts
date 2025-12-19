import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log('🚀 Starting migration to Turso...');

    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoToken) {
        console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
        console.log('Please create a .env.local file with these variables.');
        process.exit(1);
    }

    // Clients
    const localClient = createClient({
        url: 'file:dictionary.db',
    });

    const tursoClient = createClient({
        url: tursoUrl,
        authToken: tursoToken,
    });

    try {
        // 1. Create Tables on Turso
        console.log('📦 Creating tables on Turso...');

        await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        banned_until DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        phonetic TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'Community',
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS etymologies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        etymology TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS related_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        word TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('✅ Tables created.');

        // 2. Migrate Data
        console.log('🔄 Migrating data...');

        // Users
        const users = await localClient.execute('SELECT * FROM users');
        console.log(`Found ${users.rows.length} users.`);
        for (const row of users.rows) {
            await tursoClient.execute({
                sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, role, banned_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                args: [row.id, row.email, row.password_hash, row.name, row.role, row.banned_until, row.created_at]
            });
        }

        // Words
        const words = await localClient.execute('SELECT * FROM words');
        console.log(`Found ${words.rows.length} words.`);
        for (const row of words.rows) {
            await tursoClient.execute({
                sql: 'INSERT OR IGNORE INTO words (id, word, phonetic, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
                args: [row.id, row.word, row.phonetic, row.user_id, row.created_at]
            });
        }

        // Definitions
        const definitions = await localClient.execute('SELECT * FROM definitions');
        console.log(`Found ${definitions.rows.length} definitions.`);
        for (const row of definitions.rows) {
            await tursoClient.execute({
                sql: 'INSERT OR IGNORE INTO definitions (id, word_id, definition, source, "order", created_at) VALUES (?, ?, ?, ?, ?, ?)',
                args: [row.id, row.word_id, row.definition, row.source, row.order, row.created_at]
            });
        }

        // Etymologies
        const etymologies = await localClient.execute('SELECT * FROM etymologies');
        console.log(`Found ${etymologies.rows.length} etymologies.`);
        for (const row of etymologies.rows) {
            await tursoClient.execute({
                sql: 'INSERT OR IGNORE INTO etymologies (id, word_id, etymology, created_at) VALUES (?, ?, ?, ?)',
                args: [row.id, row.word_id, row.etymology, row.created_at]
            });
        }

        // Related Words
        const relatedWords = await localClient.execute('SELECT * FROM related_words');
        console.log(`Found ${relatedWords.rows.length} related words.`);
        for (const row of relatedWords.rows) {
            await tursoClient.execute({
                sql: 'INSERT OR IGNORE INTO related_words (id, word_id, word, type, created_at) VALUES (?, ?, ?, ?, ?)',
                args: [row.id, row.word_id, row.word, row.type, row.created_at]
            });
        }

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrate();
