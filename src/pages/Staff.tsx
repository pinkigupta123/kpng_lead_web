import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ShareIcon from '@mui/icons-material/Share'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import StatusChip from '../components/StatusChip'
import PageHeader from '../components/PageHeader'
import StaffForm from './StaffForm'
import type { User } from '../types'

export interface Creds { name?: string; employeeId: string; username: string; password: string }

export function credsMessage(c: Creds) {
  return `Hello ${c.name ?? ''},\n\nYour Customer Lead Manager account has been created.\n\nUsername:\n${c.username}\n\nTemporary Password:\n${c.password}\n\nPlease login and change your password.\n\nThank you.`
}

export function CredsDialog({ creds, onClose }: { creds: Creds | null; onClose: () => void }) {
  if (!creds) return null
  const digits = creds.username.replace(/\D/g, '')
  const wa = `https://wa.me/${digits.length === 10 ? '91' + digits : digits}?text=${encodeURIComponent(credsMessage(creds))}`
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Login credentials</DialogTitle>
      <DialogContent>
        <Typography>Employee ID: <b>{creds.employeeId}</b></Typography>
        <Typography>Username: <b>{creds.username}</b></Typography>
        <Typography>Temporary password: <b>{creds.password}</b></Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Share these with the executive. They must change the password on first login.</Typography>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard?.writeText(credsMessage(creds))}>Copy</Button>
        <Button
          startIcon={<ShareIcon />}
          onClick={() => (navigator.share ? navigator.share({ text: credsMessage(creds) }).catch(() => {}) : navigator.clipboard?.writeText(credsMessage(creds)))}
        >
          Share
        </Button>
        <Button color="success" startIcon={<WhatsAppIcon />} href={wa} target="_blank" rel="noopener">WhatsApp</Button>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Staff() {
  const { notify, confirm } = useFeedback()
  const [rows, setRows] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [branch, setBranch] = useState('')
  const [branchNames, setBranchNames] = useState<string[]>([])
  const [creds, setCreds] = useState<Creds | null>(null)
  const [form, setForm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    api.get('/lead/executives', { params: debounced ? { search: debounced } : {} })
      .then((r) => {
        const l = r.data?.data || r.data
        setRows(Array.isArray(l) ? l : [])
      })
      .catch(() => notify('Failed to load sales executives', 'error'))
  }, [debounced, notify])

  useEffect(load, [load])

  useEffect(() => {
    api.get('/branches').then((r) => {
      let l: any = r.data
      while (l && !Array.isArray(l) && l.data) l = l.data
      setBranchNames((Array.isArray(l) ? l : []).map((b: any) => b?.name).filter(Boolean))
    }).catch(() => {})
  }, [])

  const branches = useMemo(() => {
    const set = new Set<string>(branchNames)
    rows.forEach((r) => r.branch && set.add(r.branch))
    return [...set].sort()
  }, [branchNames, rows])

  const visible = useMemo(() => rows.filter((r) => !branch || r.branch === branch), [rows, branch])

  const toggle = async (x: User) => {
    const next = x.status === 'active' ? 'inactive' : 'active'
    const label = next === 'inactive' ? 'Deactivate' : 'Activate'
    if (!(await confirm(`${label} executive`, `${label} ${x.name}?`, label, next === 'inactive'))) return
    try {
      await api.put(`/lead/executives/${x.id}`, { ...x, status: next })
      notify(`Executive ${label.toLowerCase()}d`)
      load()
    } catch (e) { notify(errMsg(e, 'Failed to update status'), 'error') }
  }

  const shareCreds = (x: User) =>
    setCreds({ name: x.name, employeeId: x.employee_id, username: x.mobile, password: x.temp_password || '' })

  const resetPwd = async (x: User) => {
    if (!(await confirm('Reset password', `Reset password for ${x.name}?`, 'Reset'))) return
    try {
      const r = await api.post('/lead/executives/reset-password', { id: x.id })
      setCreds({ name: x.name, employeeId: r.data.employee_id, username: r.data.username, password: r.data.password })
      load()
    } catch (e) { notify(errMsg(e, 'Failed to reset password'), 'error') }
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Staff"
        action={
          <>
            <TextField select size="small" label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} sx={{ width: 180 }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
              <MenuItem value="">All branches</MenuItem>
              {branches.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
            <TextField size="small" placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ open: true, id: null })}>Add executive</Button>
          </>
        }
      />
      <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 380, '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': { borderBottom: 0 } }}>
        <TableContainer sx={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Employee ID</TableCell><TableCell>Mobile</TableCell>
                <TableCell>Branch</TableCell><TableCell>Designation</TableCell><TableCell>Status</TableCell>
                <TableCell>Temp password</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((x) => (
                <TableRow key={x.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{x.name}</TableCell>
                  <TableCell>{x.employee_id}</TableCell>
                  <TableCell>{x.mobile}</TableCell>
                  <TableCell>{x.branch}</TableCell>
                  <TableCell>{x.designation || '—'}</TableCell>
                  <TableCell><StatusChip status={x.status} /></TableCell>
                  <TableCell>{x.temp_password || '—'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {x.temp_password && (
                      <Tooltip title="Share login credentials">
                        <IconButton size="small" onClick={() => shareCreds(x)}><ShareIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => setForm({ open: true, id: x.id })}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Reset password"><IconButton size="small" onClick={() => resetPwd(x)}><LockResetIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={x.status === 'active' ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small" onClick={() => toggle(x)}>{x.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}</IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No staff found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', px: 2.5, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Total: <b>{visible.length}</b> sales executive{visible.length === 1 ? '' : 's'}</Typography>
        </Box>
      </Paper>
      <StaffForm
        open={form.open}
        executiveId={form.id}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        onSaved={(c) => {
          setForm((f) => ({ ...f, open: false }))
          load()
          if (c) setCreds(c) // new executive: show credentials to copy / share
        }}
      />
      <CredsDialog creds={creds} onClose={() => setCreds(null)} />
    </Box>
  )
}
