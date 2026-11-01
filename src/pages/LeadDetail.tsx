import { useCallback, useEffect, useState } from 'react'
import {
  Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  MenuItem, TextField, Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import EditIcon from '@mui/icons-material/Edit'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EventIcon from '@mui/icons-material/Event'
import EditNoteIcon from '@mui/icons-material/EditNote'
import { useNavigate, useParams } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import StatusChip from '../components/StatusChip'
import WhatsAppDialog from '../components/WhatsAppDialog'
import CompleteFollowupDialog, { type CompleteTarget } from '../components/CompleteFollowupDialog'
import { followupLabel } from '../followup'
import { localDate } from '../dates'
import ActivityFeed from '../components/ActivityFeed'
import { STATUSES, statusLabel, type Customer } from '../types'

const tomorrow = () => localDate(1)

function Info({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <Grid size={wide ? { xs: 12, md: 6 } : { xs: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{label}</Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4, mt: 0.25, wordBreak: 'break-word' }}>{value || '—'}</Typography>
    </Grid>
  )
}

export default function LeadDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { notify } = useFeedback()
  const [c, setC] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const [fuOpen, setFuOpen] = useState(false)
  const [fuDate, setFuDate] = useState(tomorrow())
  const [fuRemarks, setFuRemarks] = useState('')
  const [upOpen, setUpOpen] = useState(false)
  const [upNote, setUpNote] = useState('')
  const [upStatus, setUpStatus] = useState('')

  const [waOpen, setWaOpen] = useState(false)
  const [completeT, setCompleteT] = useState<CompleteTarget | null>(null)

  const load = useCallback(() => {
    api.get(`/lead/customers/${id}`)
      .then((r) => setC(r.data?.data || r.data))
      .catch((e) => {
        notify(e?.response?.status === 403 ? "You don't have access to this lead." : 'Failed to load lead', 'error')
        nav('/leads')
      })
      .finally(() => setLoading(false))
  }, [id, nav, notify])

  useEffect(load, [load])

  if (loading || !c) return <CircularProgress />

  // Schedule (or reschedule) the NEXT follow-up: a future date + an optional plan.
  const saveFollowup = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fuDate)) return notify('Choose a valid follow-up date', 'error')
    if (fuDate < localDate()) return notify('Follow-up date cannot be in the past', 'error')
    try {
      await api.post(`/lead/customers/${c.id}/follow-up`, {
        followup_date: fuDate,
        remarks: fuRemarks.trim() || undefined,
      })
      setFuOpen(false)
      notify('Follow-up scheduled')
      load()
    } catch (e) { notify(errMsg(e, 'Failed to schedule follow-up'), 'error') }
  }

  // Log what happened (call / visit): a note + optional status change. No date involved.
  const saveUpdate = async () => {
    if (!upNote.trim()) return notify('Write what happened', 'error')
    try {
      await api.post(`/lead/customers/${c.id}/activity`, { note: upNote.trim(), status: upStatus || undefined })
      setUpOpen(false)
      notify('Update added')
      load()
    } catch (e) { notify(errMsg(e, 'Failed to add update'), 'error') }
  }

  const pendingFollowup = c.followups?.find((f) => f.status === 'pending')
  const logs = c.timelines ?? []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', flexShrink: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{c.name}</Typography>
        <StatusChip status={c.status} />
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<WhatsAppIcon />} color="success" variant="outlined" onClick={() => setWaOpen(true)}>WhatsApp</Button>
        <Button startIcon={<EditNoteIcon />} variant="outlined" onClick={() => { setUpNote(''); setUpStatus(''); setUpOpen(true) }}>Log update</Button>
        <Button startIcon={<EventIcon />} variant="outlined" onClick={() => { setFuDate(c.followup_date ? String(c.followup_date).slice(0, 10) : tomorrow()); setFuRemarks(''); setFuOpen(true) }}>
          {pendingFollowup ? 'Reschedule follow-up' : 'Schedule follow-up'}
        </Button>
        <Button startIcon={<EditIcon />} variant="contained" onClick={() => nav(`/leads/${c.id}/edit`)}>Edit</Button>
      </Box>

      <Grid container spacing={2} sx={{ flexWrap: { lg: 'nowrap' } }}>
        <Grid size={{ xs: 12, lg: 7 }} sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ p: 3.5, flexShrink: 0 }}>
            <Grid container columnSpacing={3} rowSpacing={3}>
              <Info label="Mobile" value={c.mobile} />
              <Info label="Email" value={c.email} />
              <Info label="Company" value={c.company} />
              <Info label="City" value={c.city} />
              <Info label="Interested product" value={c.interested_product} />
              <Info label="Device" value={[c.device_brand, c.device_model].filter(Boolean).join(' ')} />
              <Info label="Follow-up date" value={c.followup_date && String(c.followup_date).slice(0, 10)} />
              <Info label="Assigned to" value={c.executive?.name} />
              <Grid size={12}><Divider sx={{ my: 0.5 }} /></Grid>
              <Info wide label="Customer query" value={c.customer_query} />
              <Info wide label="Notes" value={c.notes} />
            </Grid>
          </Card>

          {/* Follow-up history: scheduled vs actually done */}
          <Card sx={{ p: 2.5, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>Follow-ups</Typography>
            <Box>
            {!c.followups && c.followup_date && (
              <Typography color="text.secondary">
                Next follow-up on <b>{String(c.followup_date).slice(0, 10)}</b>. Detailed follow-up history is not available from this server yet.
              </Typography>
            )}
            {c.followups && !c.followups.some((f) => f.status === 'pending') && (
              <Typography color="text.secondary">No follow-up needs action right now. Use Schedule follow-up to add the next one.</Typography>
            )}
            {!c.followups && !c.followup_date && <Typography color="text.secondary">No follow-ups scheduled yet.</Typography>}
            {c.followups && [...c.followups].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.id - a.id).slice(0, 2).map((f) => {
              const label = followupLabel(f)
              return (
                <Box key={f.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25, borderTop: '1px solid #F1F5F9' }}>
                  <Box sx={{ width: 6, alignSelf: 'stretch', borderRadius: 3, bgcolor: label.color, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 600 }}>{f.scheduled_for}</Typography>
                      <Typography variant="caption" sx={{ color: label.color, fontWeight: 700 }}>{label.text}</Typography>
                    </Box>
                    {f.remarks && <Typography variant="body2" color="text.secondary">Plan: {f.remarks}</Typography>}
                    {f.outcome && <Typography variant="body2">Outcome: {f.outcome}</Typography>}
                    {f.resolved_at && (
                      <Typography variant="caption" color="text.secondary">
                        {f.status === 'done' ? 'Completed' : f.status === 'rescheduled' ? 'Rescheduled' : 'Closed'} {new Date(f.resolved_at).toLocaleString()}
                        {f.resolver ? ` · ${f.resolver.name}` : ''}
                      </Typography>
                    )}
                  </Box>
                  {f.status === 'pending' && (
                    <Button size="small" variant="outlined" color="success"
                      onClick={() => setCompleteT({ id: f.id, scheduled_for: f.scheduled_for, customerName: c.name, status: c.status })}>
                      Mark done
                    </Button>
                  )}
                </Box>
              )
            })}
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }} sx={{ position: 'relative', minHeight: { xs: 360, lg: 420 } }}>
          <ActivityFeed timelines={logs} />
        </Grid>
      </Grid>

      {/* Schedule follow-up: WHEN to contact the customer next */}
      <Dialog open={fuOpen} onClose={() => setFuOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 0.5 }}>
          {pendingFollowup ? 'Reschedule follow-up' : 'Schedule follow-up'}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            {pendingFollowup
              ? `Currently scheduled for ${pendingFollowup.scheduled_for}. Saving moves it to the new date.`
              : 'Pick the date you should contact this customer next. You will be reminded.'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          <TextField type="date" label="Follow-up date" value={fuDate} onChange={(e) => setFuDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: localDate() } }} />
          <TextField label="Plan / reminder note (optional)" multiline minRows={2} value={fuRemarks} onChange={(e) => setFuRemarks(e.target.value)} placeholder="e.g. Share the quote and ask for a decision" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFuOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveFollowup}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Log update: WHAT happened on a call / visit */}
      <Dialog open={upOpen} onClose={() => setUpOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 0.5 }}>
          Log update
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Record what happened. This does not change the follow-up date.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          <TextField label="What happened? *" multiline minRows={3} autoFocus value={upNote} onChange={(e) => setUpNote(e.target.value)} placeholder="e.g. Called, customer asked for a discount" />
          <TextField select label="Update lead status (optional)" value={upStatus} onChange={(e) => setUpStatus(e.target.value)}>
            <MenuItem value="">Keep current status ({statusLabel(c.status)})</MenuItem>
            {STATUSES.filter((st) => st !== c.status).map((st) => <MenuItem key={st} value={st}>{statusLabel(st)}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveUpdate}>Save update</Button>
        </DialogActions>
      </Dialog>

      <CompleteFollowupDialog target={completeT} onClose={() => setCompleteT(null)} onDone={load} />
      <WhatsAppDialog lead={waOpen ? c : null} onClose={() => setWaOpen(false)} onSent={load} />
    </Box>
  )
}
