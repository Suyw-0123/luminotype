interface TestWpmGraphProps {
  /** Per-second instantaneous WPM samples; `series[i]` is second `i + 1`. */
  series: number[];
}

// Same geometry/theming approach as WpmChart: a fixed viewBox scaled to the
// container, colors via `currentColor` so it re-themes for free.
const W = 600;
const H = 190;
const PAD = { top: 16, right: 14, bottom: 28, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * Build a smooth SVG path through the points using a Catmull-Rom spline
 * converted to cubic Béziers, so the WPM line flows instead of zig-zagging
 * between per-second samples. Endpoints are duplicated for stable tangents.
 */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  const d = [`M ${pts[0]![0]} ${pts[0]![1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(' ');
}

/**
 * Centered rolling average over `window` seconds. Raw per-second WPM is the
 * count of chars typed in that one second × 12, which spikes hard on a single
 * fast word (a 2-3× momentary burst nobody sustains). Averaging over a few
 * seconds yields the *sustained* speed, so the peaks reflect reality instead of
 * one-second flukes. The window shrinks at the edges.
 */
function rollingAverage(series: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  return series.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(series.length - 1, i + half); j++) {
      sum += series[j]!;
      count += 1;
    }
    return Math.round(sum / count);
  });
}

/**
 * "Nice" axis ticks: round 1/2/5×10ⁿ steps covering 0..maxValue, plus the axis
 * max (rounded up to a whole step) so the data always fits under the top tick.
 */
function axisTicks(maxValue: number, targetCount: number): { ticks: number[]; max: number } {
  if (maxValue <= 0) return { ticks: [0], max: 1 };
  const rawStep = maxValue / targetCount;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const max = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(Math.round(v));
  return { ticks, max };
}

/**
 * A line chart of WPM over the course of a single test — visualizes the speed
 * variation behind the consistency score. Needs at least two samples (a test
 * lasting >= ~2 seconds); renders nothing otherwise.
 */
export function TestWpmGraph({ series }: TestWpmGraphProps) {
  if (series.length < 2) return null;

  const seconds = series.length; // series[i] is second i + 1
  // Plot sustained (rolling-average) WPM, not raw per-second spikes.
  const display = rollingAverage(series, 5);
  const { ticks: yTicks, max: top } = axisTicks(Math.max(...display), 4);
  // Time runs 1..seconds; keep only integer ticks inside that range.
  const xTicks = [...new Set(axisTicks(seconds, 6).ticks.filter((t) => t >= 1 && t <= seconds))];

  // x maps a 0-based sample index across the plot; a second s sits at index s-1.
  const x = (i: number) => PAD.left + (seconds === 1 ? PLOT_W / 2 : (i / (seconds - 1)) * PLOT_W);
  const y = (wpm: number) => PAD.top + (1 - wpm / top) * PLOT_H;

  const points = display.map((wpm, i) => ({ cx: x(i), cy: y(wpm), wpm, second: i + 1 }));
  const linePath = smoothPath(points.map((p) => [p.cx, p.cy]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="WPM during the test"
      preserveAspectRatio="none"
    >
      {/* y-axis gridlines + labels */}
      <g>
        {yTicks.map((t) => {
          const yPos = y(t);
          return (
            <g key={`y${t}`}>
              <line
                x1={PAD.left}
                y1={yPos}
                x2={PAD.left + PLOT_W}
                y2={yPos}
                className="text-sub-alt"
                stroke="currentColor"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={yPos + 4}
                textAnchor="end"
                className="text-sub"
                fill="currentColor"
                fontSize={11}
              >
                {t}
              </text>
            </g>
          );
        })}
      </g>
      {/* x-axis time ticks + labels (seconds) */}
      <g>
        {xTicks.map((t) => {
          const xPos = x(t - 1);
          return (
            <g key={`x${t}`}>
              <line
                x1={xPos}
                y1={PAD.top + PLOT_H}
                x2={xPos}
                y2={PAD.top + PLOT_H + 4}
                className="text-sub"
                stroke="currentColor"
                strokeWidth={1}
              />
              <text
                x={xPos}
                y={H - 8}
                textAnchor="middle"
                className="text-sub"
                fill="currentColor"
                fontSize={11}
              >
                {t}s
              </text>
            </g>
          );
        })}
      </g>
      <path
        d={linePath}
        fill="none"
        className="text-main"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p) => (
        <circle key={p.second} cx={p.cx} cy={p.cy} r={3} className="text-main" fill="currentColor">
          <title>
            {p.second}s · {p.wpm} wpm
          </title>
        </circle>
      ))}
    </svg>
  );
}
