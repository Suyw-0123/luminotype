import { create } from 'zustand';

/**
 * Transient UI state (not persisted). `focusMode` is on while a test is actively
 * running, so surrounding chrome (header, footer, config bar, stat bar) can hide
 * and leave only the words on screen.
 */
interface UiState {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  focusMode: false,
  setFocusMode: (focusMode) => set({ focusMode }),
}));
