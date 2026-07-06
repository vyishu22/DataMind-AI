import { motion } from 'framer-motion'
import { usePasswordStrength } from '@/hooks/auth/usePasswordStrength'

export function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color, bars, feedback } = usePasswordStrength(password)
  if (!password) return null

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1.5">
        {bars.map((filled, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-surface-600 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: filled ? color : 'transparent' }}
              initial={{ width: 0 }}
              animate={{ width: filled ? '100%' : '0%' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        {feedback.length > 0 && (
          <span className="text-xs text-slate-600">{feedback[0]}</span>
        )}
      </div>
    </div>
  )
}
