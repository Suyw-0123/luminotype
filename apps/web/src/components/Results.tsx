import type { TestResult } from '@luminotype/shared';
import { TestWpmGraph } from './TestWpmGraph';

interface ResultsProps {
  result: TestResult;
  onRestart: () => void;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-sub">{label}</span>
      <span className="text-4xl text-main">{value}</span>
      {hint && <span className="text-xs text-sub">{hint}</span>}
    </div>
  );
}

export function Results({ result, onRestart }: ResultsProps) {
  const { chars } = result;
  return (
    <div className="flex flex-col items-center gap-8" data-testid="results">
      {/* All stats on a single row; wraps only when the viewport is too narrow.
          Top-aligned so every value shares a line — the characters hint just
          hangs below it instead of shoving that value up. */}
      <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
        <Stat label="wpm" value={String(Math.round(result.wpm))} />
        <Stat label="acc" value={`${Math.round(result.accuracy)}%`} />
        <Stat label="consistency" value={`${Math.round(result.consistency)}%`} />
        <Stat
          label="characters"
          value={`${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`}
          hint="correct / incorrect / extra / missed"
        />
        <Stat label="time" value={`${Math.round(result.durationSeconds)}s`} />
      </div>
      {result.wpmSeries && result.wpmSeries.length >= 2 && (
        <div className="w-full max-w-2xl">
          <TestWpmGraph series={result.wpmSeries} />
        </div>
      )}
      <button
        onClick={onRestart}
        className="mt-28 self-center rounded bg-sub-alt px-6 py-2 text-text transition-colors hover:bg-main hover:text-bg"
      >
        next test (tab)
      </button>
    </div>
  );
}
