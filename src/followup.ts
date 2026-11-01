import type { Followup } from './types'

/** Human label + colour for a follow-up's state. */
export function followupLabel(f: Followup): { text: string; color: string } {
  switch (f.state) {
    case 'overdue':
      return { text: `Overdue · ${f.days_overdue} day${f.days_overdue === 1 ? '' : 's'}`, color: '#C0504D' }
    case 'due_today':
      return { text: 'Due today', color: '#C8963E' }
    case 'upcoming':
      return { text: 'Scheduled', color: '#2F4A6D' }
    case 'done':
      return f.days_late > 0
        ? { text: `Done · ${f.days_late} day${f.days_late === 1 ? '' : 's'} late`, color: '#C8963E' }
        : { text: 'Done on time', color: '#3A8F6B' }
    case 'rescheduled':
      return { text: f.days_late > 0 ? `Rescheduled · after ${f.days_late}d` : 'Rescheduled', color: '#7C5CBF' }
    default:
      return { text: 'Cancelled', color: '#78909C' }
  }
}

/** "5 min ago", "3 hours ago", "2 days ago" … */
export function timeAgo(d: Date | null): string {
  if (!d) return '—'
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000))
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}
