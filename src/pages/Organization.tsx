import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Chip, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'

interface Company {
  id: number; name: string; code: string; address: string; city: string; state: string; pincode: string; phone: string
  email?: string | null; gstin?: string | null; pan?: string | null; is_active: boolean; branches_count?: number
}
interface Branch {
  id: number; company_id: number; name: string; code: string; address?: string | null; city?: string | null; state?: string | null
  pincode?: string | null; phone?: string | null; email?: string | null; is_active: boolean; company?: { id: number; name: string; code: string }
}

const blankCompany = { name: '', code: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', gstin: '', pan: '' }
const blankBranch = { company_id: '' as number | '', name: '', code: '', address: '', city: '', state: '', pincode: '', phone: '', email: '' }

function Status({ active }: { active: boolean }) {
  return <Chip size="small" label={active ? 'Active' : 'Inactive'} color={active ? 'success' : 'default'} variant="outlined" sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem' }} />
}

export default function Organization() {
  const { notify, confirm } = useFeedback()
  const [tab, setTab] = useState(0)
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [search, setSearch] = useState('')
  const [cForm, setCForm] = useState<{ id: number | null; v: typeof blankCompany } | null>(null)
  const [bForm, setBForm] = useState<{ id: number | null; v: typeof blankBranch } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('')
    try {
      const [c, b] = await Promise.all([api.get('/lead/org/companies'), api.get('/lead/org/branches')])
      setCompanies(c.data); setBranches(b.data)
    } catch (e) { setLoadErr(errMsg(e, 'Failed to load')) } finally { setLoading(false) }
  }, [notify])
  useEffect(() => { load() }, [load])

  const q = search.trim().toLowerCase()
  const cRows = useMemo(() => companies.filter((c) => !q || `${c.name} ${c.code} ${c.city}`.toLowerCase().includes(q)), [companies, q])
  const bRows = useMemo(() => branches.filter((b) => !q || `${b.name} ${b.code} ${b.city ?? ''} ${b.company?.name ?? ''}`.toLowerCase().includes(q)), [branches, q])

  const apiErrors = (e: any) => {
    const fe = e?.response?.data?.errors
    if (fe) setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, (v as string[])[0]])))
    else notify(errMsg(e, 'Could not save'), 'error')
  }

  const saveCompany = async () => {
    if (!cForm) return
    setSaving(true); setErrors({})
    try {
      if (cForm.id) await api.put(`/lead/org/companies/${cForm.id}`, cForm.v)
      else await api.post('/lead/org/companies', cForm.v)
      notify(cForm.id ? 'Company updated' : 'Company created — now add its branches'); setCForm(null); load()
    } catch (e) { apiErrors(e) } finally { setSaving(false) }
  }
  const saveBranch = async () => {
    if (!bForm) return
    setSaving(true); setErrors({})
    try {
      if (bForm.id) await api.put(`/lead/org/branches/${bForm.id}`, bForm.v)
      else await api.post('/lead/org/branches', bForm.v)
      notify(bForm.id ? 'Branch updated' : 'Branch created'); setBForm(null); load()
    } catch (e) { apiErrors(e) } finally { setSaving(false) }
  }
  const toggle = async (kind: 'companies' | 'branches', row: Company | Branch) => {
    const next = !row.is_active
    if (!next && !(await confirm(`Deactivate ${row.name}?`, 'It stays in the system but can no longer be picked for new staff or jobs.', 'Deactivate', true))) return
    try { await api.patch(`/lead/org/${kind}/${row.id}/status`, { is_active: next }); notify(next ? 'Activated' : 'Deactivated'); load() }
    catch (e) { notify(errMsg(e, 'Could not update'), 'error') }
  }

  const field = (key: string, label: string, v: any, set: (x: string) => void, opts: { required?: boolean; span?: boolean; placeholder?: string; upper?: boolean } = {}) => (
    <TextField size="small" label={opts.required ? `${label} *` : label} value={v ?? ''} placeholder={opts.placeholder}
      onChange={(e) => set(opts.upper ? e.target.value.toUpperCase() : e.target.value)} error={!!errors[key]} helperText={errors[key]}
      sx={opts.span ? { gridColumn: '1 / -1' } : undefined} />
  )

  const tabLabel = (text: string, n: number) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {text}
      <Box component="span" sx={{ px: 0.9, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>{n}</Box>
    </Box>
  )

  const head = (cols: string[]) => <TableHead><TableRow>{cols.map((c, i) => <TableCell key={c} align={i === cols.length - 1 ? 'right' : 'left'}>{c}</TableCell>)}</TableRow></TableHead>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5, flexWrap: 'wrap' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch('') }} sx={{ minHeight: 44 }}>
          <Tab label={tabLabel('Companies', companies.length)} />
          <Tab label={tabLabel('Branches', branches.length)} />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <TextField size="small" placeholder={tab === 1 ? 'Search branches…' : 'Search companies…'} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
        {tab === 1
          ? <Button variant="contained" startIcon={<AddIcon />} onClick={() => { if (!companies.some((c) => c.is_active)) { notify('Create a company first — a branch belongs to a company.', 'info'); setTab(0); return } setErrors({}); setBForm({ id: null, v: { ...blankBranch, company_id: companies.find((c) => c.is_active)?.id ?? '' } }) }}>Add branch</Button>
          : <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setErrors({}); setCForm({ id: null, v: { ...blankCompany } }) }}>Add company</Button>}
      </Box>

      <Paper sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1 }}>
          {tab === 1 ? (
            <Table stickyHeader size="small">
              {head(['Branch', 'Code', 'Company', 'City', 'Phone', 'Status', 'Actions'])}
              <TableBody>
                {bRows.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{b.name}</TableCell>
                    <TableCell>{b.code}</TableCell>
                    <TableCell>{b.company?.name ?? '—'}</TableCell>
                    <TableCell>{b.city || '—'}</TableCell>
                    <TableCell>{b.phone || '—'}</TableCell>
                    <TableCell><Status active={b.is_active} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => { setErrors({}); setBForm({ id: b.id, v: { company_id: b.company_id, name: b.name, code: b.code ?? '', address: b.address ?? '', city: b.city ?? '', state: b.state ?? '', pincode: b.pincode ?? '', phone: b.phone ?? '', email: b.email ?? '' } }) }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={b.is_active ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => toggle('branches', b)}>{b.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" color="success" />}</IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table stickyHeader size="small">
              {head(['Company', 'Code', 'GSTIN', 'City', 'Phone', 'Branches', 'Status', 'Actions'])}
              <TableBody>
                {cRows.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell>{c.gstin || '—'}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.branches_count ?? 0}</TableCell>
                    <TableCell><Status active={c.is_active} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => { setErrors({}); setCForm({ id: c.id, v: { name: c.name, code: c.code, address: c.address, city: c.city, state: c.state, pincode: c.pincode, phone: c.phone, email: c.email ?? '', gstin: c.gstin ?? '', pan: c.pan ?? '' } }) }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={c.is_active ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => toggle('companies', c)}>{c.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" color="success" />}</IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {loading && <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>}
          {loadErr && <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error" sx={{ mb: 1 }}>{loadErr}</Typography><Button variant="outlined" onClick={load}>Retry</Button></Box>}
          {!loading && !loadErr && (tab === 1 ? bRows : cRows).length === 0 && <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>{tab === 1 ? (companies.length ? 'No branches yet — add the first one.' : 'Create a company first, then add its branches.') : 'No companies yet — add the first one.'}</Typography>}
        </TableContainer>
        <Box sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">Shared with KPNG Technology — anything added here appears there too.</Typography>
        </Box>
      </Paper>

      {/* company dialog */}
      <Dialog open={!!cForm} onClose={() => !saving && setCForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>{cForm?.id ? 'Edit company' : 'Add company'}</DialogTitle>
        <DialogContent>
          {cForm && (() => { const set = (k: keyof typeof blankCompany) => (x: string) => setCForm({ ...cForm, v: { ...cForm.v, [k]: x } }); const v = cForm.v; return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
              {field('name', 'Company name', v.name, set('name'), { required: true })}
              {field('code', 'Code (short, e.g. HTC)', v.code, set('code'), { required: true, upper: true })}
              {field('address', 'Address', v.address, set('address'), { required: true, span: true })}
              {field('city', 'City', v.city, set('city'), { required: true })}
              {field('state', 'State', v.state, set('state'), { required: true })}
              {field('pincode', 'Pincode', v.pincode, set('pincode'), { required: true })}
              {field('phone', 'Phone', v.phone, set('phone'), { required: true })}
              {field('email', 'Email', v.email, set('email'))}
              {field('gstin', 'GSTIN', v.gstin, set('gstin'), { upper: true })}
              {field('pan', 'PAN', v.pan, set('pan'), { upper: true })}
            </Box>) })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={saveCompany} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button variant="outlined" onClick={() => setCForm(null)} disabled={saving}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* branch dialog */}
      <Dialog open={!!bForm} onClose={() => !saving && setBForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>{bForm?.id ? 'Edit branch' : 'Add branch'}</DialogTitle>
        <DialogContent>
          {bForm && (() => { const set = (k: keyof typeof blankBranch) => (x: string) => setBForm({ ...bForm, v: { ...bForm.v, [k]: x } }); const v = bForm.v; return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
              <TextField select size="small" label="Company *" value={v.company_id} onChange={(e) => setBForm({ ...bForm, v: { ...v, company_id: Number(e.target.value) } })} error={!!errors.company_id} helperText={errors.company_id}>
                {companies.filter((c) => c.is_active || c.id === v.company_id).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              {field('name', 'Branch name', v.name, set('name'), { required: true })}
              {field('code', 'Code', v.code, set('code'), { placeholder: 'Auto if blank', upper: true })}
              {field('phone', 'Phone', v.phone, set('phone'), { placeholder: 'Company phone if blank' })}
              {field('address', 'Address', v.address, set('address'), { span: true, placeholder: 'Company address if blank' })}
              {field('city', 'City', v.city, set('city'))}
              {field('state', 'State', v.state, set('state'))}
              {field('pincode', 'Pincode', v.pincode, set('pincode'))}
              {field('email', 'Email', v.email, set('email'))}
            </Box>) })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={saveBranch} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button variant="outlined" onClick={() => setBForm(null)} disabled={saving}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
