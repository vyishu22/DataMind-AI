import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  BarChart3, MessageSquare, TrendingUp, FileText, Download,
  AlertTriangle, CheckCircle, RefreshCw, Sparkles, ChevronDown,
} from 'lucide-react'
import { useDatasetStore } from '@/store/datasetStore'
import { analysisApi, chatApi, reportsApi } from '@/lib/api'
import { formatNumber, scoreToColor, PRIORITY_COLORS } from '@/lib/utils'
import HealthScoreRing from '@/components/dashboard/HealthScoreRing'
import { DataBarChart, DataLineChart, DataPieChart, DataHistogram, CorrelationHeatmap } from '@/components/charts/Charts'
import { useNavigate as useNav } from 'react-router-dom'

type Tab = 'overview' | 'charts' | 'correlation' | 'cleaning'

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { datasets, setActiveDataset } = useDatasetStore()
  const dataset = datasets.find((d) => d.id === id)

  const [tab, setTab] = useState<Tab>('overview')
  const [eda, setEda] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [cleaning, setCleaning] = useState<any[]>([])
  const [correlMatrix, setCorrelMatrix] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [chartX, setChartX] = useState('')
  const [chartY, setChartY] = useState('')
  const [chartType, setChartType] = useState('bar')
  const [loading, setLoading] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    if (!id) return
    const ds = datasets.find((d) => d.id === id)
    if (ds) setActiveDataset(ds)
    loadEda()
  }, [id])

  const loadEda = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [edaRes, healthRes, cleanRes] = await Promise.all([
        analysisApi.eda(id),
        analysisApi.health(id),
        analysisApi.cleaning(id),
      ])
      setEda(edaRes.data)
      setHealth(healthRes.data)
      setCleaning(cleanRes.data.suggestions)
      // default chart columns
      const numCols = Object.keys(edaRes.data.statistics || {})
      const catCols = Object.keys(edaRes.data.categorical || {})
      if (catCols[0]) setChartX(catCols[0])
      if (numCols[0]) setChartY(numCols[0])
    } catch (e) {
      toast.error('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  const loadInsights = async () => {
    if (!id) return
    setLoadingInsights(true)
    try {
      const res = await chatApi.insights(id)
      setInsights(res.data)
    } catch {
      toast.error('AI insights unavailable — check your API key')
    } finally {
      setLoadingInsights(false)
    }
  }

  const loadChart = async () => {
    if (!id || !chartX || !chartY) return
    try {
      const res = await analysisApi.chartData(id, { x: chartX, y: chartY, chart_type: chartType })
      setChartData(res.data)
    } catch {
      toast.error('Failed to load chart data')
    }
  }

  const loadCorrelation = async () => {
    if (!id) return
    try {
      const res = await analysisApi.correlationMatrix(id)
      setCorrelMatrix(res.data)
    } catch {
      toast.error('Failed to load correlation matrix')
    }
  }

  const generateReport = async () => {
    if (!id) return
    setGeneratingReport(true)
    const tid = toast.loading('Generating PDF report…')
    try {
      const res = await reportsApi.generate(id)
      toast.success('Report ready!', { id: tid })
      // trigger download
      const dlRes = await reportsApi.download(res.data.id)
      const url = URL.createObjectURL(dlRes.data)
      const a = document.createElement('a'); a.href = url
      a.download = res.data.filename; a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Report generation failed', { id: tid })
    } finally {
      setGeneratingReport(false)
    }
  }

  useEffect(() => { if (tab === 'correlation') loadCorrelation() }, [tab])

  const numCols = Object.keys(eda?.statistics || {})
  const catCols = Object.keys(eda?.categorical || {})
  const allCols = dataset?.column_names || []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!dataset) return (
    <div className="text-center py-20 text-slate-500">Dataset not found</div>
  )

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'charts', label: 'Charts' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'cleaning', label: `Cleaning (${cleaning.length})` },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white truncate">{dataset.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {dataset.rows?.toLocaleString()} rows · {dataset.columns} columns · Uploaded {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate(`/chat/${id}`)} className="btn-ghost flex items-center gap-1.5 text-sm">
            <MessageSquare size={15} /> Chat
          </button>
          <button onClick={() => navigate(`/forecast/${id}`)} className="btn-ghost flex items-center gap-1.5 text-sm">
            <TrendingUp size={15} /> Forecast
          </button>
          <button onClick={generateReport} disabled={generatingReport} className="btn-primary flex items-center gap-1.5 text-sm">
            {generatingReport ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            PDF Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && eda && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health score */}
            {health && (
              <div className="card flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-slate-300 self-start">Dataset Health</p>
                <HealthScoreRing score={health.score} grade={health.grade} />
                <div className="w-full space-y-2">
                  {Object.entries(health.breakdown || {}).map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24 capitalize">{k}</span>
                      <div className="flex-1 bg-surface-600 rounded-full h-1.5">
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: scoreToColor(v), width: `${v}%` }}
                          initial={{ width: 0 }} animate={{ width: `${v}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing values */}
            <div className="card">
              <p className="text-sm font-medium text-slate-300 mb-3">Missing Values</p>
              {Object.keys(eda.missing || {}).length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle size={16} /> No missing values
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {Object.entries(eda.missing).map(([col, info]: any) => (
                    <div key={col} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 truncate flex-1">{col}</span>
                      <div className="w-20 bg-surface-600 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${info.pct}%` }} />
                      </div>
                      <span className="text-xs text-amber-400 w-10 text-right">{info.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Duplicates</span>
                <span className={eda.duplicates > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {eda.duplicates} rows
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="card">
              <p className="text-sm font-medium text-slate-300 mb-3">Column Types</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {allCols.map((col) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 truncate flex-1">{col}</span>
                    <span className="badge-purple text-[10px]">{eda.dtypes[col]?.replace('float64', 'float').replace('int64', 'int').replace('object', 'text')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics table */}
          {numCols.length > 0 && (
            <div className="card overflow-x-auto">
              <p className="text-sm font-medium text-slate-300 mb-4">Statistical Summary</p>
              <table className="w-full text-xs text-slate-400 min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2 text-slate-500 font-medium">Column</th>
                    {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((m) => (
                      <th key={m} className="text-right py-2 text-slate-500 font-medium px-2">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {numCols.map((col) => (
                    <tr key={col} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2 text-slate-300 font-medium">{col}</td>
                      {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((m) => (
                        <td key={m} className="text-right py-2 px-2">
                          {formatNumber(eda.statistics[col]?.[m])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Data preview */}
          <div className="card overflow-x-auto">
            <p className="text-sm font-medium text-slate-300 mb-4">Data Preview (first 5 rows)</p>
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5">
                  {allCols.map((col) => (
                    <th key={col} className="text-left py-2 px-3 text-slate-500 font-medium whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dataset.preview || []).map((row: any, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    {allCols.map((col) => (
                      <td key={col} className="py-2 px-3 text-slate-400 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Insights */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Sparkles size={15} className="text-brand-400" /> AI Insights
              </p>
              <button onClick={loadInsights} disabled={loadingInsights} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
                {loadingInsights ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {insights ? 'Refresh' : 'Generate'}
              </button>
            </div>
            {insights ? (
              <div className="space-y-4">
                {insights.findings?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Key Findings</p>
                    <ul className="space-y-1">
                      {insights.findings.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-brand-400 shrink-0">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.business_insights?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Business Insights</p>
                    <ul className="space-y-1">
                      {insights.business_insights.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-emerald-400 shrink-0">→</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Click Generate to get AI-powered insights about your dataset.</p>
            )}
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {tab === 'charts' && (
        <div className="space-y-6">
          <div className="card">
            <p className="text-sm font-medium text-slate-300 mb-4">Configure Chart</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">X Axis</label>
                <select value={chartX} onChange={(e) => setChartX(e.target.value)} className="input text-sm">
                  {allCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Y Axis</label>
                <select value={chartY} onChange={(e) => setChartY(e.target.value)} className="input text-sm">
                  {numCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Chart Type</label>
                <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="input text-sm">
                  {['bar', 'line', 'pie'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={loadChart} className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-1.5">
                  <BarChart3 size={14} /> Render
                </button>
              </div>
            </div>

            {chartData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {chartType === 'bar' && <DataBarChart data={chartData.data} xLabel={chartData.x_label} yLabel={chartData.y_label} />}
                {chartType === 'line' && <DataLineChart data={chartData.data} xLabel={chartData.x_label} yLabel={chartData.y_label} />}
                {chartType === 'pie' && <DataPieChart data={chartData.data} yLabel={chartData.y_label} />}
              </motion.div>
            )}
          </div>

          {/* Histograms */}
          {Object.entries(eda?.distributions || {}).slice(0, 4).map(([col, dist]: any) => (
            <div key={col} className="card">
              <p className="text-sm font-medium text-slate-300 mb-3">Distribution: {col}</p>
              <DataHistogram bins={dist.bins} counts={dist.counts} colName={col} />
            </div>
          ))}
        </div>
      )}

      {/* Correlation Tab */}
      {tab === 'correlation' && (
        <div className="card">
          <p className="text-sm font-medium text-slate-300 mb-4">Correlation Matrix</p>
          {correlMatrix?.columns?.length > 0 ? (
            <CorrelationHeatmap columns={correlMatrix.columns} matrix={correlMatrix.matrix} />
          ) : (
            <p className="text-sm text-slate-500">Need at least 2 numeric columns for correlation analysis.</p>
          )}
        </div>
      )}

      {/* Cleaning Tab */}
      {tab === 'cleaning' && (
        <div className="space-y-3">
          {cleaning.length === 0 ? (
            <div className="card flex items-center gap-3 text-emerald-400">
              <CheckCircle size={20} />
              <p>Dataset looks clean! No issues detected.</p>
            </div>
          ) : (
            cleaning.map((s, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card flex items-start gap-4"
              >
                <AlertTriangle size={16} style={{ color: PRIORITY_COLORS[s.priority], marginTop: 2 }} className="shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">{s.column}</span>
                    <span className="badge text-[10px] px-2" style={{ background: `${PRIORITY_COLORS[s.priority]}20`, color: PRIORITY_COLORS[s.priority] }}>
                      {s.priority}
                    </span>
                    <span className="badge-purple text-[10px]">{s.action}</span>
                  </div>
                  <p className="text-sm text-slate-400">{s.reason}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
