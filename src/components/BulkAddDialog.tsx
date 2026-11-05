import { useState } from 'react'
import { Alert, Box, Button, Drawer, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import api, { errMsg } from '../api/client'
import { useLeadOptions } from '../hooks/useLeadOptions'
import type { BulkAddResult } from '../types'

interface Row { name: string; mobile: string; email: string; source: string }
const emptyRow = (): Row => ({ name: '', mobile: '', email: '', source: '' })
const MAX_ROWS = 100

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

/** Right-hand side panel to add many leads at once: mobile is required, the rest optional. */
export default function BulkAddDialog({ open, onClose, onSaved }: Props) {
  const { options } = useLeadOptions()
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BulkAddResult | null>(null)

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const remove = (i: number) => setRows((r) => (r.length === 1 ? [emptyRow()] : r.filter((_, idx) => idx !== i)))
  const close = () => { setRows([emptyRow()]); setError(''); setResult(null); onClose() }

  const submit = async () => {
    setError('')
    const filled = rows.filter((r) => r.name.trim() || r.mobile.trim() || r.email.trim())
    if (!filled.length) return setError('Enter at least one mobile number.')
    const bad = filled.find((r) => !/^[0-9]{10}$/.test(r.mobile.trim()))
    if (bad) return setError(`Customer ${rows.indexOf(bad) + 1}: enter a valid 10-digit mobile number.`)

    setSaving(true)
    try {
      const r = await api.post('/lead/customers/bulk', {
        customers: filled.map((x) => ({ name: x.name.trim(), mobile: x.mobile.trim(), email: x.email.trim() || null, lead_source: x.source || null })),
      })
      setResult(r.data)
      if (r.data.created > 0) onSaved()
    } catch (e) {
      setError(errMsg(e, 'Failed to save leads'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : close}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 520 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, height: 65, borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Typography variant="h6">Add multiple leads</Typography>
        <IconButton onClick={close} disabled={saving}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {result ? (
          <Box>
            <Typography variant="h6">{result.created} lead(s) added</Typography>
            {result.duplicates.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>Already registered (skipped): {result.duplicates.map((d) => d.mobile).join(', ')}</Alert>
            )}
            {result.failed.map((f) => (
              <Alert key={f.row} severity="error" sx={{ mt: 1 }}>Customer {f.row}: {f.error}</Alert>
            ))}
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {rows.map((row, i) => (
              <Box key={i} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">Customer {i + 1}</Typography>
                  <IconButton size="small" onClick={() => remove(i)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField size="small" label="Name" value={row.name} onChange={(e) => update(i, { name: e.target.value })} />
                  <TextField size="small" label="Mobile *" value={row.mobile}
                    onChange={(e) => update(i, { mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} />
                  <TextField size="small" label="Email" type="email" value={row.email} onChange={(e) => update(i, { email: e.target.value })} />
                  <TextField select size="small" label="Lead came from" value={row.source} onChange={(e) => update(i, { source: e.target.value })}>
                    <MenuItem value="">—</MenuItem>
                    {options.lead_source.map((o) => <MenuItem key={o.id} value={o.label}>{o.label}</MenuItem>)}
                  </TextField>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button startIcon={<AddIcon />} onClick={() => setRows((r) => (r.length >= MAX_ROWS ? r : [...r, emptyRow()]))} disabled={rows.length >= MAX_ROWS}>
                Add another customer
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 1, flexShrink: 0 }}>
        {result ? (
          <Button variant="contained" onClick={close}>Done</Button>
        ) : (
          <>
            <Button onClick={close} disabled={saving}>Cancel</Button>
            <Button variant="contained" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save leads'}</Button>
          </>
        )}
      </Box>
    </Drawer>
  )
}
