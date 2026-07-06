import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  Upload, Database, TrendingUp, MessageSquare,
  FileText, Trash2, ArrowRight, Sparkles, BarChart3,
} from 'lucide-react'
import { useDatasetStore } from '@/store/datasetStore'
import { useAuth } from '@/context/AuthContext'
import { formatNumber } from '@/lib/utils'

const STAT_CARDS = (ds: number, rows: number) => [
  { label: 'Datasets',        value: ds,               icon: Database,    color: 'from-brand-500 to-brand-700' },
  { label: 'Total Rows',      value: formatNumber(rows, 0), icon: BarChart3, color: 'from-emerald-500 to-teal-700' },
  { label: 'AI Analyses',     value: ds * 3,            icon: Sparkles,    color: 'from-purple-500 to-purple-700' },
  { label: 'Reports',         value: Math.max(0, ds - 1), icon: FileText,  color: 'from-amber-500 to-orange-600' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { datasets, fetchDatasets, uploadDataset, deleteDataset, setActiveDataset, isLoading } = useDatasetStore()

  useEffect(() => { fetchDatasets() }, [fetchDatasets])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const tid = toast.loading(`Uploading ${file.name}…`)
      try {
        const ds = await uploadDataset(file)
        toast.success(`${file.name} uploaded`, { id: tid })
        setActiveDataset(ds)
        navigate(`/dataset/${ds.id}`)
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Upload failed', { id: tid })
      }
    }
  }, [uploadDataset, setActiveDataset, navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: true,
  })

  const totalRows = datasets.reduce((s, d) => s + (d.rows || 0), 0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Good day, {user?.fullName?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 mt-1">Upload a CSV to start analyzing your data with AI.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(datasets.length, totalRows).map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card hover:scale-[1.02] transition-transform cursor-default"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-slate-400">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-brand-500/50 hover:bg-white/[0.02]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragActive ? 'bg-brand-500/30' : 'bg-white/5'}`}>
            <Upload size={24} className={isDragActive ? 'text-brand-300' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-slate-200 font-medium">
              {isDragActive ? 'Drop to upload' : 'Drag & drop your CSV files'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <span className="text-brand-400">browse</span> · Max 50MB · Multiple files supported
            </p>
          </div>
        </div>
      </div>

      {/* Datasets list */}
      {datasets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Your Datasets</h3>
            <span className="text-sm text-slate-500">{datasets.length} total</span>
          </div>
          <div className="space-y-2">
            {datasets.map((ds, i) => (
              <motion.div
                key={ds.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-dark rounded-xl p-4 flex items-center gap-4 group hover:border-brand-500/30 transition-all cursor-pointer"
                onClick={() => { setActiveDataset(ds); navigate(`/dataset/${ds.id}`) }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <Database size={18} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate">{ds.name}</p>
                  <p className="text-xs text-slate-500">
                    {ds.rows?.toLocaleString()} rows · {ds.columns} columns ·{' '}
                    {ds.missing_total > 0 && <span className="text-amber-400">{ds.missing_total} missing</span>}
                    {ds.missing_total === 0 && <span className="text-emerald-400">Clean</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveDataset(ds); navigate(`/chat/${ds.id}`) }}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-brand-300 transition-colors"
                    title="Chat with AI"
                  >
                    <MessageSquare size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveDataset(ds); navigate(`/forecast/${ds.id}`) }}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-300 transition-colors"
                    title="Forecast"
                  >
                    <TrendingUp size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this dataset?')) deleteDataset(ds.id).then(() => toast.success('Deleted'))
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ArrowRight size={15} className="text-slate-600" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && datasets.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Database size={40} className="mx-auto mb-3 opacity-30" />
          <p>No datasets yet. Upload a CSV to get started.</p>
        </div>
      )}
    </div>
  )
}
