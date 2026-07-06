import { useMemo } from 'react'
import type { PasswordStrength } from '@/types/auth'

interface StrengthResult {
  score: PasswordStrength
  label: string
  color: string
  bars: boolean[]
  feedback: string[]
}

export function usePasswordStrength(password: string): StrengthResult {
  return useMemo(() => {
    if (!password) return { score: 0, label: '', color: '#334155', bars: [false,false,false,false], feedback: [] }

    let score = 0
    const feedback: string[] = []

    if (password.length >= 8)  score++
    else feedback.push('At least 8 characters')

    if (password.length >= 12) score++

    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    else feedback.push('Mix uppercase and lowercase')

    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
    else if (!/\d/.test(password)) feedback.push('Add a number')
    else if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add a special character')

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['#334155', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']
    const bars   = [score >= 1, score >= 2, score >= 3, score >= 4]

    return {
      score: score as PasswordStrength,
      label: labels[score],
      color: colors[score],
      bars,
      feedback,
    }
  }, [password])
}
