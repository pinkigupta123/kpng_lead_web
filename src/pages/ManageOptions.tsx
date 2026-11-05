import { useState } from 'react'
import {
  Box, Button, Card, CircularProgress, IconButton, List, ListItem, Switch, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import api, { errMsg } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useFeedback } from '../components/Feedback'
import { useLeadOptions } from '../hooks/useLeadOptions'
import type { LeadOption, OptionType } from '../types'

const GROUPS: { value: OptionType; label: string }[] = [
  { value: 'lead_source', label: 'Lead source' },
  { value: 'designation', label: 'Designation' },
]

/** Super admin: add / rename / hide / delete the values shown in dropdowns. */
export default function ManageOptions() {
  const { notify } = useFeedback()
  const { options, loading, reload } = useLeadOptions(true)
  const [type, setType] = useState<OptionType>('lead_source')
  const [label, setLabel] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const run = async (fn: () => Promise<unknown>, fail: string) => {
    try { await fn(); await reload() } catch (e) { notify(errMsg(e, fail), 'error') }
  }

  const add = () => label.trim() && run(async () => { await api.post('/lead/options', { type, label: label.trim() }); setLabel('') }, 'Failed to add option')
  const rename = (o: LeadOption) => editLabel.trim() && run(async () => { await api.put(`/lead/options/${o.id}`, { label: editLabel.trim() }); setEditId(null) }, 'Failed to rename option')
  const toggle = (o: LeadOption) => run(() => api.put(`/lead/options/${o.id}`, { is_active: !o.is_active }), 'Failed to update option')
  const remove = (o: LeadOption) => {
    if (!window.confirm(`Remove "${o.label}" from the dropdown? Existing records keep their saved value.`)) return
    run(() => api.delete(`/lead/options/${o.id}`), 'Failed to delete option')
  }

  const list = options[type] || []

  return (
    <Box>
      <PageHeader title="Manage dropdowns" />
      <Card sx={{ maxWidth: 640, p: 2 }}>
        <Tabs value={type} onChange={(_, v) => { setType(v); setEditId(null) }} sx={{ mb: 2 }}>
          {GROUPS.map((g) => <Tab key={g.value} value={g.value} label={g.label} />)}
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField size="small" fullWidth label={`New ${GROUPS.find((g) => g.value === type)?.label.toLowerCase()}`} value={label}
            onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button variant="contained" onClick={add} disabled={!label.trim()}>Add</Button>
        </Box>

        {loading ? <CircularProgress /> : list.length === 0 ? (
          <Typography color="text.secondary">No options yet.</Typography>
        ) : (
          <List disablePadding>
            {list.map((o) => (
              <ListItem key={o.id} divider sx={{ gap: 1 }}>
                {editId === o.id ? (
                  <>
                    <TextField size="small" fullWidth autoFocus value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && rename(o)} />
                    <IconButton onClick={() => rename(o)}><CheckIcon /></IconButton>
                    <IconButton onClick={() => setEditId(null)}><CloseIcon /></IconButton>
                  </>
                ) : (
                  <>
                    <Typography sx={{ flex: 1, fontWeight: 600, opacity: o.is_active ? 1 : 0.45 }}>
                      {o.label}{!o.is_active ? ' (hidden)' : ''}
                    </Typography>
                    <Tooltip title={o.is_active ? 'Visible in dropdown' : 'Hidden from dropdown'}>
                      <Switch checked={o.is_active} onChange={() => toggle(o)} />
                    </Tooltip>
                    <IconButton onClick={() => { setEditId(o.id); setEditLabel(o.label) }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => remove(o)}><DeleteIcon fontSize="small" /></IconButton>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Box>
  )
}
