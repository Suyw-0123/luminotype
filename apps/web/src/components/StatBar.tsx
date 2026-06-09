import type { EngineStatus, LiveStats } from '../engine/useTypingEngine';
import type { TestMode } from '@luminotype/shared';

interface StatBarProps {
  mode: TestMode;
  status: EngineStatus;
  live: LiveStats;
  wordIndex: number;
  totalWords: number;
}

export function StatBar({ mode, status, live, wordIndex, totalWords }: StatBarProps) {
  if (status === 'idle') return <div className="h-8" />;

  const progress =
    mode === 'time'
      ? `${live.timer}`
      : mode === 'words' || mode === 'quote'
        ? `${wordIndex}/${totalWords}`
        : `${live.timer}`;

  return (
    <div className="flex h-8 items-center gap-6 font-mono text-xl text-main" data-testid="statbar">
      <span data-testid="progress">{progress}</span>
      <span className="text-sub">{live.wpm} wpm</span>
    </div>
  );
}
