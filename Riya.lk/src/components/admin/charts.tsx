"use client";

/**
 * Dashboard charts (Recharts), styled to the data-viz spec:
 * 2px lines with a 10% area wash, ≤24px bars with 4px rounded data-ends,
 * hairline solid gridlines, text in ink tokens (never the series colour),
 * crosshair/per-mark tooltips, and a table view under every chart.
 * Colours come from the `.viz` CSS variables in globals.css.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS_TICK = { fill: "var(--viz-muted)", fontSize: 12 };

function formatDay(day: string, withWeekday = false) {
  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
    ...(withWeekday ? { weekday: "short" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** Tooltip: the value leads (strong), the label follows; series keyed by a short line. */
function ChartTooltip({
  active,
  payload,
  label,
  seriesName,
  formatLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: unknown;
  seriesName: string;
  formatLabel?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]!.value ?? 0);
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      <p className="mt-1 flex items-center gap-2">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: "var(--series-1)" }} aria-hidden />
        <span className="text-base font-semibold text-foreground">{value.toLocaleString("en-LK")}</span>
        <span className="text-xs text-muted-foreground">{seriesName}</span>
      </p>
    </div>
  );
}

function TableView({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, string | number][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">View as table</summary>
      <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border">
        <table className="w-full">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold">{head[0]}</th>
              <th className="px-3 py-2 text-right text-xs font-semibold">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-border">
                <td className="px-3 py-1.5">{k}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{typeof v === "number" ? v.toLocaleString("en-LK") : v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Single-series trend over time (area line). One series → no legend; the card title names it. */
export function TrendChart({ data, seriesName }: { data: { day: string; count: number }[]; seriesName: string }) {
  return (
    <div className="viz">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
            <XAxis
              dataKey="day"
              tickFormatter={(d: string) => formatDay(d)}
              tickLine={false}
              axisLine={{ stroke: "var(--viz-axis)" }}
              tick={AXIS_TICK}
              minTickGap={28}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} width={44} />
            <Tooltip
              cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
              content={({ active, payload, label }) => (
                <ChartTooltip active={active} payload={payload} label={label} seriesName={seriesName} formatLabel={(l) => formatDay(l, true)} />
              )}
            />
            <Area
              type="monotone"
              dataKey="count"
              name={seriesName}
              stroke="var(--series-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="var(--series-1)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4, fill: "var(--series-1)", stroke: "var(--viz-surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TableView caption={seriesName} head={["Day", seriesName]} rows={data.map((d) => [formatDay(d.day, true), d.count])} />
    </div>
  );
}

/** Magnitude by category — one hue for every bar (categories are nominal, not ranked by colour). */
export function CategoryBarChart({ data, seriesName }: { data: { name: string; count: number }[]; seriesName: string }) {
  return (
    <div className="viz">
      <div style={{ height: data.length * 32 + 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap={6}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={124}
              tickLine={false}
              axisLine={{ stroke: "var(--viz-axis)" }}
              tick={{ ...AXIS_TICK, fill: "var(--foreground)" }}
            />
            <Tooltip cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.6 }} content={({ active, payload, label }) => <ChartTooltip active={active} payload={payload} label={label} seriesName={seriesName} />} />
            <Bar dataKey="count" name={seriesName} fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={20} activeBar={{ fillOpacity: 0.8 }}>
              <LabelList dataKey="count" position="right" offset={8} fill="var(--viz-muted)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView caption={seriesName} head={["Category", seriesName]} rows={data.map((d) => [d.name, d.count])} />
    </div>
  );
}

/**
 * Part-to-whole of ad statuses as one stacked bar (2px surface gaps between
 * segments) plus a legend that carries every count and share as text.
 * Segment order = palette slot order (validated as adjacent pairs).
 */
export function StatusBreakdown({ segments }: { segments: { label: string; count: number }[] }) {
  const total = segments.reduce((n, s) => n + s.count, 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const visible = segments.map((s, i) => ({ ...s, color: `var(--series-${i + 1})` })).filter((s) => s.count > 0);

  return (
    <div className="viz">
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-[4px] bg-muted" role="img" aria-label="Ads by status">
        {visible.map((s) => (
          <div
            key={s.label}
            tabIndex={0}
            className="group relative h-full outline-none first:rounded-l-[4px] last:rounded-r-[4px] hover:brightness-110 focus-visible:brightness-110"
            style={{ flexGrow: s.count, flexBasis: 0, background: s.color, minWidth: 4 }}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg group-hover:block group-focus-visible:block">
              <strong className="text-sm text-foreground">{s.count.toLocaleString("en-LK")}</strong>{" "}
              <span className="text-muted-foreground">
                {s.label} · {pct(s.count)}%
              </span>
            </span>
          </div>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-start gap-2">
            <span className="mt-1 size-3 shrink-0 rounded-[3px]" style={{ background: `var(--series-${i + 1})` }} aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-semibold text-foreground">
                {s.count.toLocaleString("en-LK")} <span className="text-xs font-normal text-muted-foreground">({pct(s.count)}%)</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
