import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { CHART_COLORS } from '@/lib/utils'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(20,10,35,0.92)',
  border: '1px solid rgba(168,0,255,0.25)',
  borderRadius: '14px',
  color: '#C7B6FF',
  fontSize: 12,
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

interface ChartData { x: string | number; y: number }

// ── Bar Chart ──────────────────────────────────────────────────────────────────
export function DataBarChart({ data, xLabel, yLabel }: { data: ChartData[]; xLabel: string; yLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,0,255,0.07)" />
        <XAxis dataKey="x" tick={{ fill: '#8E84A8', fontSize: 11 }} angle={-30} textAnchor="end" label={{ value: xLabel, fill: '#4A0070', position: 'insideBottom', offset: -30 }} />
        <YAxis tick={{ fill: '#8E84A8', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="y" name={yLabel} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Line Chart ─────────────────────────────────────────────────────────────────
export function DataLineChart({ data, xLabel, yLabel }: { data: ChartData[]; xLabel: string; yLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,0,255,0.07)" />
        <XAxis dataKey="x" tick={{ fill: '#8E84A8', fontSize: 11 }} angle={-30} textAnchor="end" />
        <YAxis tick={{ fill: '#8E84A8', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="y" name={yLabel} stroke={CHART_COLORS[0]} strokeWidth={2} dot={false}
          style={{ filter: `drop-shadow(0 0 6px ${CHART_COLORS[0]})` }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Pie Chart ──────────────────────────────────────────────────────────────────
export function DataPieChart({ data, yLabel }: { data: ChartData[]; yLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={100} label={({ x, percent }) => `${x} ${(percent * 100).toFixed(0)}%`} labelLine>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Histogram ─────────────────────────────────────────────────────────────────
export function DataHistogram({ bins, counts, colName }: { bins: number[]; counts: number[]; colName: string }) {
  const data = counts.map((count, i) => ({
    x: bins[i]?.toFixed(2) ?? i,
    y: count,
  }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }} barCategoryGap="2%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="x" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="y" name="Frequency" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Heatmap (correlation) ──────────────────────────────────────────────────────
export function CorrelationHeatmap({ columns, matrix }: { columns: string[]; matrix: number[][] }) {
  const getColor = (v: number) => {
    const abs = Math.abs(v)
    if (v > 0) return `rgba(99,102,241,${abs.toFixed(2)})`
    return `rgba(239,68,68,${abs.toFixed(2)})`
  }
  const cellSize = Math.max(36, Math.min(72, 360 / columns.length))

  return (
    <div className="overflow-auto">
      <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', marginLeft: 80 }}>
          {columns.map((c) => (
            <div key={c} style={{ width: cellSize, fontSize: 10, color: '#94a3b8', textAlign: 'center', wordBreak: 'break-all', padding: '0 2px' }}>
              {c.slice(0, 6)}
            </div>
          ))}
        </div>
        {matrix.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 80, fontSize: 10, color: '#94a3b8', textAlign: 'right', paddingRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {columns[ri]}
            </div>
            {row.map((v, ci) => (
              <div key={ci} style={{
                width: cellSize, height: cellSize,
                background: getColor(v),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#fff', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {v.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Forecast Chart ────────────────────────────────────────────────────────────

interface ForecastTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function ForecastTooltip({ active, payload, label }: ForecastTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: '10px 14px', minWidth: 180 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>📅 {label}</p>
      {payload.map((entry: any) => {
        if (entry.value === null || entry.value === undefined) return null
        return (
          <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <span style={{ color: entry.color, fontSize: 12 }}>{entry.name}</span>
            <span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>
              {Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ForecastChart({ data }: {
  data: {
    historical_dates: string[]; historical_values: number[];
    dates: string[]; values: number[]; lower?: number[]; upper?: number[];
  }
}) {
  const historical = data.historical_dates.map((d, i) => ({ date: d, actual: data.historical_values[i], forecast: null, lower: null, upper: null }))
  const forecast = data.dates.map((d, i) => ({ date: d, actual: null, forecast: data.values[i], lower: data.lower?.[i] ?? null, upper: data.upper?.[i] ?? null }))
  const combined = [...historical.slice(-60), ...forecast]

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={combined} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,0,255,0.07)" />
        <XAxis dataKey="date" tick={{ fill: '#8E84A8', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fill: '#8E84A8', fontSize: 11 }} width={70} tickFormatter={(v) => Number(v).toLocaleString()} />
        <Tooltip content={<ForecastTooltip />} />
        <Legend wrapperStyle={{ color: '#8E84A8', fontSize: 12 }} />
        <Line type="monotone" dataKey="actual" stroke="#B15CFF" strokeWidth={2} dot={false} name="Actual"
          style={{ filter: 'drop-shadow(0 0 4px rgba(177,92,255,0.5))' }} />
        <Line type="monotone" dataKey="forecast" stroke="#FF4DA6" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,77,166,0.5))' }} />
        {data.upper && <Line type="monotone" dataKey="upper" stroke="rgba(168,0,255,0.25)" strokeWidth={1} dot={false} name="Upper bound" />}
        {data.lower && <Line type="monotone" dataKey="lower" stroke="rgba(168,0,255,0.25)" strokeWidth={1} dot={false} name="Lower bound" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
