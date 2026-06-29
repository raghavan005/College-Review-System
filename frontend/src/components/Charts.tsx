import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar,
  LineChart, Line,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────

export interface BarDatum  { name: string; value: number; }
export interface TimeDatum { month: string; reviews: number; }
export interface CollegeRatingDatum { name: string; avgRating: number; reviews: number; }
export interface RoleDatum  { name: string; value: number; fill: string; }
export interface TrendDatum { month: string; rating: number; }

// ── Palette ───────────────────────────────────────────────────────────────

export const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 71% 45%)',
  'hsl(38 92% 50%)',
  'hsl(199 89% 48%)',
  'hsl(var(--destructive))',
];

// ── Shared custom tooltip — dark bg, white text ───────────────────────────

interface TooltipPayload { name: string; value: number | string; color?: string; }

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatValue?: (v: number | string, entry: TooltipPayload) => string;
}

function CustomTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl text-white text-xs">
      {label && <p className="font-semibold mb-1.5 text-white/70 text-[11px] uppercase tracking-wide">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color ?? PIE_COLORS[0] }} />
          <span className="text-white/80">{entry.name}:</span>
          <span className="font-semibold text-white ml-auto pl-3">
            {formatValue ? formatValue(entry.value, entry) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Shared axis / grid styles ─────────────────────────────────────────────

// Hard-coded bright tick color — visible on any dark background
const TICK_FILL = 'rgb(203, 213, 225)'; // slate-300

// Custom tick renderers give full control over SVG text fill
function XTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={(y ?? 0) + 12} textAnchor="middle" fill={TICK_FILL} fontSize={11}>
      {payload?.value}
    </text>
  );
}

function YTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string | number } }) {
  return (
    <text x={(x ?? 0) - 4} y={(y ?? 0) + 4} textAnchor="end" fill={TICK_FILL} fontSize={11}>
      {payload?.value}
    </text>
  );
}

const axisProps = {
  stroke: 'transparent',
  tickLine: false as const,
  axisLine: false as const,
};

// For horizontal bar charts the category axis is YAxis, so use XTick for value axis
const xAxisProps = { ...axisProps, tick: XTick as any };
const yAxisProps = { ...axisProps, tick: YTick as any };

const gridProps = {
  strokeDasharray: '3 3' as const,
  stroke: 'rgba(255,255,255,0.1)',
};

// Cursor styles
const lineCursor     = { stroke: 'rgba(203,213,225,0.45)', strokeWidth: 1.5, strokeDasharray: '4 4' };
const barCursorLight = { fill: 'rgba(203,213,225,0.08)' };

// ── Fallback ──────────────────────────────────────────────────────────────

function NoData({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
      No data yet — run <code className="font-mono text-xs bg-muted px-1 mx-1 rounded">npm run seed</code>
    </div>
  );
}

// ── 1. Rating Distribution — Horizontal Bar ───────────────────────────────

export const RatingDistributionChart = ({ data }: { data?: BarDatum[] }) => {
  const chartData = (data ?? []).map((d, i) => ({ ...d, fill: PIE_COLORS[i] ?? PIE_COLORS[0] }));
  if (!chartData.length || chartData.every((d) => d.value === 0)) return <NoData height={220} />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid {...gridProps} horizontal={false} />
        <XAxis type="number" {...xAxisProps} />
        <YAxis type="category" dataKey="name" width={52} {...yAxisProps} />
        <Tooltip content={<CustomTooltip />} cursor={barCursorLight} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── 2. Rating Distribution — Donut Pie ───────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }:
  { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {name.split(' ')[0]}
    </text>
  );
}

export const RatingPieChart = ({ data }: { data?: BarDatum[] }) => {
  const chartData = (data ?? []).filter((d) => d.value > 0);
  if (!chartData.length) return <NoData height={260} />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={PieLabel as any}
        >
          {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val: string) => (
            <span style={{ fontSize: 12, color: 'rgb(203, 213, 225)' }}>{val}</span>
          )}
        />
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ── 3. Reviews Over Time — Area ───────────────────────────────────────────

export const ReviewsOverTimeChart = ({ data }: { data?: TimeDatum[] }) => {
  if (!data?.length) return <NoData height={300} />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis dataKey="month" {...xAxisProps} />
        <YAxis {...yAxisProps} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={lineCursor} />
        <Area
          type="monotone"
          dataKey="reviews"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorReviews)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ── 4. College Avg Rating — Horizontal Bar ────────────────────────────────

export const CollegeRatingChart = ({ data }: { data?: CollegeRatingDatum[] }) => {
  if (!data?.length) return <NoData height={260} />;
  const trimmed = data.map((d) => ({
    ...d,
    shortName: d.name.length > 16 ? d.name.slice(0, 15) + '…' : d.name,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, trimmed.length * 52)}>
      <BarChart data={trimmed} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid {...gridProps} horizontal={false} />
        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} {...xAxisProps} />
        <YAxis type="category" dataKey="shortName" width={120} {...yAxisProps} />
        <Tooltip
          content={
            <CustomTooltip
              formatValue={(_v, entry) => {
                const d = entry as unknown as CollegeRatingDatum;
                return `${(d.avgRating ?? 0).toFixed(1)} avg · ${d.reviews} reviews`;
              }}
            />
          }
          cursor={barCursorLight}
        />
        <Bar dataKey="avgRating" radius={[0, 6, 6, 0]}>
          {trimmed.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── 5. Role Distribution — Radial Bar ─────────────────────────────────────

export const RoleRadialChart = ({ data }: { data?: RoleDatum[] }) => {
  if (!data?.length || data.every((d) => d.value === 0)) return <NoData height={220} />;
  const max = Math.max(...data.map((d) => d.value));
  const withPct = data.map((d) => ({
    ...d,
    pct: max > 0 ? Math.round((d.value / max) * 100) : 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={90} data={withPct} startAngle={180} endAngle={0}>
        <RadialBar dataKey="pct" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
        <Legend
          iconSize={8}
          iconType="circle"
          formatter={(val: string) => (
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{val}</span>
          )}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatValue={(_v, entry) => {
                const d = entry as unknown as RoleDatum;
                return String(d.value);
              }}
            />
          }
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

// ── 6. Avg Rating Trend — Line ────────────────────────────────────────────

export const AvgRatingTrendChart = ({ data }: { data?: TrendDatum[] }) => {
  if (!data?.length) return <NoData height={220} />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis dataKey="month" {...xAxisProps} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} {...yAxisProps} />
        <Tooltip content={<CustomTooltip />} cursor={lineCursor} />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'hsl(142 71% 45%)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
