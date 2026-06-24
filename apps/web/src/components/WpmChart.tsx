import type { TestResult } from '@luminotype/shared';

interface WpmChartProps {
  /** Results in chronological order (oldest first). */
  results: TestResult[];
  /** Called when a data point is clicked, with that result's timestamp. */
  onPointClick?: (timestamp: number) => void;
}

// A fixed viewBox keeps the maths simple; the SVG scales to its container via
// width=100%. Colors come from the active theme through `currentColor`, so the
// chart re-themes for free (see Theming in frontend.md).
const W = 600;
const H = 200;
const PAD = { top: 16, right: 12, bottom: 24, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * A minimal WPM-over-time line chart. Renders nothing for an empty history and
 * a single dot for one result. Built as raw SVG to avoid a charting dependency.
 */
export function WpmChart({ results, onPointClick }: WpmChartProps) {
  if (results.length === 0) return null;

  const wpms = results.map((r) => r.wpm);
  const maxWpm = Math.max(...wpms);
  const minWpm = Math.min(...wpms);
  // Pad the range a touch so the line never hugs the top/bottom edge; guard the
  // single-value case (all equal) so we don't divide by zero.
  const span = maxWpm - minWpm || 1;
  const top = maxWpm + span * 0.1;
  const bottom = Math.max(0, minWpm - span * 0.1);
  const range = top - bottom || 1;

  const x = (i: number) =>
    PAD.left + (results.length === 1 ? PLOT_W / 2 : (i / (results.length - 1)) * PLOT_W);
  const y = (wpm: number) => PAD.top + (1 - (wpm - bottom) / range) * PLOT_H;

  const points = results.map((r, i) => ({ cx: x(i), cy: y(r.wpm), result: r }));
  const linePath = points.map((p) => `${p.cx},${p.cy}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="WPM over time"
      preserveAspectRatio="none"
    >
      {/* y-axis bounds */}
      <g className="text-sub" fill="currentColor" fontSize={11}>
        <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end">
          {Math.round(top)}
        </text>
        <text x={PAD.left - 6} y={PAD.top + PLOT_H + 4} textAnchor="end">
          {Math.round(bottom)}
        </text>
      </g>
      {/* baseline + top gridline */}
      <g className="text-sub-alt" stroke="currentColor" strokeWidth={1}>
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left + PLOT_W} y2={PAD.top} />
        <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} />
      </g>
      {results.length > 1 && (
        <polyline
          points={linePath}
          fill="none"
          className="text-main"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {points.map((p) => (
        <circle
          key={p.result.timestamp}
          cx={p.cx}
          cy={p.cy}
          r={4}
          className="cursor-pointer text-main"
          fill="currentColor"
          onClick={() => onPointClick?.(p.result.timestamp)}
        >
          <title>
            {Math.round(p.result.wpm)} wpm · {Math.round(p.result.accuracy)}% acc
          </title>
        </circle>
      ))}
    </svg>
  );
}
