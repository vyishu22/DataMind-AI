import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { TrendingUp, Play, Calendar, BarChart3, Loader2, Table2 } from 'lucide-react'
import { useDatasetStore } from '@/store/datasetStore'
import { forecastApi } from '@/lib/api'
import { ForecastChart } from '@/components/charts/Charts'
import { cn } from '@/lib/utils'

const METHODS = [
  { value: 'arima', label: 'ARIMA', desc: 'Autoregressive integrated model' },
  { value: 'prophet', label: 'Prophet', desc: 'Facebook\'s time series model' },
  { value: 'linear', label: 'Linear Trend', desc: 'Simple linear regression' },
]

export default function ForecastPage() {
  const { id } = useParams<{ id?: string }>()
  const { datasets, activeDataset, setActiveDataset } = useDatasetStore()

  const [datasetId, setDatasetId] = useState(id || activeDataset?.id || '')
  const [dateCols, setDateCols] = useState<string[]>([])
  const [valueCols, setValueCols] = useState<string[]>([])
  const [dateCol, setDateCol] = useState('')
  const [valueCol, setValueCol] = useState('')
  const [periods, setPeriods] = useState(30)
  const [method, setMethod] = useState('arima')
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) setDatasetId(id)
    else if (activeDataset?.id) setDatasetId(activeDataset.id)
  }, [id, activeDataset])

  useEffect(() => {
    if (datasetId) loadColumns()
  }, [datasetId])

  const loadColumns = async () => {
    try {
      const res = await forecastApi.columns(datasetId)
      setDateCols(res.data.date_columns)
      setValueCols(res.data.value_columns)
      if (res.data.date_columns[0]) setDateCol(res.data.date_columns[0])
      if (res.data.value_columns[0]) setValueCol(res.data.value_columns[0])
    } catch {
      toast.error('Could not load column info')
    }
  }

  const runForecast = async () => {
    if (!datasetId || !dateCol || !valueCol) {
      toast.error('Please select dataset, date column, and value column')
      return
    }
    setLoading(true)
    try {
      const res = await forecastApi.predict({ dataset_id: datasetId, date_col: dateCol, value_col: valueCol, periods, method })
      setForecastData(res.data)
      toast.success(`${method.toUpperCase()} forecast complete!`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }

  const currentDataset = datasets.find((d) => d.id === datasetId)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-400" /> Forecasting Dashboard
        </h2>
        <p className="text-slate-400 text-sm mt-1">Predict future trends using ARIMA, Prophet, or Linear models</p>
      </div>

      {/* Config */}
      <div className="card">
        <p className="text-sm font-medium text-slate-300 mb-4">Forecast Configuration</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Dataset */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Dataset</label>
            <select
              value={datasetId}
              onChange={(e) => {
                setDatasetId(e.target.value)
                const ds = datasets.find((d) => d.id === e.target.value)
                if (ds) setActiveDataset(ds)
              }}
              className="input text-sm"
            >
              <option value="">Select dataset…</option>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Date column */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <Calendar size={12} /> Date Column
            </label>
            <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="input text-sm">
              <option value="">Select…</option>
              {dateCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Value column */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
              <BarChart3 size={12} /> Value Column
            </label>
            <select value={valueCol} onChange={(e) => setValueCol(e.target.value)} className="input text-sm">
              <option value="">Select…</option>
              {valueCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Periods */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Forecast Periods</label>
            <input
              type="number" min={7} max={365} value={periods}
              onChange={(e) => setPeriods(Number(e.target.value))}
              className="input text-sm"
            />
          </div>
        </div>

        {/* Method selection */}
        <div className="mb-5">
          <label className="text-xs text-slate-400 mb-2 block">Forecasting Method</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  'p-3 rounded-xl text-left border transition-all',
                  method === m.value
                    ? 'border-brand-500/50 bg-brand-500/10 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200',
                )}
              >
                <p className="font-medium text-sm">{m.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runForecast}
          disabled={loading || !datasetId || !dateCol || !valueCol}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {loading ? 'Running forecast…' : 'Run Forecast'}
        </button>
      </div>

      {/* Results */}
      {forecastData && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-300">
                {method.toUpperCase()} Forecast — {forecastData.value_col} over {forecastData.periods} periods
              </p>
              <span className="badge-purple">{forecastData.method}</span>
            </div>
            <ForecastChart data={forecastData} />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Last Actual', value: forecastData.historical_values?.slice(-1)[0]?.toFixed(2) ?? '—' },
              { label: 'First Forecast', value: forecastData.values?.[0]?.toFixed(2) ?? '—' },
              { label: 'Peak Forecast', value: Math.max(...(forecastData.values || [0])).toFixed(2) },
              { label: 'Avg Forecast', value: (forecastData.values?.reduce((a: number, b: number) => a + b, 0) / (forecastData.values?.length || 1)).toFixed(2) },
            ].map((s) => (
              <div key={s.label} className="card text-center py-4">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Forecast Summary Block */}
          {(() => {
            const histDates = forecastData.historical_dates ?? []
            const futureDates = forecastData.dates ?? []
            const forecastValues: number[] = forecastData.values ?? []
            const lastHistDate = histDates[histDates.length - 1] ?? '—'
            const forecastStart = futureDates[0] ?? '—'
            const forecastEnd = futureDates[futureDates.length - 1] ?? '—'
            const horizon = futureDates.length
            const avgForecast = forecastValues.length
              ? forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length
              : 0
            const fmt = (d: string) => d !== '—' ? d.slice(5) : '—' // MM-DD
            return (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={15} className="text-brand-400" />
                  <p className="text-sm font-medium text-slate-300">Forecast Summary</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Last historical date', value: fmt(lastHistDate) },
                    { label: 'Forecast starts', value: fmt(forecastStart) },
                    { label: 'Forecast ends', value: fmt(forecastEnd) },
                    { label: 'Forecast horizon', value: `${horizon} days` },
                    { label: `Expected avg ${forecastData.value_col}`, value: avgForecast.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Forecast Table */}
          {(() => {
            const futureDates: string[] = forecastData.dates ?? []
            const forecastValues: number[] = forecastData.values ?? []
            const lowerVals: number[] = forecastData.lower ?? []
            const upperVals: number[] = forecastData.upper ?? []
            const hasCI = lowerVals.length > 0 && upperVals.length > 0
            return (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Table2 size={15} className="text-brand-400" />
                  <p className="text-sm font-medium text-slate-300">Forecast Table</p>
                  <span className="ml-auto text-xs text-slate-500">{futureDates.length} rows</span>
                </div>
                <div className="overflow-auto max-h-72 rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-900 z-10">
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">#</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">Date</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Predicted ({forecastData.value_col})</th>
                        {hasCI && <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Lower</th>}
                        {hasCI && <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Upper</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {futureDates.map((date, i) => (
                        <tr key={date} className={cn('border-b border-white/5 hover:bg-white/5 transition-colors', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                          <td className="px-4 py-2 text-slate-500 text-xs">{i + 1}</td>
                          <td className="px-4 py-2 text-slate-300 font-mono text-xs">{date}</td>
                          <td className="px-4 py-2 text-right font-semibold text-white">
                            {forecastValues[i]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                          </td>
                          {hasCI && <td className="px-4 py-2 text-right text-slate-400 text-xs">{lowerVals[i]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}</td>}
                          {hasCI && <td className="px-4 py-2 text-right text-slate-400 text-xs">{upperVals[i]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Empty state */}
      {!forecastData && !loading && (
        <div className="text-center py-16 text-slate-500">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
          <p>Configure the forecast above and click Run Forecast to see predictions.</p>
        </div>
      )}
    </div>
  )
}
