import { useEffect, useRef } from 'react';
import { useTypingEngine, type EngineConfig } from '../engine/useTypingEngine';
import { useResultsStore } from '../store/resultsStore';
import { useUiStore } from '../store/uiStore';
import { useConfigStore } from '../store/configStore';
import { WordsDisplay } from './WordsDisplay';
import { StatBar } from './StatBar';
import { Results } from './Results';

interface TypingAreaProps {
  config: EngineConfig;
  /** Request a brand-new test (e.g. fetch a different quote) rather than replaying the same text. */
  onRequestNewTest: () => void;
}

export function TypingArea({ config, onRequestNewTest }: TypingAreaProps) {
  const engine = useTypingEngine(config);
  const addResult = useResultsStore((s) => s.addResult);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const visibleLines = useConfigStore((s) => s.visibleLines);
  const savedRef = useRef<number | null>(null);

  const isRunning = engine.status === 'running';
  // Quote mode has a single fixed text, so restarting must fetch a new quote
  // instead of replaying the same one.
  const restart = config.mode === 'quote' ? onRequestNewTest : engine.restart;

  // Capture keystrokes globally so the user can start typing immediately.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (config.mode === 'quote' && e.key === 'Tab') {
        e.preventDefault();
        onRequestNewTest();
        return;
      }
      engine.handleKeyDown(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine, config.mode, onRequestNewTest]);

  // Enter focus mode while typing; restore the surrounding UI otherwise.
  useEffect(() => {
    setFocusMode(isRunning);
  }, [isRunning, setFocusMode]);

  // Always restore the UI when leaving the typing area.
  useEffect(() => () => setFocusMode(false), [setFocusMode]);

  // Persist each completed test exactly once.
  useEffect(() => {
    if (engine.result && engine.result.timestamp !== savedRef.current) {
      savedRef.current = engine.result.timestamp;
      addResult(engine.result);
    }
  }, [engine.result, addResult]);

  if (engine.status === 'finished' && engine.result) {
    return <Results result={engine.result} onRestart={restart} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden (not removed) during focus mode so the words stay put. */}
      <div className={isRunning ? 'invisible' : undefined}>
        <StatBar
          mode={config.mode}
          status={engine.status}
          live={engine.live}
          wordIndex={engine.wordIndex}
          totalWords={engine.words.length}
        />
      </div>
      <WordsDisplay
        words={engine.words}
        typedWords={engine.typedWords}
        currentInput={engine.currentInput}
        wordIndex={engine.wordIndex}
        freeMode={config.mode === 'zen'}
        visibleLines={visibleLines}
      />
      <p className="text-center text-sm text-sub">
        {config.mode === 'zen' ? 'press enter to finish · tab to restart' : 'press tab to restart'}
      </p>
    </div>
  );
}
