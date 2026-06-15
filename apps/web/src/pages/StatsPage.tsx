import { useState } from 'react';
import { useResultsStore } from '../store/resultsStore';

const PAGE_SIZE = 10;

function formatDate(ts: number): string {
  // Force English regardless of the browser's locale.
  return new Date(ts).toLocaleString('en-US');
}

export function StatsPage() {
  const history = useResultsStore((s) => s.history);
  const clear = useResultsStore((s) => s.clearHistory);
  const [page, setPage] = useState(0);

  const best = history.reduce((max, r) => Math.max(max, r.wpm), 0);
  const avg = history.length > 0 ? history.reduce((sum, r) => sum + r.wpm, 0) / history.length : 0;

  // History is stored most-recent-first, so page 0 is the latest ten tests.
  const pageCount = Math.ceil(history.length / PAGE_SIZE);
  // Clamp in case history shrank (e.g. after clearing) while on a later page.
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const start = currentPage * PAGE_SIZE;
  const visible = history.slice(start, start + PAGE_SIZE);

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
              {visible.map((r) => (
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

          {pageCount > 1 && (
            <div className="flex items-center gap-4 text-sm text-sub">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded bg-sub-alt px-3 py-1 text-text hover:bg-main hover:text-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-sub-alt disabled:hover:text-text"
              >
                prev
              </button>
              <span>
                {currentPage + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                className="rounded bg-sub-alt px-3 py-1 text-text hover:bg-main hover:text-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-sub-alt disabled:hover:text-text"
              >
                next
              </button>
            </div>
          )}

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
