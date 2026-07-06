import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FileText, Download, Trash2, RefreshCw, Sparkles, Loader2, BarChart3 } from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { useDatasetStore } from '@/store/datasetStore'
import { scoreToColor } from '@/lib/utils'

interface Report {
  id: string
  dataset_name: string
  filename: string
  created_at: string
  health_score?: number
}

export default function ReportsPage() {
  const { datasets } = useDatasetStore()
  const [reports,          setReports]          = useState<Report[]>([])
  const [loading,          setLoading]          = useState(false)
  const [generating,       setGenerating]       = useState(false)
  const [selectedDataset,  setSelectedDataset]  = useState('')

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    setLoading(true)
    try { const res = await reportsApi.list(); setReports(res.data) }
    finally { setLoading(false) }
  }

  const generateReport = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return }
    setGenerating(true)
    const tid = toast.loading('Generating professional PDF report…')
    try {
      await reportsApi.generate(selectedDataset)
      toast.success('Report generated!', { id: tid })
      fetchReports()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to generate report', { id: tid })
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (report: Report) => {
    try {
      const res = await reportsApi.download(report.id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = report.filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return
    await reportsApi.delete(id)
    setReports(prev => prev.filter(r => r.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={22} style={{ color: '#A800FF' }} />
            Reports
          </h2>
          <p className="text-sm mt-1" style={{ color: '#7060A0' }}>
            Generate and download professional PDF analysis reports
          </p>
        </div>
        <button onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(168,0,255,0.1)', border: '1px solid rgba(168,0,255,0.2)', color: '#C7B6FF' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,0,255,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(168,0,255,0.1)')}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Generate new report ────────────────────────────────────── */}
      <div className="card">
        {/* Card header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', boxShadow: '0 0 16px rgba(168,0,255,0.4)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">Generate New Report</p>
            <p className="text-xs mt-0.5" style={{ color: '#7060A0' }}>
              17-section professional PDF with AI insights &amp; visualisations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <select
            value={selectedDataset}
            onChange={e => setSelectedDataset(e.target.value)}
            className="input flex-1 text-sm"
          >
            <option value="">Select dataset…</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button
            onClick={generateReport}
            disabled={generating || !selectedDataset}
            className="btn-primary flex items-center gap-2 px-5 whitespace-nowrap text-sm"
          >
            {generating
              ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
              : <><Sparkles size={14} /> Generate PDF</>
            }
          </button>
        </div>

        {/* What's included */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            'Cover Page', 'Executive Summary', 'Dataset Overview',
            'Health Score', 'Missing Values', 'Statistical Summary',
            'Correlation Heatmap', 'Outlier Detection', 'AI Insights',
            'Distribution Charts', 'Cleaning Suggestions', 'Forecast Summary',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs" style={{ color: '#9080AA' }}>
              <span style={{ color: '#A800FF' }}>✓</span> {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Reports list ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(168,0,255,0.3)', borderTopColor: '#A800FF' }} />
          <p className="text-sm" style={{ color: '#7060A0' }}>Loading reports…</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(168,0,255,0.08)', border: '1px solid rgba(168,0,255,0.15)' }}>
            <FileText size={28} style={{ color: '#5A3A7A' }} />
          </div>
          <p className="font-semibold text-white mb-1">No reports yet</p>
          <p className="text-sm" style={{ color: '#7060A0' }}>
            Select a dataset above and click Generate PDF
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#7060A0' }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </p>
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card group flex items-center gap-4"
              style={{ padding: '1rem 1.25rem' }}
            >
              {/* PDF icon */}
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,45,122,0.1)', border: '1px solid rgba(255,45,122,0.2)' }}>
                <FileText size={18} style={{ color: '#FF4DA6' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{report.dataset_name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#7060A0' }}>
                  {new Date(report.created_at).toLocaleString()} · {report.filename}
                </p>
              </div>

              {/* Health score badge */}
              {report.health_score != null && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                  style={{ background: 'rgba(168,0,255,0.08)', border: '1px solid rgba(168,0,255,0.15)' }}>
                  <BarChart3 size={13} style={{ color: scoreToColor(report.health_score) }} />
                  <span className="text-sm font-bold" style={{ color: scoreToColor(report.health_score) }}>
                    {report.health_score}/100
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => downloadReport(report)}
                  title="Download PDF"
                  className="p-2 rounded-xl transition-all"
                  style={{ color: '#7060A0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#A800FF'; (e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7060A0'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <Download size={15} />
                </button>
                <button
                  onClick={() => deleteReport(report.id)}
                  title="Delete"
                  className="p-2 rounded-xl transition-all"
                  style={{ color: '#7060A0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF2D7A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,45,122,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7060A0'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
