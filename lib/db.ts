import Database from 'better-sqlite3';
import path from 'path';
import { Word, Definition } from '@/types';

const dbPath = path.join(process.cwd(), 'dictionary.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if we need to migrate from old schema
  const oldSchemaCheck = db.prepare(`
    SELECT COUNT(*) as count 
    FROM pragma_table_info('words') 
    WHERE name = 'definition'
  `).get() as { count: number };

  const needsMigration = oldSchemaCheck.count > 0;

  if (needsMigration) {
    console.log('🔄 Migrating database schema to support multiple definitions...');

    // Create new definitions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'Community',
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      )
    `);

    // Migrate existing definitions to new table
    db.exec(`
      INSERT INTO definitions (word_id, definition, source, "order")
      SELECT id, definition, 'Community', 0
      FROM words
      WHERE definition IS NOT NULL AND definition != ''
    `);

    // Create new words table without definition column
    db.exec(`
      CREATE TABLE IF NOT EXISTS words_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        phonetic TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Copy data to new table
    db.exec(`
      INSERT INTO words_new (id, word, phonetic, user_id, created_at)
      SELECT id, word, phonetic, user_id, created_at
      FROM words
    `);

    // Drop old table and rename new one
    db.exec(`DROP TABLE words`);
    db.exec(`ALTER TABLE words_new RENAME TO words`);

    console.log('✅ Migration completed successfully!');
  } else {
    // Create words table (new schema)
    db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        phonetic TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create definitions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'Community',
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      )
    `);
  }

  // Create index for faster word searches
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE)
  `);

  // Create index for definitions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_definitions_word_id ON definitions(word_id)
  `);

  // Seed initial data if tables are empty
  const wordCount = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };

  if (wordCount.count === 0) {
    const seedWords = [
      {
        word: 'xin chào', phonetic: 'sin chào',
        definitions: [{ definition: 'A greeting used to say hello or hi', source: 'Common Usage' }]
      },
      {
        word: 'cảm ơn', phonetic: 'gảm ơn',
        definitions: [{ definition: 'Thank you; expression of gratitude', source: 'Common Usage' }]
      },
      {
        word: 'tạm biệt', phonetic: 'dạm biệt',
        definitions: [{ definition: 'Goodbye; farewell', source: 'Common Usage' }]
      },
      {
        word: 'đẹp', phonetic: 'đép',
        definitions: [{ definition: 'Beautiful; pretty; attractive', source: 'Common Usage' }]
      },
      {
        word: 'yêu', phonetic: 'iêu',
        definitions: [{ definition: 'To love; affection', source: 'Common Usage' }]
      },
      {
        word: 'gia đình', phonetic: 'za đình',
        definitions: [{ definition: 'Family', source: 'Common Usage' }]
      },
      {
        word: 'bạn', phonetic: 'bạn',
        definitions: [{ definition: 'Friend', source: 'Common Usage' }]
      },
      {
        word: 'sách', phonetic: 'sák',
        definitions: [{ definition: 'Book', source: 'Common Usage' }]
      },
      {
        word: 'học', phonetic: 'hók',
        definitions: [{ definition: 'To study; to learn', source: 'Common Usage' }]
      },
      {
        word: 'ăn', phonetic: 'an',
        definitions: [{ definition: 'To eat', source: 'Common Usage' }]
      },
    ];

    const insertWord = db.prepare('INSERT INTO words (word, phonetic) VALUES (?, ?)');
    const insertDefinition = db.prepare('INSERT INTO definitions (word_id, definition, source, "order") VALUES (?, ?, ?, ?)');

    const insertMany = db.transaction((words: typeof seedWords) => {
      for (const word of words) {
        const result = insertWord.run(word.word, word.phonetic);
        const wordId = result.lastInsertRowid as number;

        word.definitions.forEach((def, index) => {
          insertDefinition.run(wordId, def.definition, def.source, index);
        });
      }
    });
    insertMany(seedWords);
  }
}

// Initialize database on module load
initializeDatabase();

// Database query functions
export function searchWords(query: string): Word[] {
  const stmt = db.prepare(`
    SELECT 
      w.id,
      w.word,
      w.phonetic,
      w.user_id,
      u.name as user_name,
      w.created_at
    FROM words w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.word LIKE ? COLLATE NOCASE
    ORDER BY w.word
  `);

  const words = stmt.all(`%${query}%`) as Word[];

  // Fetch definitions for each word
  const defStmt = db.prepare(`
    SELECT id, word_id, definition, source, "order", created_at
    FROM definitions
    WHERE word_id = ?
    ORDER BY "order"
  `);

  return words.map(word => ({
    ...word,
    definitions: defStmt.all(word.id) as Definition[]
  }));
}

export function addWordWithDefinitions(
  word: string,
  phonetic: string | null,
  definitions: { definition: string; source: string }[],
  userId: number | null
) {
  const insertWord = db.prepare('INSERT INTO words (word, phonetic, user_id) VALUES (?, ?, ?)');
  const insertDefinition = db.prepare('INSERT INTO definitions (word_id, definition, source, "order") VALUES (?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    const result = insertWord.run(word, phonetic, userId);
    const wordId = result.lastInsertRowid as number;

    definitions.forEach((def, index) => {
      insertDefinition.run(wordId, def.definition, def.source, index);
    });

    return wordId;
  });

  return transaction();
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?');
  return stmt.get(email) as { id: number; email: string; password_hash: string; name: string; created_at: string } | undefined;
}

export function createUser(email: string, passwordHash: string, name: string) {
  const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
  return stmt.run(email, passwordHash, name);
}

export default db;
