import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TypingArea } from '../components/TypingArea';
import { useResultsStore } from '../store/resultsStore';
import { useUiStore } from '../store/uiStore';
import type { EngineConfig } from './useTypingEngine';

// fireEvent wraps each event in a synchronous act(), so state flushes between
// keystrokes — letting the engine see the latest input on the next key.
function type(text: string) {
  for (const ch of text) {
    fireEvent.keyDown(window, { key: ch });
  }
}

const baseConfig: EngineConfig = {
  mode: 'words',
  time: 30,
  wordCount: 2,
  punctuation: false,
  numbers: false,
  language: 'english',
  // Single-word pool => deterministic target "go go".
  pool: ['go'],
};

describe('useTypingEngine (via TypingArea)', () => {
  beforeEach(() => {
    localStorage.clear();
    useResultsStore.setState({ history: [] });
  });

  it('shows results after the final word is typed in words mode', () => {
    render(<TypingArea config={baseConfig} onRequestNewTest={() => {}} />);
    expect(screen.queryByTestId('results')).toBeNull();

    type('go go'); // commits first "go" on space, auto-finishes on second.

    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('persists the completed result to the results store', () => {
    render(<TypingArea config={baseConfig} onRequestNewTest={() => {}} />);
    type('go go');

    const stored = localStorage.getItem('luminotype-results');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.history).toHaveLength(1);
    expect(parsed.state.history[0].mode).toBe('words');
  });

  it('restarts on Tab without leaving a finished state', () => {
    render(<TypingArea config={baseConfig} onRequestNewTest={() => {}} />);
    type('go go');
    expect(screen.getByTestId('results')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.queryByTestId('results')).toBeNull();
    expect(screen.getByTestId('words')).toBeInTheDocument();
  });

  it('enters focus mode while running and restores it on finish', () => {
    render(<TypingArea config={baseConfig} onRequestNewTest={() => {}} />);
    expect(useUiStore.getState().focusMode).toBe(false);

    fireEvent.keyDown(window, { key: 'g' }); // first keystroke starts the test
    expect(useUiStore.getState().focusMode).toBe(true);

    type('o go'); // complete the test
    expect(useUiStore.getState().focusMode).toBe(false);
  });
});

describe('useTypingEngine — zen mode (free typing)', () => {
  const zenConfig: EngineConfig = {
    mode: 'zen',
    time: 30,
    wordCount: 25,
    punctuation: false,
    numbers: false,
    language: 'english',
    pool: [],
  };

  beforeEach(() => {
    localStorage.clear();
    useResultsStore.setState({ history: [] });
  });

  it('does not finish until Enter is pressed', () => {
    render(<TypingArea config={zenConfig} onRequestNewTest={() => {}} />);
    type('hello world ');
    expect(screen.queryByTestId('results')).toBeNull();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('counts freely typed text as fully correct', () => {
    render(<TypingArea config={zenConfig} onRequestNewTest={() => {}} />);
    type('hello world');
    fireEvent.keyDown(window, { key: 'Enter' });

    const parsed = JSON.parse(localStorage.getItem('luminotype-results')!);
    const result = parsed.state.history[0];
    expect(result.mode).toBe('zen');
    expect(result.accuracy).toBe(100);
    expect(result.chars.incorrect).toBe(0);
  });
});

describe('useTypingEngine — quote mode', () => {
  const quoteConfig: EngineConfig = {
    mode: 'quote',
    time: 30,
    wordCount: 25,
    punctuation: false,
    numbers: false,
    language: 'english',
    pool: [],
    text: 'the cat sat',
  };

  it('requests a new quote on Tab instead of replaying the same text', () => {
    const onRequestNewTest = vi.fn();
    render(<TypingArea config={quoteConfig} onRequestNewTest={onRequestNewTest} />);

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(onRequestNewTest).toHaveBeenCalledTimes(1);
  });
});
