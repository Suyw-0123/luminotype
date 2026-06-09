import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestMode, TimeOption, WordCountOption, QuoteLength } from '@luminotype/shared';
import { DEFAULT_THEME_ID } from '../themes/themes';

interface ConfigState {
  mode: TestMode;
  time: TimeOption;
  wordCount: WordCountOption;
  quoteLength: QuoteLength;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  theme: string;
  visibleLines: number;

  setMode: (mode: TestMode) => void;
  setTime: (time: TimeOption) => void;
  setWordCount: (count: WordCountOption) => void;
  setQuoteLength: (length: QuoteLength) => void;
  setLanguage: (language: string) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  setTheme: (theme: string) => void;
  setVisibleLines: (lines: number) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      mode: 'quote',
      time: 30,
      wordCount: 25,
      quoteLength: 'medium',
      language: 'english',
      punctuation: false,
      numbers: false,
      theme: DEFAULT_THEME_ID,
      visibleLines: 3,

      setMode: (mode) => set({ mode }),
      setTime: (time) => set({ time }),
      setWordCount: (wordCount) => set({ wordCount }),
      setQuoteLength: (quoteLength) => set({ quoteLength }),
      setLanguage: (language) => set({ language }),
      togglePunctuation: () => set((s) => ({ punctuation: !s.punctuation })),
      toggleNumbers: () => set((s) => ({ numbers: !s.numbers })),
      setTheme: (theme) => set({ theme }),
      setVisibleLines: (visibleLines) => set({ visibleLines }),
    }),
    { name: 'luminotype-config' },
  ),
);
