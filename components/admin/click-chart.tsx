import type { AnalyticsSeriesPoint } from '@/lib/db/repositories/redirects';

type ClickChartProps = {
  data: AnalyticsSeriesPoint[];
  /** Short label for the empty state. */
  label?: string;
};

const W = 720;
const H = 200;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;

/**
 * Server-rendered SVG line chart for daily click counts. Pure presentational —
 * no client JS, no chart library.
 */
export function ClickChart({ data, label = 'clicks' }: ClickChartProps) {
  const max = Math.max(1, ...data.map((p) => p.count));
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  if (data.length === 0 || max === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No {label} in this range.
      </div>
    );
  }

  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const xy = (i: number, count: number) => ({
    x: PAD_L + i * step,
    y: PAD_T + innerH - (count / max) * innerH,
  });

  const path = data
    .map((p, i) => {
      const { x, y } = xy(i, p.count);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Closed area path for a subtle fill under the line.
  const last = xy(data.length - 1, data[data.length - 1].count);
  const first = xy(0, data[0].count);
  const area = `${path} L${last.x.toFixed(1)},${PAD_T + innerH} L${first.x.toFixed(1)},${PAD_T + innerH} Z`;

  const gridYs = [0.25, 0.5, 0.75, 1].map(
    (f) => PAD_T + innerH - f * innerH
  );

  // Label ~4 ticks along the X axis.
  const tickCount = Math.min(4, data.length);
  const tickIdx = new Set<number>();
  for (let t = 0; t < tickCount; t++) {
    tickIdx.add(Math.round((t * (data.length - 1)) / (tickCount - 1)));
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Daily ${label} chart`}
        className="min-w-full"
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y) => (
          <line
            key={y}
            x1={PAD_L}
            y1={y}
            x2={W - PAD_R}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        <path d={area} fill="url(#chartFill)" />
        <path
          d={path}
          fill="none"
          stroke="#0d9488"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((p, i) => {
          if (!tickIdx.has(i)) return null;
          const { x } = xy(i, p.count);
          return (
            <g key={`${p.day}-${i}`}>
              <circle
                cx={x}
                cy={xy(i, p.count).y}
                r={p.count > 0 ? 2.5 : 0}
                fill="#0d9488"
              />
              <text
                x={x}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {p.day.slice(5)}
              </text>
            </g>
          );
        })}

        <text x={PAD_L} y={PAD_T - 4} fontSize="10" fill="#64748b">
          max {max}
        </text>
      </svg>
    </div>
  );
}