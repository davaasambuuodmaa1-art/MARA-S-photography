import { formatAUD } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "border border-ink bg-ink p-5 text-cream"
          : "border border-ink/12 bg-white/70 p-5"
      }
    >
      <p className={`text-[9px] uppercase tracking-[0.2em] ${accent ? "text-cream/50" : "text-smoke"}`}>
        {label}
      </p>
      <p className="display mt-3 text-3xl">{value}</p>
      {hint ? (
        <p className={`mt-2 text-[10px] ${accent ? "text-cream/50" : "text-smoke/70"}`}>{hint}</p>
      ) : null}
    </div>
  );
}

export function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-52 items-center justify-center border border-dashed border-ink/15 text-xs text-smoke">
        Revenue will appear here after your first verified payment.
      </div>
    );
  }
  const width = 640;
  const height = 200;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const max = Math.max(...data.map((d) => d.total), 1);
  const stepX = (width - padding.left - padding.right) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + (1 - d.total / max) * (height - padding.top - padding.bottom);
    return { x, y, ...d };
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${height - padding.bottom} L${points[0].x},${height - padding.bottom} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Verified revenue by month">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a87c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9a87c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + ratio * (height - padding.top - padding.bottom)}
            y2={padding.top + ratio * (height - padding.top - padding.bottom)}
            stroke="#0c0b09"
            strokeOpacity="0.06"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill="url(#revFill)" />
        <path d={line} fill="none" stroke="#b8935f" strokeWidth="1.8" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.month}>
            <circle cx={p.x} cy={p.y} r="3" fill="#0c0b09" />
            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="8" fill="#6f6a62" letterSpacing="1">
              {p.month.slice(5)}/{p.month.slice(2, 4)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
        <p className="text-[9px] uppercase tracking-[0.18em] text-smoke">Verified revenue · last {data.length} months</p>
        <p className="font-serif text-xl">{formatAUD(data.reduce((sum, d) => sum + d.total, 0))}</p>
      </div>
    </div>
  );
}

export function StatusBars({
  rows,
}: {
  rows: { label: string; value: number; tone: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-smoke">{row.label}</span>
            <span className="text-ink">{row.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-ink/8">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.tone }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
