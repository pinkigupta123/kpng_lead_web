import { useMemo, useState, type ElementType } from 'react'
import { Avatar, Box, Card, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import EditNoteIcon from '@mui/icons-material/EditNote'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import EventIcon from '@mui/icons-material/Event'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import HistoryIcon from '@mui/icons-material/History'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { statusLabel, type CustomerTimeline } from '../types'
import { STATUS_COLORS } from './StatusChip'

type Group = 'updates' | 'followups' | 'status' | 'messages' | 'created' | 'other'

const KIND: Record<string, { icon: ElementType; color: string; title: string; group: Group }> = {
  'Customer Created': { icon: PersonAddAlt1Icon, color: '#2F4A6D', title: 'Lead created', group: 'created' },
  'Update Added': { icon: EditNoteIcon, color: '#2F4A6D', title: 'Update', group: 'updates' },
  'Status Updated': { icon: SwapHorizIcon, color: '#7C5CBF', title: 'Status changed', group: 'status' },
  'Follow-up Added': { icon: EventIcon, color: '#C8963E', title: 'Follow-up scheduled', group: 'followups' },
  'Follow-up Rescheduled': { icon: EventRepeatIcon, color: '#7C5CBF', title: 'Follow-up rescheduled', group: 'followups' },
  'Follow-up Completed': { icon: EventAvailableIcon, color: '#3A8F6B', title: 'Follow-up completed', group: 'followups' },
  'WhatsApp Sent': { icon: WhatsAppIcon, color: '#25A55F', title: 'WhatsApp message', group: 'messages' },
}
const FALLBACK = { icon: HistoryIcon, color: '#78909C', title: '', group: 'other' as Group }

const FILTERS: { value: 'all' | Group; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'updates', label: 'Updates' },
  { value: 'followups', label: 'Follow-ups' },
  { value: 'status', label: 'Status' },
  { value: 'messages', label: 'Messages' },
]

const dayLabel = (d: Date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const that = new Date(d); that.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** "Status updated from NEW to FOLLOW-UP" → ['new', 'follow-up'] */
const parseStatus = (remarks: string | null) => {
  const m = remarks?.match(/from\s+([\w-]+)\s+to\s+([\w-]+)/i)
  return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null
}

/** Full conversation / activity log of a lead: who did what and when, filterable and grouped by day. */
export default function ActivityFeed({ timelines }: { timelines: CustomerTimeline[] }) {
  const [filter, setFilter] = useState<'all' | Group>('all')

  const sorted = useMemo(() => [...timelines].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at) || b.id - a.id), [timelines])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sorted.length }
    sorted.forEach((t) => { const g = (KIND[t.action] ?? FALLBACK).group; c[g] = (c[g] ?? 0) + 1 })
    return c
  }, [sorted])

  const visible = sorted.filter((t) => filter === 'all' || (KIND[t.action] ?? FALLBACK).group === filter)

  // group by day (list is already newest first)
  const days: { label: string; items: CustomerTimeline[] }[] = []
  visible.forEach((t) => {
    const label = dayLabel(new Date(t.created_at))
    const last = days[days.length - 1]
    if (last && last.label === label) last.items.push(t)
    else days.push({ label, items: [t] })
  })

  return (
    <Card sx={{
      p: 0, display: 'flex', flexDirection: 'column',
      // desktop: pinned to its column, so its height always equals the left column's height and the entries scroll inside
      position: { lg: 'absolute' }, inset: { lg: 0 },
      // stacked layout (small screens): normal flow, capped
      height: { xs: 'auto', lg: 'auto' }, minHeight: { xs: 360 }, maxHeight: { xs: 'calc(100vh - 160px)', lg: 'none' },
    }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6">Activity &amp; conversation log</Typography>
          <Typography variant="caption" color="text.secondary">{sorted.length} entr{sorted.length === 1 ? 'y' : 'ies'}</Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v) => v && setFilter(v)} sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButton-root': { borderRadius: '16px !important', border: '1px solid #E2E8F0 !important', px: 1.5, py: 0.25, textTransform: 'none', fontSize: '0.78rem' } }}>
          {FILTERS.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}{(counts[f.value] ?? 0) > 0 ? ` · ${counts[f.value]}` : ''}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0, p: 2.5, pt: 1 }}>
        {!visible.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No activity here yet.</Typography>}
        {days.map((day) => (
          <Box key={day.label} sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6, my: 1.25 }}>
              {day.label}
            </Typography>
            {day.items.map((t, i) => {
              const k = KIND[t.action] ?? FALLBACK
              const Icon = k.icon
              const change = t.action === 'Status Updated' ? parseStatus(t.remarks) : null
              const time = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <Box key={t.id} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: 2 }}>
                  {/* connector line */}
                  {i < day.items.length - 1 && <Box sx={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, bgcolor: '#EEF2F6' }} />}
                  <Avatar sx={{ width: 36, height: 36, bgcolor: `${k.color}1F`, color: k.color, flexShrink: 0 }}><Icon sx={{ fontSize: 19 }} /></Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{k.title || t.action}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{time}</Typography>
                    </Box>
                    {change ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                        {[change[0], change[1]].map((s, idx) => (
                          <Box key={idx} sx={{ display: 'contents' }}>
                            {idx === 1 && <ArrowForwardIcon sx={{ fontSize: 15, color: 'text.secondary' }} />}
                            <Chip size="small" label={statusLabel(s)} sx={{ bgcolor: `${STATUS_COLORS[s] ?? '#78909C'}20`, color: STATUS_COLORS[s] ?? '#78909C', fontWeight: 700 }} />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      t.remarks && <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t.remarks}</Typography>
                    )}
                    {t.creator && <Typography variant="caption" color="text.secondary">by {t.creator.name}{t.creator.role === 'super_admin' ? ' (admin)' : ''}</Typography>}
                  </Box>
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </Card>
  )
}

