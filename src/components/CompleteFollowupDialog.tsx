import { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import api, { errMsg } from '../api/client'
import { useFeedback } from './Feedback'
import { STATUSES, statusLabel } from '../types'
import { localDate } from '../dates'

export interface CompleteTarget {
  id: number
  scheduled_for: string
  customerName?: string
  /** the lead's current status, pre-selected in the dialog */
  status?: string
}

/** "Mark follow-up done": outcome note, optional status change, optional next follow-up date. */
export default function CompleteFollowupDialog({ target, onClose, onDone }: { target: CompleteTarget | null; onClose: () => void; onDone: () => void }) {
  const { notify } = useFeedback()
  const [outcome, setOutcome] = useState('')
  const [status, setStatus] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (target) {
      setOutcome('')
      setStatus(target.status ?? '')
      setNext('')
    }
  }, [target])

  if (!target) return null

  const save = async () => {
    setSaving(true)
    try {
      await api.post(`/lead/followups/${target.id}/complete`, {
        outcome: outcome.trim() || undefined,
        status: status && status !== target.status ? status : undefined, // only send a real change
        next_followup_date: next || undefined,
      })
      notify('Follow-up marked as done')
      onDone()
      onClose()
    } catch (e) {
      notify(errMsg(e, 'Could not complete the follow-up'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const today = localDate()

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0.5 }}>
        Mark follow-up done
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          {target.customerName ? `${target.customerName} · ` : ''}scheduled for {target.scheduled_for}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
        <TextField label="What happened? (outcome)" multiline minRows={3} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. Called, customer will visit on Saturday" autoFocus />
        <TextField select label="Lead status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
        </TextField>
        <TextField type="date" label="Next follow-up (optional)" value={next} onChange={(e) => setNext(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" color="success" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Mark done'}</Button>
      </DialogActions>
    </Dialog>
  )
}
