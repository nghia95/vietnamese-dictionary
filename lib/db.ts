import Database from 'better-sqlite3';
import path from 'path';
import { Word } from '@/types';

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

    // Create words table
    db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      definition TEXT NOT NULL,
      phonetic TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    // Create index for faster word searches
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE)
  `);

    // Seed initial data if tables are empty
    const wordCount = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };

    if (wordCount.count === 0) {
        const seedWords = [
            { word: 'xin chào', definition: 'A greeting used to say hello or hi', phonetic: 'sin chào' },
            { word: 'cảm ơn', definition: 'Thank you; expression of gratitude', phonetic: 'gảm ơn' },
            { word: 'tạm biệt', definition: 'Goodbye; farewell', phonetic: 'dạm biệt' },
            { word: 'đẹp', definition: 'Beautiful; pretty; attractive', phonetic: 'đép' },
            { word: 'yêu', definition: 'To love; affection', phonetic: 'iêu' },
            { word: 'gia đình', definition: 'Family', phonetic: 'za đình' },
            { word: 'bạn', definition: 'Friend', phonetic: 'bạn' },
            { word: 'sách', definition: 'Book', phonetic: 'sák' },
            { word: 'học', definition: 'To study; to learn', phonetic: 'hók' },
            { word: 'ăn', definition: 'To eat', phonetic: 'an' },
        ];

        const insertWord = db.prepare('INSERT INTO words (word, definition, phonetic) VALUES (?, ?, ?)');
        const insertMany = db.transaction((words: typeof seedWords) => {
            for (const word of words) {
                insertWord.run(word.word, word.definition, word.phonetic);
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
      w.definition,
      w.phonetic,
      w.user_id,
      u.name as user_name,
      w.created_at
    FROM words w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.word LIKE ? COLLATE NOCASE
    ORDER BY w.word
  `);

    return stmt.all(`%${query}%`) as Word[];
}

export function addWord(word: string, definition: string, phonetic: string | null, userId: number | null) {
    const stmt = db.prepare('INSERT INTO words (word, definition, phonetic, user_id) VALUES (?, ?, ?, ?)');
    return stmt.run(word, definition, phonetic, userId);
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
