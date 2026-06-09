import type { Language, WordListResponse, QuoteResponse, QuoteLength } from '@luminotype/shared';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchLanguages(): Promise<Language[]> {
  return getJson<Language[]>('/languages');
}

const wordCache = new Map<string, string[]>();

export async function fetchWords(language: string, limit = 1000): Promise<string[]> {
  const key = `${language}:${limit}`;
  const cached = wordCache.get(key);
  if (cached) return cached;
  const data = await getJson<WordListResponse>(
    `/languages/${encodeURIComponent(language)}/words?limit=${limit}`,
  );
  wordCache.set(key, data.words);
  return data.words;
}

export async function fetchQuote(language: string, length?: QuoteLength) {
  const params = new URLSearchParams({ lang: language });
  if (length) params.set('length', length);
  const data = await getJson<QuoteResponse>(`/quotes?${params.toString()}`);
  return data.quote;
}
