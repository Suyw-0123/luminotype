import { pgTable, serial, text, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const languages = pgTable('languages', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
});

export const words = pgTable(
  'words',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code')
      .notNull()
      .references(() => languages.code, { onDelete: 'cascade' }),
    word: text('word').notNull(),
    frequencyRank: integer('frequency_rank').notNull(),
  },
  (t) => [
    index('words_lang_rank_idx').on(t.languageCode, t.frequencyRank),
    uniqueIndex('words_lang_word_uniq').on(t.languageCode, t.word),
  ],
);

export const quotes = pgTable(
  'quotes',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code')
      .notNull()
      .references(() => languages.code, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    source: text('source'),
    /** 'short' | 'medium' | 'long' | 'thicc' */
    lengthCategory: text('length_category').notNull(),
  },
  (t) => [index('quotes_lang_len_idx').on(t.languageCode, t.lengthCategory)],
);

export type LanguageRow = typeof languages.$inferSelect;
export type WordRow = typeof words.$inferSelect;
export type QuoteRow = typeof quotes.$inferSelect;
