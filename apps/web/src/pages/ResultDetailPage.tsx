import { Link, useNavigate, useParams } from 'react-router-dom';
import { useResultsStore } from '../store/resultsStore';
import { TestWpmGraph } from '../components/TestWpmGraph';

function formatDate(ts: number): string {
  // Force English regardless of the browser's locale (matches StatsPage).
  return new Date(ts).toLocaleString('en-US');
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

export function ResultDetailPage() {
  const { timestamp } = useParams();
  const navigate = useNavigate();
  // Results are keyed by their (unique) completion timestamp.
  const result = useResultsStore((s) => s.history.find((r) => r.timestamp === Number(timestamp)));
  const removeResult = useResultsStore((s) => s.removeResult);

  if (!result) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl text-main">result not found</h1>
        <p className="text-sub">This test is no longer in your history.</p>
        <Link to="/stats" className="text-main hover:underline">
          ← back to stats
        </Link>
      </div>
    );
  }

  const { chars } = result;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link to="/stats" className="text-sm text-sub hover:text-main">
          ← back to stats
        </Link>
        <span className="text-sm text-sub">{formatDate(result.timestamp)}</span>
      </div>

      <div className="flex flex-col gap-8">
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
          <Stat label="mode" value={result.mode} />
          <Stat label="language" value={result.language} />
        </div>
      </div>

      {result.wpmSeries && result.wpmSeries.length >= 2 && (
        <TestWpmGraph series={result.wpmSeries} />
      )}

      <button
        onClick={() => {
          removeResult(result.timestamp);
          navigate('/stats');
        }}
        className="self-start rounded bg-sub-alt px-4 py-2 text-text hover:bg-error hover:text-bg"
      >
        delete result
      </button>
    </div>
  );
}
