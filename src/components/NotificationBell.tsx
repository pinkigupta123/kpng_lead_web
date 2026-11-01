import { useCallback, useEffect, useState } from 'react'
import { Badge, Box, Button, Chip, Divider, IconButton, Popover, Tooltip, Typography } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import CheckIcon from '@mui/icons-material/Check'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../store/auth'
import type { Followup } from '../types'
import { followupLabel } from '../followup'
import CompleteFollowupDialog, { type CompleteTarget } from './CompleteFollowupDialog'

interface Summary { overdue: number; due_today: number; upcoming: number }

/** Top-bar bell: everything that needs attention (overdue / due-today follow-ups) in one place. */
export default function NotificationBell() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const admin = useAuth((s) => s.user?.role === 'super_admin')
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [summary, setSummary] = useState<Summary>({ overdue: 0, due_today: 0, upcoming: 0 })
  const [items, setItems] = useState<Followup[]>([])
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState<CompleteTarget | null>(null)

  const loadSummary = useCallback(() => {
    api.get('/lead/followups/summary').then((r) => setSummary(r.data)).catch(() => {})
  }, [])

  const loadItems = useCallback(() => {
    setLoading(true)
    api.get('/lead/followups', { params: { state: 'due', per_page: 10 } })
      .then((r) => setItems(r.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  // refresh on navigation, every minute, and when the tab regains focus
  useEffect(() => { loadSummary() }, [loadSummary, pathname])
  useEffect(() => {
    const t = setInterval(loadSummary, 60000)
    const onFocus = () => loadSummary()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus) }
  }, [loadSummary])

  const total = summary.overdue + summary.due_today
  const refresh = () => { loadSummary(); loadItems() }

  const open = (e: React.MouseEvent<HTMLElement>) => { setAnchor(e.currentTarget); loadItems(); loadSummary() }
  const go = (id: number) => { setAnchor(null); nav(`/leads/${id}`) }

  return (
    <>
      <Tooltip title={total ? `${total} follow-up${total === 1 ? '' : 's'} need attention` : 'No pending alerts'}>
        <IconButton color="inherit" onClick={open} sx={{ mr: 1 }}>
          <Badge badgeContent={total} color="error" max={99}>
            {total ? <NotificationsIcon /> : <NotificationsNoneIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 400, maxWidth: 'calc(100vw - 24px)', mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>Needs attention</Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {summary.overdue > 0 && <Chip size="small" color="error" label={`${summary.overdue} overdue`} />}
            {summary.due_today > 0 && <Chip size="small" color="warning" label={`${summary.due_today} today`} />}
          </Box>
        </Box>
        <Divider />

        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading && !items.length && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Loading…</Typography>}
          {!loading && !items.length && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 600 }}>You're all caught up 🎉</Typography>
              <Typography variant="body2" color="text.secondary">No follow-ups are due or overdue.</Typography>
            </Box>
          )}
          {items.map((f) => {
            const label = followupLabel(f)
            return (
              <Box key={f.id} onClick={() => go(f.customer_id)}
                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', borderBottom: '1px solid #F1F5F9', '&:hover': { bgcolor: '#F5F8FB' } }}>
                <Box sx={{ width: 6, alignSelf: 'stretch', borderRadius: 3, bgcolor: label.color, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.customer?.name}</Typography>
                  <Typography noWrap variant="caption" color="text.secondary">
                    {f.customer?.mobile}{admin && f.customer?.executive ? ` · ${f.customer.executive.name}` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: label.color, fontWeight: 700 }}>
                    {label.text} · {f.scheduled_for}
                  </Typography>
                </Box>
                <Tooltip title="Mark done">
                  <IconButton size="small" color="success"
                    onClick={(e) => { e.stopPropagation(); setAnchor(null); setComplete({ id: f.id, scheduled_for: f.scheduled_for, customerName: f.customer?.name, status: f.customer?.status }) }}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          })}
        </Box>

        <Divider />
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {summary.upcoming > 0 ? `${summary.upcoming} more scheduled in the next 7 days` : 'Nothing else scheduled this week'}
          </Typography>
          <Button size="small" onClick={() => { setAnchor(null); nav('/leads') }}>All leads</Button>
        </Box>
      </Popover>

      <CompleteFollowupDialog target={complete} onClose={() => setComplete(null)} onDone={refresh} />
    </>
  )
}
