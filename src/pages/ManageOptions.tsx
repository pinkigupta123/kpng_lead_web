import { useRef, useState } from 'react'
import {
  Box, Button, ButtonBase, Card, CircularProgress, IconButton, List, ListItem, Switch, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { brand } from '../theme'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import { useLeadOptions } from '../hooks/useLeadOptions'
import type { LeadOption, OptionType } from '../types'

const GROUPS: { value: OptionType; label: string }[] = [
  { value: 'lead_source', label: 'Lead source' },
  { value: 'designation', label: 'Designation' },
  { value: 'card_provider', label: 'Card provider' },
  { value: 'upi_provider', label: 'UPI provider' },
  { value: 'finance_provider', label: 'Finance provider' },
  { value: 'order_offer', label: 'Order offers' },
]

/** Super admin: add / rename / hide / delete the values shown in dropdowns. */
export default function ManageOptions() {
  const { notify, confirm } = useFeedback()
  const { options, loading, reload } = useLeadOptions(true)
  const [type, setType] = useState<OptionType>('lead_source')
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const run = async (fn: () => Promise<unknown>, fail: string) => {
    try { await fn(); await reload() } catch (e) { notify(errMsg(e, fail), 'error') }
  }

  const add = () => !label.trim() ? inputRef.current?.focus() : run(async () => { await api.post('/lead/options', { type, label: label.trim() }); setLabel('') }, 'Failed to add option')
  const rename = (o: LeadOption) => editLabel.trim() && run(async () => { await api.put(`/lead/options/${o.id}`, { label: editLabel.trim() }); setEditId(null) }, 'Failed to rename option')
  const toggle = (o: LeadOption) => run(() => api.put(`/lead/options/${o.id}`, { is_active: !o.is_active }), 'Failed to update option')
  const remove = async (o: LeadOption) => {
    if (!(await confirm(`Remove "${o.label}"?`, 'It disappears from the dropdown. Existing records keep their saved value.', 'Remove', true))) return
    run(() => api.delete(`/lead/options/${o.id}`), 'Failed to delete option')
  }

  const list = options[type] || []

  const current = GROUPS.find((g) => g.value === type)!

  return (
    <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* left: groups */}
      <Card sx={{ width: { md: 260 }, flexShrink: 0, p: 1, alignSelf: 'stretch', overflow: 'auto' }}>
        <Typography variant="overline" sx={{ px: 1.5, color: 'text.secondary', display: 'block', mt: 0.5 }}>Dropdown lists</Typography>
        {GROUPS.map((g) => {
          const active = g.value === type
          return (
            <ButtonBase key={g.value} onClick={() => { setType(g.value); setEditId(null); setLabel('') }}
              sx={{ width: '100%', justifyContent: 'space-between', px: 1.5, py: 1.1, my: 0.25, borderRadius: 1.5, textAlign: 'left',
                bgcolor: active ? brand.tint : 'transparent', color: active ? 'primary.main' : 'text.primary', fontWeight: active ? 700 : 600, fontSize: '0.88rem',
                '&:hover': { bgcolor: active ? brand.tint : 'action.hover' } }}>
              {g.label}
              <Box component="span" sx={{ px: 0.9, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, textAlign: 'center',
                bgcolor: active ? '#fff' : 'action.hover', color: active ? 'primary.main' : 'text.secondary' }}>{(options[g.value] || []).length}</Box>
            </ButtonBase>
          )
        })}
      </Card>

      {/* right: the selected list, fills the rest */}
      <Card sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mr: 'auto' }}>{current.label}</Typography>
          <TextField size="small" inputRef={inputRef} placeholder={`New ${current.label.toLowerCase()}`} value={label} sx={{ width: { xs: '100%', sm: 320 } }}
            onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={add}>Add</Button>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
          {loading ? <Box sx={{ p: 3 }}><CircularProgress /></Box> : list.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>Nothing here yet — type a name above and press Add.</Typography>
          ) : (
            <List disablePadding>
              {list.map((o) => (
                <ListItem key={o.id} divider sx={{ gap: 1, px: 0 }}>
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
        </Box>
      </Card>
    </Box>
  )
}
