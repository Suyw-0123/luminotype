import { useCallback, useEffect, useRef, useState } from 'react';
import type { TestMode, TestResult } from '@luminotype/shared';
import { generateWords } from './wordGenerator';
import { calculateAccuracy, calculateConsistency, calculateWpm, gradeChars } from './stats';

export type EngineStatus = 'idle' | 'running' | 'finished';

export interface EngineConfig {
  mode: TestMode;
  time: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  language: string;
  /** Word pool for time/words modes. */
  pool: string[];
  /** Full text for quote mode. */
  text?: string;
}

export interface LiveStats {
  wpm: number;
  /** Elapsed seconds for words/quote modes; remaining seconds for time mode. */
  timer: number;
}

export interface TypingEngine {
  status: EngineStatus;
  words: string[];
  typedWords: string[];
  currentInput: string;
  wordIndex: number;
  live: LiveStats;
  result: TestResult | null;
  handleKeyDown: (e: KeyboardEvent | React.KeyboardEvent) => void;
  restart: () => void;
}

const INITIAL_TIME_WORDS = 60;
const TIME_WORDS_BATCH = 24;
const TIME_WORDS_REFILL_THRESHOLD = 12;
const TICK_MS = 200;

function buildWords(config: EngineConfig): string[] {
  const opts = { punctuation: config.punctuation, numbers: config.numbers };
  switch (config.mode) {
    case 'time':
      return generateWords(config.pool, INITIAL_TIME_WORDS, opts);
    case 'words':
      return generateWords(config.pool, config.wordCount, opts);
    case 'quote':
      return (config.text ?? '').trim().split(/\s+/).filter(Boolean);
    case 'zen':
      // Zen is free typing: no preset target text.
      return [];
  }
}

/**
 * Grade the current state into character counts. In zen mode there is no target,
 * so everything the user typed is treated as correct.
 */
function gradeFor(
  s: { words: string[]; typedWords: string[]; currentInput: string },
  mode: TestMode,
) {
  if (mode === 'zen') {
    return gradeChars({
      words: [...s.typedWords, s.currentInput],
      typedWords: s.typedWords,
      activeInput: s.currentInput,
    });
  }
  return gradeChars({ words: s.words, typedWords: s.typedWords, activeInput: s.currentInput });
}

export function useTypingEngine(config: EngineConfig): TypingEngine {
  const [words, setWords] = useState<string[]>(() => buildWords(config));
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [result, setResult] = useState<TestResult | null>(null);
  const [live, setLive] = useState<LiveStats>({ wpm: 0, timer: 0 });

  // Refs the interval/finish read so their closures see the latest state.
  const stateRef = useRef({ words, typedWords, currentInput, status });
  stateRef.current = { words, typedWords, currentInput, status };

  const configRef = useRef(config);
  configRef.current = config;

  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<number[]>([]);
  const lastSecondRef = useRef(0);
  const lastCorrectRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stopTimer();
    const cfg = configRef.current;
    const s = stateRef.current;
    const elapsedMs = performance.now() - (startRef.current ?? performance.now());
    const counts = gradeFor(s, cfg.mode);
    const keystrokes = counts.correct + counts.incorrect + counts.extra;
    const round2 = (n: number) => Math.round(n * 100) / 100;

    setResult({
      wpm: round2(calculateWpm(counts.correct, elapsedMs)),
      raw: round2(calculateWpm(keystrokes, elapsedMs)),
      accuracy: round2(calculateAccuracy(counts.correct, keystrokes)),
      consistency: round2(calculateConsistency(samplesRef.current)),
      chars: counts,
      wpmSeries: [...samplesRef.current],
      durationSeconds: round2(elapsedMs / 1000),
      mode: cfg.mode,
      language: cfg.language,
      timestamp: Date.now(),
    });
    setStatus('finished');
  }, [stopTimer]);

  const tick = useCallback(() => {
    const cfg = configRef.current;
    const s = stateRef.current;
    const now = performance.now();
    const elapsedMs = now - (startRef.current ?? now);
    const counts = gradeFor(s, cfg.mode);

    const liveWpm = Math.round(calculateWpm(counts.correct, elapsedMs));
    const elapsedSec = elapsedMs / 1000;
    const timer = cfg.mode === 'time' ? Math.max(0, cfg.time - elapsedSec) : elapsedSec;
    setLive({ wpm: liveWpm, timer: Math.round(timer) });

    // Sample per-second WPM for the consistency stat.
    const whole = Math.floor(elapsedSec);
    if (whole > lastSecondRef.current) {
      const delta = counts.correct - lastCorrectRef.current;
      lastCorrectRef.current = counts.correct;
      samplesRef.current.push(Math.max(0, delta) * 12);
      lastSecondRef.current = whole;
    }

    if (cfg.mode === 'time' && elapsedMs >= cfg.time * 1000) {
      finish();
    }
  }, [finish]);

  const start = useCallback(() => {
    startRef.current = performance.now();
    samplesRef.current = [];
    lastSecondRef.current = 0;
    lastCorrectRef.current = 0;
    setStatus('running');
    stopTimer();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick, stopTimer]);

  const restart = useCallback(() => {
    stopTimer();
    startRef.current = null;
    samplesRef.current = [];
    lastSecondRef.current = 0;
    lastCorrectRef.current = 0;
    setWords(buildWords(configRef.current));
    setTypedWords([]);
    setCurrentInput('');
    setResult(null);
    setLive({ wpm: 0, timer: configRef.current.mode === 'time' ? configRef.current.time : 0 });
    setStatus('idle');
  }, [stopTimer]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      const s = stateRef.current;
      const cfg = configRef.current;

      // Tab restarts the test.
      if (e.key === 'Tab') {
        e.preventDefault();
        restart();
        return;
      }

      if (s.status === 'finished') return;

      // Enter finishes a running zen test.
      if (e.key === 'Enter') {
        if (cfg.mode === 'zen' && s.status === 'running') {
          e.preventDefault();
          finish();
        }
        return;
      }

      const key = e.key;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Backspace: delete a char, a word (ctrl), or step back to a wrong word.
      if (key === 'Backspace') {
        e.preventDefault();
        if (s.status === 'idle') return;
        if (s.currentInput.length > 0) {
          setCurrentInput(ctrlOrMeta ? '' : s.currentInput.slice(0, -1));
        } else if (s.typedWords.length > 0) {
          const prevIndex = s.typedWords.length - 1;
          const prevTyped = s.typedWords[prevIndex]!;
          const prevTarget = s.words[prevIndex]!;
          if (prevTyped !== prevTarget) {
            setTypedWords(s.typedWords.slice(0, prevIndex));
            setCurrentInput(prevTyped);
          }
        }
        return;
      }

      // Ignore non-character keys and shortcut combos.
      if (key.length !== 1 || (ctrlOrMeta && key !== ' ')) return;

      if (s.status === 'idle') start();

      // Space commits the current word.
      if (key === ' ') {
        e.preventDefault();
        if (s.currentInput.length === 0) return;
        const committed = [...s.typedWords, s.currentInput];
        setTypedWords(committed);
        setCurrentInput('');

        if (cfg.mode === 'time') {
          // Keep the buffer topped up so typing never runs out.
          if (s.words.length - committed.length <= TIME_WORDS_REFILL_THRESHOLD) {
            setWords([
              ...s.words,
              ...generateWords(cfg.pool, TIME_WORDS_BATCH, {
                punctuation: cfg.punctuation,
                numbers: cfg.numbers,
              }),
            ]);
          }
        } else if (cfg.mode === 'words' || cfg.mode === 'quote') {
          if (committed.length >= s.words.length) finish();
        }
        // zen: free typing — just commit and keep going until Enter.
        return;
      }

      // Printable character.
      const nextInput = s.currentInput + key;
      setCurrentInput(nextInput);

      // Auto-finish finite modes when the final word is typed exactly.
      if (cfg.mode === 'words' || cfg.mode === 'quote') {
        const isLastWord = s.typedWords.length === s.words.length - 1;
        if (isLastWord && nextInput === s.words[s.words.length - 1]) {
          setTypedWords([...s.typedWords, nextInput]);
          setCurrentInput('');
          finish();
        }
      }
    },
    [restart, start, finish],
  );

  // Rebuild when the mode/parameters change.
  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.mode,
    config.time,
    config.wordCount,
    config.language,
    config.punctuation,
    config.numbers,
    config.text,
  ]);

  // Cleanup on unmount.
  useEffect(() => stopTimer, [stopTimer]);

  return {
    status,
    words,
    typedWords,
    currentInput,
    wordIndex: typedWords.length,
    live,
    result,
    handleKeyDown,
    restart,
  };
}
