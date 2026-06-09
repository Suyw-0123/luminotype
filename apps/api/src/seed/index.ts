import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, queryClient } from '../db/client.js';
import { languages, words, quotes } from '../db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');

interface LanguageSeed {
  code: string;
  name: string;
}
interface QuoteSeed {
  text: string;
  source: string | null;
  length: string;
}

async function readJson<T>(file: string): Promise<T> {
  const raw = await readFile(join(dataDir, file), 'utf-8');
  return JSON.parse(raw) as T;
}

/** Word source file per language code. */
const WORD_SOURCES: Record<string, string> = {
  english: 'english.json',
};

async function seed() {
  const langs = await readJson<LanguageSeed[]>('languages.json');

  for (const lang of langs) {
    await db.insert(languages).values(lang).onConflictDoNothing();
  }
  console.log(`Seeded ${langs.length} languages.`);

  // Words — replace per language to keep the seed idempotent.
  for (const lang of langs) {
    const file = WORD_SOURCES[lang.code];
    if (!file) continue;
    const list = await readJson<string[]>(file);
    await db.delete(words).where(eq(words.languageCode, lang.code));
    if (list.length > 0) {
      await db.insert(words).values(
        list.map((word, i) => ({
          languageCode: lang.code,
          word,
          frequencyRank: i + 1,
        })),
      );
    }
    console.log(`Seeded ${list.length} words for "${lang.code}".`);
  }

  // Drop any languages no longer in the seed (e.g. a removed english_1k),
  // clearing their words first to satisfy the foreign key.
  const seedCodes = new Set(langs.map((l) => l.code));
  const existing = await db.select({ code: languages.code }).from(languages);
  for (const { code } of existing) {
    if (seedCodes.has(code)) continue;
    await db.delete(words).where(eq(words.languageCode, code));
    await db.delete(languages).where(eq(languages.code, code));
    console.log(`Removed stale language "${code}".`);
  }

  // Quotes — currently english only.
  const englishQuotes = await readJson<QuoteSeed[]>('quotes.english.json');
  await db.delete(quotes).where(eq(quotes.languageCode, 'english'));
  await db.insert(quotes).values(
    englishQuotes.map((q) => ({
      languageCode: 'english',
      text: q.text,
      source: q.source,
      lengthCategory: q.length,
    })),
  );
  console.log(`Seeded ${englishQuotes.length} quotes for "english".`);
}

seed()
  .then(async () => {
    console.log('Seed complete.');
    await queryClient.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await queryClient.end();
    process.exit(1);
  });
