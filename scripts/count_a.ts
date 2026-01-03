import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkCount() {
    const { client } = await import('../lib/db');
    const { getVietnameseVariations } = await import('../lib/utils');

    const variants = getVietnameseVariations('A');
    const placeholders = variants.map(() => '?').join(',');

    const query = `
    SELECT count(*) as count
    FROM words w
    WHERE substr(w.normalized_word, 1, 1) IN (${placeholders})
  `;

    const result = await client.execute({ sql: query, args: variants });
    console.log(`Count of words starting with A variants: ${result.rows[0].count}`);
}

checkCount();
