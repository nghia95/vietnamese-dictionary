import { createClient, type Client } from '@libsql/client';
import { Word, Definition } from '@/types';

// Create Turso/LibSQL client
const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:dictionary.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database tables
export async function initializeDatabase() {
  // Create users table
  await client.execute(`
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

  // Create words table
  await client.execute(`
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
  await client.execute(`
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

  // Create etymologies table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS etymologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      etymology TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    )
  `);

  // Create related_words table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS related_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_definitions_word_id ON definitions(word_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_etymologies_word_id ON etymologies(word_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_related_words_word_id ON related_words(word_id)`);

  // Set admin user
  const adminEmail = 'nghiahcmut95@gmail.com';
  const adminUser = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [adminEmail]
  });
  if (adminUser.rows.length > 0) {
    await client.execute({
      sql: 'UPDATE users SET role = ? WHERE email = ?',
      args: ['admin', adminEmail]
    });
    console.log(`✅ Set ${adminEmail} as ADMIN`);
  }
}

// Database query functions
export async function searchWords(query: string): Promise<Word[]> {
  const result = await client.execute({
    sql: `
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
      LIMIT 50
    `,
    args: [`%${query}%`]
  });

  const words: Word[] = result.rows.map(row => ({
    id: row.id as number,
    word: row.word as string,
    phonetic: row.phonetic as string | null,
    user_id: row.user_id as number | null,
    user_name: row.user_name as string | null,
    created_at: row.created_at as string,
    definitions: [],
    etymologies: [],
    synonyms: [],
    antonyms: []
  }));

  if (words.length === 0) return [];

  const wordIds = words.map(w => w.id);
  const placeholders = wordIds.map(() => '?').join(',');

  // Fetch definitions
  const defResult = await client.execute({
    sql: `SELECT id, word_id, definition, source, "order", created_at FROM definitions WHERE word_id IN (${placeholders}) ORDER BY "order"`,
    args: wordIds
  });

  // Fetch etymologies
  const etymResult = await client.execute({
    sql: `SELECT word_id, etymology FROM etymologies WHERE word_id IN (${placeholders})`,
    args: wordIds
  });

  // Fetch synonyms
  const synResult = await client.execute({
    sql: `SELECT word_id, word FROM related_words WHERE word_id IN (${placeholders}) AND type = 'synonym'`,
    args: wordIds
  });

  // Fetch antonyms
  const antResult = await client.execute({
    sql: `SELECT word_id, word FROM related_words WHERE word_id IN (${placeholders}) AND type = 'antonym'`,
    args: wordIds
  });

  // Map results back to words
  const wordMap = new Map(words.map(w => [w.id, w]));

  for (const row of defResult.rows) {
    const word = wordMap.get(row.word_id as number);
    if (word) {
      word.definitions.push({
        id: row.id as number,
        word_id: row.word_id as number,
        definition: row.definition as string,
        source: row.source as string,
        order: row.order as number,
        created_at: row.created_at as string
      });
    }
  }

  for (const row of etymResult.rows) {
    const word = wordMap.get(row.word_id as number);
    if (word) {
      word.etymologies.push(row.etymology as string);
    }
  }

  for (const row of synResult.rows) {
    const word = wordMap.get(row.word_id as number);
    if (word) {
      word.synonyms.push(row.word as string);
    }
  }

  for (const row of antResult.rows) {
    const word = wordMap.get(row.word_id as number);
    if (word) {
      word.antonyms.push(row.word as string);
    }
  }

  return words;
}

export async function addWordWithDefinitions(
  word: string,
  phonetic: string | null,
  definitions: { definition: string; source: string }[],
  etymologies: string[],
  synonyms: string[],
  antonyms: string[],
  userId: number | null
): Promise<number> {
  const result = await client.execute({
    sql: 'INSERT INTO words (word, phonetic, user_id) VALUES (?, ?, ?)',
    args: [word, phonetic, userId]
  });

  const wordId = Number(result.lastInsertRowid);

  for (let i = 0; i < definitions.length; i++) {
    await client.execute({
      sql: 'INSERT INTO definitions (word_id, definition, source, "order") VALUES (?, ?, ?, ?)',
      args: [wordId, definitions[i].definition, definitions[i].source, i]
    });
  }

  for (const etymology of etymologies) {
    await client.execute({
      sql: 'INSERT INTO etymologies (word_id, etymology) VALUES (?, ?)',
      args: [wordId, etymology]
    });
  }

  for (const synonym of synonyms) {
    await client.execute({
      sql: "INSERT INTO related_words (word_id, word, type) VALUES (?, ?, 'synonym')",
      args: [wordId, synonym]
    });
  }

  for (const antonym of antonyms) {
    await client.execute({
      sql: "INSERT INTO related_words (word_id, word, type) VALUES (?, ?, 'antonym')",
      args: [wordId, antonym]
    });
  }

  return wordId;
}

export async function getWordById(id: number): Promise<Word | undefined> {
  const result = await client.execute({
    sql: `
      SELECT 
        w.id,
        w.word,
        w.phonetic,
        w.user_id,
        u.name as user_name,
        w.created_at
      FROM words w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `,
    args: [id]
  });

  if (result.rows.length === 0) return undefined;
  const row = result.rows[0];

  // Fetch definitions
  const defResult = await client.execute({
    sql: `SELECT id, word_id, definition, source, "order", created_at FROM definitions WHERE word_id = ? ORDER BY "order"`,
    args: [id]
  });

  // Fetch etymologies
  const etymResult = await client.execute({
    sql: 'SELECT etymology FROM etymologies WHERE word_id = ?',
    args: [id]
  });

  // Fetch synonyms
  const synResult = await client.execute({
    sql: "SELECT word FROM related_words WHERE word_id = ? AND type = 'synonym'",
    args: [id]
  });

  // Fetch antonyms
  const antResult = await client.execute({
    sql: "SELECT word FROM related_words WHERE word_id = ? AND type = 'antonym'",
    args: [id]
  });

  return {
    id: row.id as number,
    word: row.word as string,
    phonetic: row.phonetic as string | null,
    user_id: row.user_id as number | null,
    user_name: row.user_name as string | null,
    created_at: row.created_at as string,
    definitions: defResult.rows.map(d => ({
      id: d.id as number,
      word_id: d.word_id as number,
      definition: d.definition as string,
      source: d.source as string,
      order: d.order as number,
      created_at: d.created_at as string
    })),
    etymologies: etymResult.rows.map(e => e.etymology as string),
    synonyms: synResult.rows.map(s => s.word as string),
    antonyms: antResult.rows.map(a => a.word as string)
  };
}

export async function updateWord(
  id: number,
  word: string,
  phonetic: string | null,
  definitions: { definition: string; source: string }[],
  etymologies: string[],
  synonyms: string[],
  antonyms: string[]
): Promise<boolean> {
  await client.execute({
    sql: 'UPDATE words SET word = ?, phonetic = ? WHERE id = ?',
    args: [word, phonetic, id]
  });

  // Clear existing data
  await client.execute({ sql: 'DELETE FROM definitions WHERE word_id = ?', args: [id] });
  await client.execute({ sql: 'DELETE FROM etymologies WHERE word_id = ?', args: [id] });
  await client.execute({ sql: 'DELETE FROM related_words WHERE word_id = ?', args: [id] });

  // Insert new data
  for (let i = 0; i < definitions.length; i++) {
    await client.execute({
      sql: 'INSERT INTO definitions (word_id, definition, source, "order") VALUES (?, ?, ?, ?)',
      args: [id, definitions[i].definition, definitions[i].source, i]
    });
  }

  for (const etymology of etymologies) {
    await client.execute({
      sql: 'INSERT INTO etymologies (word_id, etymology) VALUES (?, ?)',
      args: [id, etymology]
    });
  }

  for (const synonym of synonyms) {
    await client.execute({
      sql: "INSERT INTO related_words (word_id, word, type) VALUES (?, ?, 'synonym')",
      args: [id, synonym]
    });
  }

  for (const antonym of antonyms) {
    await client.execute({
      sql: "INSERT INTO related_words (word_id, word, type) VALUES (?, ?, 'antonym')",
      args: [id, antonym]
    });
  }

  return true;
}

export async function getUserByEmail(email: string) {
  const result = await client.execute({
    sql: 'SELECT id, email, password_hash, name, role, banned_until, created_at FROM users WHERE email = ?',
    args: [email]
  });

  if (result.rows.length === 0) return undefined;
  const row = result.rows[0];

  return {
    id: row.id as number,
    email: row.email as string,
    password_hash: row.password_hash as string,
    name: row.name as string,
    role: row.role as string,
    banned_until: row.banned_until as string | null,
    created_at: row.created_at as string
  };
}

export async function getAllUsers() {
  const result = await client.execute('SELECT id, email, name, role, banned_until, created_at FROM users ORDER BY created_at DESC');

  return result.rows.map(row => ({
    id: row.id as number,
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    banned_until: row.banned_until as string | null,
    created_at: row.created_at as string
  }));
}

export async function updateUserRole(id: number, role: string) {
  return await client.execute({
    sql: 'UPDATE users SET role = ? WHERE id = ?',
    args: [role, id]
  });
}

export async function updateUserBan(id: number, bannedUntil: string | null) {
  return await client.execute({
    sql: 'UPDATE users SET banned_until = ? WHERE id = ?',
    args: [bannedUntil, id]
  });
}

export async function deleteUser(id: number) {
  return await client.execute({
    sql: 'DELETE FROM users WHERE id = ?',
    args: [id]
  });
}

export async function createUser(email: string, passwordHash: string, name: string) {
  return await client.execute({
    sql: 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    args: [email, passwordHash, name]
  });
}

export { client };
