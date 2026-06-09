import type { TestResult } from '@luminotype/shared';

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
    <div className="flex flex-col gap-8" data-testid="results">
      <div className="flex flex-wrap items-end gap-10">
        <Stat label="wpm" value={String(Math.round(result.wpm))} />
        <Stat label="acc" value={`${Math.round(result.accuracy)}%`} />
      </div>
      <div className="flex flex-wrap gap-8 text-text">
        <Stat label="raw" value={String(Math.round(result.raw))} />
        <Stat label="consistency" value={`${Math.round(result.consistency)}%`} />
        <Stat
          label="characters"
          value={`${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`}
          hint="correct / incorrect / extra / missed"
        />
        <Stat label="time" value={`${Math.round(result.durationSeconds)}s`} />
      </div>
      <button
        onClick={onRestart}
        className="self-start rounded bg-sub-alt px-6 py-2 text-text transition-colors hover:bg-main hover:text-bg"
      >
        next test (tab)
      </button>
    </div>
  );
}
