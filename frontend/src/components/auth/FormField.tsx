import { forwardRef, InputHTMLAttributes, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: ReactNode
  hint?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, hint, className, type, ...rest }, ref) => {
    const [showPwd, setShowPwd] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <div className="relative group">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full bg-surface-700/60 border rounded-xl px-4 py-3 text-slate-100 text-sm',
              'placeholder:text-[#8A82A0] outline-none transition-all duration-200',
              'focus:ring-2 focus:border-brand-500/60 focus:ring-brand-500/20',
              'hover:border-brand-500/30',
              icon ? 'pl-10' : '',
              isPassword ? 'pr-11' : '',
              error
                ? 'border-red-500/60 ring-2 ring-red-500/10'
                : 'border-white/10',
              className,
            )}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-red-400 flex items-center gap-1"
            >
              <span>⚠</span> {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-600"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
FormField.displayName = 'FormField'
