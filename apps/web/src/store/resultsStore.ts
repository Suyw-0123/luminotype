import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestResult } from '@luminotype/shared';

const MAX_HISTORY = 200;

interface ResultsState {
  history: TestResult[];
  addResult: (result: TestResult) => void;
  /** Remove a single result, identified by its (unique) timestamp. */
  removeResult: (timestamp: number) => void;
  clearHistory: () => void;
}

export const useResultsStore = create<ResultsState>()(
  persist(
    (set) => ({
      history: [],
      addResult: (result) =>
        set((s) => ({ history: [result, ...s.history].slice(0, MAX_HISTORY) })),
      removeResult: (timestamp) =>
        set((s) => ({ history: s.history.filter((r) => r.timestamp !== timestamp) })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: 'luminotype-results' },
  ),
);
