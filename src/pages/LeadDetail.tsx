import { useCallback, useEffect, useState } from 'react'
import {
  Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  MenuItem, TextField, Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import EditIcon from '@mui/icons-material/Edit'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EventIcon from '@mui/icons-material/Event'
import { useNavigate, useParams } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import StatusChip from '../components/StatusChip'
import WhatsAppDialog from '../components/WhatsAppDialog'
import { STATUSES, type Customer, type CustomerStatus } from '../types'

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{value || '—'}</Typography>
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
  const [fuStatus, setFuStatus] = useState<CustomerStatus>('follow-up')

  const [waOpen, setWaOpen] = useState(false)

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

  const saveFollowup = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fuDate)) return notify('Choose a valid follow-up date', 'error')
    try {
      await api.post(`/lead/customers/${c.id}/follow-up`, {
        followup_date: fuDate,
        remarks: fuRemarks || 'Scheduled next follow-up',
        status: fuStatus,
      })
      setFuOpen(false)
      notify('Follow-up updated')
      load()
    } catch (e) { notify(errMsg(e, 'Failed to update follow-up'), 'error') }
  }

  const timeline = [...(c.timelines ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{c.name}</Typography>
        <StatusChip status={c.status} />
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<WhatsAppIcon />} color="success" variant="outlined" onClick={() => setWaOpen(true)}>WhatsApp</Button>
        <Button startIcon={<EventIcon />} variant="outlined" onClick={() => { setFuDate(tomorrow()); setFuRemarks(''); setFuStatus('follow-up'); setFuOpen(true) }}>Follow-up</Button>
        <Button startIcon={<EditIcon />} variant="contained" onClick={() => nav(`/leads/${c.id}/edit`)}>Edit</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Info label="Mobile" value={c.mobile} />
              <Info label="Email" value={c.email} />
              <Info label="Company" value={c.company} />
              <Info label="City" value={c.city} />
              <Info label="Interested product" value={c.interested_product} />
              <Info label="Device" value={[c.device_brand, c.device_model].filter(Boolean).join(' ')} />
              <Info label="Follow-up date" value={c.followup_date && String(c.followup_date).slice(0, 10)} />
              <Info label="Assigned to" value={c.executive?.name} />
              <Grid size={12}><Divider /></Grid>
              <Info label="Customer query" value={c.customer_query} />
              <Info label="Notes" value={c.notes} />
            </Grid>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', maxHeight: { xs: 420, lg: 560 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>Timeline</Typography>
            <Box sx={{ overflowY: 'auto', pr: 1, mt: 1, flex: 1, minHeight: 0 }}>
            {!timeline.length && <Typography color="text.secondary">No activity yet.</Typography>}
            {timeline.map((t) => (
              <Box key={t.id} sx={{ borderLeft: '3px solid #2F4A6D', pl: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{t.action}</Typography>
                {t.remarks && <Typography variant="body2">{t.remarks}</Typography>}
                <Typography variant="caption" color="text.secondary">
                  {new Date(t.created_at).toLocaleString()}{t.creator ? ` · ${t.creator.name}` : ''}
                </Typography>
              </Box>
            ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={fuOpen} onClose={() => setFuOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Schedule follow-up</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField type="date" label="Next follow-up date" value={fuDate} onChange={(e) => setFuDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: new Date().toISOString().slice(0, 10) } }} />
          <TextField select label="Status" value={fuStatus} onChange={(e) => setFuStatus(e.target.value as CustomerStatus)}>
            {STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Remarks" multiline minRows={3} value={fuRemarks} onChange={(e) => setFuRemarks(e.target.value)} placeholder="Details of today's conversation..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFuOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveFollowup}>Save</Button>
        </DialogActions>
      </Dialog>

      <WhatsAppDialog lead={waOpen ? c : null} onClose={() => setWaOpen(false)} onSent={load} />
    </Box>
  )
}
