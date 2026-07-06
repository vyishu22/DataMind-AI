import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import {
  Send, Mic, MicOff, Trash2, Database, Sparkles, User,
  ChevronDown, Loader2,
} from 'lucide-react'
import { useDatasetStore } from '@/store/datasetStore'
import { chatApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Message { role: 'user' | 'assistant'; content: string; timestamp: string }

const QUICK_PROMPTS = [
  'What are the top 5 rows?',
  'Show me the average of numeric columns',
  'What are the most common values?',
  'Any trends or patterns?',
  'What columns have missing data?',
  'Give me a summary of this dataset',
]

export default function ChatPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { datasets, activeDataset, setActiveDataset } = useDatasetStore()

  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [listening,  setListening]  = useState(false)
  const [sessionId]  = useState(() => `session_${Date.now()}`)
  const [datasetId,  setDatasetId]  = useState(id || activeDataset?.id || '')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (id) setDatasetId(id)
    else if (activeDataset?.id) setDatasetId(activeDataset.id)
  }, [id, activeDataset])

  useEffect(() => { if (datasetId) loadHistory() }, [datasetId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    if (!datasetId) return
    try {
      const res = await chatApi.history(datasetId)
      setMessages(res.data.map((m: any) => ({
        role: m.role, content: m.content, timestamp: m.created_at,
      })))
    } catch { /* empty history */ }
  }

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || !datasetId || sending) return
    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await chatApi.send(datasetId, msg, sessionId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message, timestamp: res.data.timestamp }])
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to get response')
      setMessages(prev => prev.slice(0, -1))
      setInput(msg)
    } finally {
      setSending(false)
    }
  }

  const clearChat = async () => {
    if (!datasetId) return
    await chatApi.clearHistory(datasetId)
    setMessages([])
    toast.success('Chat cleared')
  }

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice not supported'); return }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US'
    recognition.onresult = (e: any) => { setInput(prev => prev + e.results[0][0].transcript); setListening(false) }
    recognition.onerror = () => setListening(false)
    recognition.onend   = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening])

  const currentDataset = datasets.find(d => d.id === datasetId)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Database size={14} style={{ color: '#7060A0' }} />
            <select
              value={datasetId}
              onChange={e => {
                setDatasetId(e.target.value)
                const ds = datasets.find(d => d.id === e.target.value)
                if (ds) setActiveDataset(ds)
                navigate(`/chat/${e.target.value}`, { replace: true })
              }}
              className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
              style={{ color: '#C7B6FF' }}
            >
              <option value="" disabled>Select a dataset…</option>
              {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown size={12} style={{ color: '#7060A0' }} />
          </div>
          {currentDataset && (
            <p className="text-[11px] mt-0.5 ml-5" style={{ color: '#7060A0' }}>
              {currentDataset.rows?.toLocaleString()} rows · {currentDataset.columns} columns
            </p>
          )}
        </div>
        <button onClick={clearChat}
          className="p-2 rounded-xl transition-all"
          style={{ color: '#7060A0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF2D7A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,45,122,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7060A0'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">

        {/* Welcome state */}
        {messages.length === 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center py-12">
            {/* Glowing AI logo */}
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 rounded-[28px] opacity-60 blur-2xl animate-pulse"
                style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)' }} />
              <div className="relative w-20 h-20 rounded-[28px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', boxShadow: '0 0 40px rgba(168,0,255,0.6), 0 0 80px rgba(255,45,122,0.2), inset 0 2px 0 rgba(255,255,255,0.2)' }}>
                <Sparkles size={32} className="text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Ask anything about your data</h3>
            <p className="text-sm mb-8" style={{ color: '#7060A0' }}>
              Natural language questions, calculations, trends &amp; insights
            </p>
            {/* Quick prompts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-left text-sm px-4 py-3 rounded-2xl transition-all"
                  style={{ background: 'rgba(168,0,255,0.08)', border: '1px solid rgba(168,0,255,0.15)', color: '#C7B6FF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,0,255,0.3)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,0,255,0.15)' }}>
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>

              {/* Avatar */}
              <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5',
                msg.role === 'assistant' ? '' : '')
              }
                style={msg.role === 'assistant' ? {
                  background: 'linear-gradient(135deg,#7B2FF7,#F107A3)',
                  boxShadow: '0 0 16px rgba(168,0,255,0.5)',
                } : {
                  background: 'rgba(168,0,255,0.1)',
                  border: '1px solid rgba(168,0,255,0.2)',
                }}>
                {msg.role === 'assistant'
                  ? <Sparkles size={15} className="text-white" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' }} />
                  : <User size={15} style={{ color: '#A800FF' }} />
                }
              </div>

              {/* Bubble */}
              <div
                className={cn('max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm',
                )}
                style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg,rgba(123,47,247,0.2),rgba(241,7,163,0.15))',
                  border: '1px solid rgba(168,0,255,0.25)',
                  color: 'white',
                } : {
                  background: 'rgba(20,10,35,0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(168,0,255,0.12)',
                  color: '#E8E0FF',
                }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      code: ({ children }) => <code style={{ fontFamily: 'monospace', color: '#D88AFF', background: 'rgba(168,0,255,0.15)', padding: '2px 6px', borderRadius: 6, fontSize: '0.85em' }}>{children}</code>,
                    }}>
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
                <p className="text-[10px] mt-1.5 text-right" style={{ color: '#5A3A7A' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sending indicator */}
        {sending && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7B2FF7,#F107A3)', boxShadow: '0 0 16px rgba(168,0,255,0.5)' }}>
              <Sparkles size={15} className="text-white" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' }} />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5"
              style={{ background: 'rgba(20,10,35,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(168,0,255,0.12)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#A800FF' }} />
              <span className="text-sm" style={{ color: '#9080AA' }}>Analyzing your data…</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div className="mt-4 shrink-0">
        {!datasetId && (
          <p className="text-center text-sm mb-3" style={{ color: '#F59E0B' }}>
            ⚠ Select a dataset above to start chatting
          </p>
        )}
        <div className="rounded-2xl transition-all"
          style={{ background: 'rgba(20,10,35,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(168,0,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,0,255,0.4)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(168,0,255,0.15)')}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={datasetId ? 'Ask anything… (Enter to send, Shift+Enter for newline)' : 'Select a dataset first…'}
            disabled={!datasetId || sending}
            rows={1}
            className="w-full bg-transparent px-4 pt-3 pb-2 text-sm outline-none resize-none max-h-36"
            style={{ color: 'white', fieldSizing: 'content' } as any}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Voice button */}
            <button onClick={toggleVoice}
              className={cn('p-2 rounded-xl transition-all', listening ? 'animate-pulse' : '')}
              style={listening ? {
                background: 'rgba(255,45,122,0.2)', color: '#FF2D7A', boxShadow: '0 0 12px rgba(255,45,122,0.4)',
              } : { color: '#7060A0' }}
              onMouseEnter={e => { if (!listening) { (e.currentTarget as HTMLElement).style.color = '#C7B6FF'; (e.currentTarget as HTMLElement).style.background = 'rgba(168,0,255,0.08)' } }}
              onMouseLeave={e => { if (!listening) { (e.currentTarget as HTMLElement).style.color = '#7060A0'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
              title="Voice input">
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || !datasetId || sending}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4 relative overflow-hidden group"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span className="font-semibold">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
