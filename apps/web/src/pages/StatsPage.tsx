import { useResultsStore } from '../store/resultsStore';

function formatDate(ts: number): string {
  // Force English regardless of the browser's locale.
  return new Date(ts).toLocaleString('en-US');
}

export function StatsPage() {
  const history = useResultsStore((s) => s.history);
  const clear = useResultsStore((s) => s.clearHistory);

  const best = history.reduce((max, r) => Math.max(max, r.wpm), 0);
  const avg = history.length > 0 ? history.reduce((sum, r) => sum + r.wpm, 0) / history.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl text-main">stats</h1>

      <div className="flex gap-10">
        <div>
          <div className="text-sm text-sub">tests</div>
          <div className="text-3xl text-main">{history.length}</div>
        </div>
        <div>
          <div className="text-sm text-sub">best wpm</div>
          <div className="text-3xl text-main">{Math.round(best)}</div>
        </div>
        <div>
          <div className="text-sm text-sub">avg wpm</div>
          <div className="text-3xl text-main">{Math.round(avg)}</div>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-sub">No tests yet. Go type something!</p>
      ) : (
        <>
          <table className="w-full text-left text-sm">
            <thead className="text-sub">
              <tr>
                <th className="py-1">wpm</th>
                <th>acc</th>
                <th>raw</th>
                <th>consistency</th>
                <th>mode</th>
                <th>date</th>
              </tr>
            </thead>
            <tbody className="text-text">
              {history.slice(0, 50).map((r) => (
                <tr key={r.timestamp} className="border-t border-sub-alt">
                  <td className="py-1 text-main">{Math.round(r.wpm)}</td>
                  <td>{Math.round(r.accuracy)}%</td>
                  <td>{Math.round(r.raw)}</td>
                  <td>{Math.round(r.consistency)}%</td>
                  <td>{r.mode}</td>
                  <td className="text-sub">{formatDate(r.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={clear}
            className="self-start rounded bg-sub-alt px-4 py-2 text-text hover:bg-error hover:text-bg"
          >
            clear history
          </button>
        </>
      )}
    </div>
  );
}
