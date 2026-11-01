import { useEffect, useMemo, useState } from 'react'
import {
  Box, Button, Drawer, IconButton, InputAdornment, MenuItem, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import ShareIcon from '@mui/icons-material/Share'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../store/auth'
import { STATUSES, statusLabel, type Customer, type User } from '../types'
import StatusChip from '../components/StatusChip'
import PageHeader from '../components/PageHeader'
import LeadForm from './LeadForm'
import ShareLeadDialog, { type ShareLead } from '../components/ShareLeadDialog'
import WhatsAppDialog from '../components/WhatsAppDialog'

export default function Leads() {
  const nav = useNavigate()
  const admin = useAuth((s) => s.user?.role === 'super_admin')
  const [rows, setRows] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(15)
  const [page, setPage] = useState(0) // zero-based for MUI
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('desc')
  const [execId, setExecId] = useState('')
  const [branch, setBranch] = useState('')
  const [branchNames, setBranchNames] = useState<string[]>([])
  const [execs, setExecs] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [panel, setPanel] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  const [share, setShare] = useState<{ lead: ShareLead; created: boolean } | null>(null)
  const [wa, setWa] = useState<Customer | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!admin) return
    api.get('/lead/executives').then((r) => {
      const l = r.data?.data || r.data
      setExecs(Array.isArray(l) ? l : [])
    }).catch(() => {})
    api.get('/branches').then((r) => {
      let l: any = r.data
      while (l && !Array.isArray(l) && l.data) l = l.data
      setBranchNames((Array.isArray(l) ? l : []).map((b: any) => b?.name).filter(Boolean))
    }).catch(() => {})
  }, [admin])

  // branch options = branches table + any branch an executive belongs to
  const branches = useMemo(() => {
    const set = new Set<string>(branchNames)
    execs.forEach((e) => e.branch && set.add(e.branch))
    return [...set].sort()
  }, [branchNames, execs])

  // executives shown depend on the selected branch
  const execOptions = useMemo(() => execs.filter((e) => !branch || e.branch === branch), [execs, branch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get('/lead/customers', {
        params: {
          page: page + 1,
          search: debounced || undefined,
          status: status !== 'all' ? status : undefined,
          sort,
          executive_id: execId || undefined,
          branch: branch || undefined,
        },
      })
      .then((r) => {
        if (cancelled) return
        setRows(r.data.data)
        setTotal(r.data.total ?? r.data.data.length)
        if (r.data.per_page) setPerPage(r.data.per_page)
      })
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [page, debounced, status, sort, execId, branch, reload])

  const reset = <T,>(set: (v: T) => void) => (v: T) => { setPage(0); set(v) }

  const onCreated = (id?: number, opts?: { existing?: boolean; lead?: ShareLead }) => {
    setPanel(false)
    if (editId != null) return setReload((n) => n + 1)
    if (opts?.existing && id) return nav(`/leads/${id}`)
    setPage(0)
    setReload((n) => n + 1)
    // offer to send the welcome message straight away
    if (opts?.lead) setShare({ lead: opts.lead, created: true })
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Leads"
        action={
          <>
        <TextField
          size="small" placeholder="Search leads…" value={search}
          onChange={(e) => reset(setSearch)(e.target.value)} sx={{ width: 190 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
        />
        <TextField select size="small" label="Status" value={status} onChange={(e) => reset(setStatus)(e.target.value)} sx={{ width: 150 }}>
          <MenuItem value="all">All</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
        </TextField>
        {admin && (
          <>
            <TextField select size="small" label="Branch" value={branch} onChange={(e) => { reset(setBranch)(e.target.value); setExecId('') }} sx={{ width: 170 }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
              <MenuItem value="">All branches</MenuItem>
              {branches.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Executive" value={execId} onChange={(e) => reset(setExecId)(e.target.value)} sx={{ width: 180 }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
              <MenuItem value="">All executives</MenuItem>
              {execOptions.map((x) => <MenuItem key={x.id} value={String(x.id)}>{x.name}</MenuItem>)}
            </TextField>
          </>
        )}
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => reset(setSort)(e.target.value)} sx={{ width: 140 }}>
          <MenuItem value="desc">Latest first</MenuItem>
          <MenuItem value="asc">Oldest first</MenuItem>
        </TextField>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditId(null); setPanel(true) }}>Add lead</Button>
          </>
        }
      />

      <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 380, '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': { borderBottom: 0 } }}>
        <TableContainer sx={{ flex: 1, minHeight: 0, opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Mobile</TableCell><TableCell>Company / City</TableCell>
                <TableCell>Interested in</TableCell><TableCell>Status</TableCell><TableCell>Follow-up</TableCell>
                {admin && <TableCell>Executive</TableCell>}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => nav(`/leads/${c.id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell>{c.mobile}</TableCell>
                  <TableCell>{[c.company, c.city].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell>{c.interested_product || '—'}</TableCell>
                  <TableCell><StatusChip status={c.status} /></TableCell>
                  <TableCell>{c.followup_date ? String(c.followup_date).slice(0, 10) : '—'}</TableCell>
                  {admin && <TableCell>{c.executive?.name || '—'}</TableCell>}
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Share"><IconButton size="small" onClick={() => setWa(c)}><ShareIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="View"><IconButton size="small" onClick={() => nav(`/leads/${c.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditId(c.id); setPanel(true) }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && !loading && (
                <TableRow><TableCell colSpan={admin ? 8 : 7} align="center" sx={{ py: 8, color: 'text.secondary' }}>No leads found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5 }}>
          <Typography variant="body2" color="text.secondary">Total: <b>{total}</b> lead{total === 1 ? '' : 's'}</Typography>
          <TablePagination component="div" count={total} page={page} rowsPerPage={perPage} rowsPerPageOptions={[perPage]} onPageChange={(_, p) => setPage(p)} />
        </Box>
      </Paper>

      <WhatsAppDialog lead={wa} onClose={() => setWa(null)} onSent={() => setReload((n) => n + 1)} />
      <ShareLeadDialog lead={share?.lead ?? null} created={share?.created} onClose={() => setShare(null)} />

      {/* Add lead — right-hand side panel */}
      <Drawer anchor="right" open={panel} onClose={() => setPanel(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 }, p: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, height: 65, borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <Typography variant="h6">{editId != null ? 'Edit lead' : 'Add lead'}</Typography>
          <IconButton onClick={() => setPanel(false)}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ p: 3, overflowY: 'auto' }}>
          {panel && <LeadForm key={editId ?? 'new'} embedded leadId={editId ?? undefined} onDone={onCreated} onCancel={() => setPanel(false)} />}
        </Box>
      </Drawer>
    </Box>
  )
}
