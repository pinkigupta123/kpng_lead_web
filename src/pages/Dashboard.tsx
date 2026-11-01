import { useEffect, useMemo, useState, type ElementType } from 'react'
import {
  Box, Button, Card, Chip, CircularProgress, List, ListItemButton, ListItemText, MenuItem, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import PeopleIcon from '@mui/icons-material/People'
import TodayIcon from '@mui/icons-material/Today'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../store/auth'
import { STATUSES, type Customer, type User } from '../types'
import StatusChip, { STATUS_COLORS } from '../components/StatusChip'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'

type Period = 'today' | '7d' | '30d' | 'month' | 'all'
const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
]

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

function periodStart(p: Period): Date | null {
  const today = startOfDay(new Date())
  if (p === 'today') return today
  if (p === '7d') return addDays(today, -6)
  if (p === '30d') return addDays(today, -29)
  if (p === 'month') return new Date(today.getFullYear(), today.getMonth(), 1)
  return null
}

/** Fetch every lead page (the API paginates). */
async function fetchAllLeads(): Promise<Customer[]> {
  const all: Customer[] = []
  let page = 1
  let last = 1
  do {
    const r = await api.get('/lead/customers', { params: { page, per_page: 500, sort: 'desc' } })
    all.push(...(r.data.data as Customer[]))
    last = r.data.last_page ?? r.data.meta?.last_page ?? 1
    page += 1
  } while (page <= last && page < 50)
  return all
}

function Panel({ title, children, action, height }: { title: string; children: React.ReactNode; action?: React.ReactNode; height?: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>{title}</Typography>
        {action}
      </Box>
      <Box sx={{ p: 2.5, height }}>{children}</Box>
    </Card>
  )
}

const Empty = ({ text = 'No data for this selection' }: { text?: string }) => (
  <Box sx={{ height: '100%', minHeight: 120, display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">{text}</Typography></Box>
)

export default function Dashboard() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const admin = user?.role === 'super_admin'

  const [leads, setLeads] = useState<Customer[] | null>(null)
  const [execs, setExecs] = useState<User[]>([])
  const [branchNames, setBranchNames] = useState<string[]>([])
  const [error, setError] = useState('')

  const [branch, setBranch] = useState('all')
  const [exec, setExec] = useState('all')
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState<Period>('30d')

  useEffect(() => {
    fetchAllLeads().then(setLeads).catch(() => { setError('Failed to load dashboard data'); setLeads([]) })
    if (admin) {
      api.get('/lead/executives').then((r) => {
        const l = r.data?.data || r.data
        setExecs(Array.isArray(l) ? l : [])
      }).catch(() => {})
      api.get('/branches').then((r) => {
        const l = r.data?.data || r.data
        setBranchNames((Array.isArray(l) ? l : []).map((b: any) => b.name))
      }).catch(() => {})
    }
  }, [admin])

  const branchOf = (c: Customer) => c.executive?.branch || 'Unassigned'

  // dropdown options
  const branches = useMemo(() => {
    const set = new Set<string>(branchNames)
    execs.forEach((e) => e.branch && set.add(e.branch))
    leads?.forEach((l) => set.add(branchOf(l)))
    return [...set].sort()
  }, [branchNames, execs, leads])

  const execOptions = useMemo(() => {
    const map = new Map<number, User>()
    execs.forEach((e) => map.set(e.id, e))
    leads?.forEach((l) => l.executive && !map.has(l.executive.id) && map.set(l.executive.id, l.executive))
    return [...map.values()].filter((e) => branch === 'all' || e.branch === branch).sort((a, b) => a.name.localeCompare(b.name))
  }, [execs, leads, branch])

  // leads in scope (branch / executive / status) — ignoring the period
  const scoped = useMemo(
    () => (leads ?? []).filter((l) =>
      (branch === 'all' || branchOf(l) === branch) &&
      (exec === 'all' || String(l.executive_id) === exec) &&
      (status === 'all' || l.status === status)),
    [leads, branch, exec, status],
  )

  const start = periodStart(period)
  const inPeriod = useMemo(
    () => (start ? scoped.filter((l) => new Date(l.created_at) >= start) : scoped),
    [scoped, start],
  )

  const stats = useMemo(() => {
    const today0 = startOfDay(new Date())
    const todayKey = dayKey(today0)
    const yesterdayKey = dayKey(addDays(today0, -1))
    const DAY = 86400000
    const closed = (st: string) => st === 'purchased' || st === 'closed'

    const open = scoped.filter((l) => l.followup_date && !closed(l.status))
    const dueNow = open.filter((l) => String(l.followup_date).slice(0, 10) <= todayKey).length
    const overdue = open.filter((l) => String(l.followup_date).slice(0, 10) < todayKey).length
    const purchased = inPeriod.filter((l) => l.status === 'purchased').length

    // change vs the previous period of the same length
    let delta: number | null = null
    if (start) {
      const days = Math.round((today0.getTime() - start.getTime()) / DAY) + 1
      const prevStart = addDays(start, -days)
      const prev = scoped.filter((l) => { const t = new Date(l.created_at); return t >= prevStart && t < start }).length
      delta = prev ? Math.round(((inPeriod.length - prev) / prev) * 100) : null
    }

    const pipeline = scoped.filter((l) => !closed(l.status))
    return {
      total: inPeriod.length,
      delta,
      today: scoped.filter((l) => dayKey(new Date(l.created_at)) === todayKey).length,
      yesterday: scoped.filter((l) => dayKey(new Date(l.created_at)) === yesterdayKey).length,
      pipeline: pipeline.length,
      interestedOpen: pipeline.filter((l) => l.status === 'interested').length,
      purchased,
      conversion: inPeriod.length ? Math.round((purchased / inPeriod.length) * 100) : 0,
      due: dueNow,
      overdue,
      untouched: scoped.filter((l) => l.status === 'new' && Date.now() - new Date(l.created_at).getTime() > 2 * DAY).length,
      open,
    }
  }, [inPeriod, scoped, start])

  // trend (daily)
  const trend = useMemo(() => {
    const today = startOfDay(new Date())
    let from = start ?? addDays(today, -29)
    if (period === 'today') from = addDays(today, -6)
    const days: { day: string; label: string; leads: number }[] = []
    for (let d = from; d <= today; d = addDays(d, 1)) {
      days.push({ day: dayKey(d), label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), leads: 0 })
    }
    const idx = new Map(days.map((d, i) => [d.day, i]))
    scoped.forEach((l) => {
      const i = idx.get(dayKey(new Date(l.created_at)))
      if (i !== undefined) days[i].leads += 1
    })
    return days
  }, [scoped, period, start])

  const byStatus = useMemo(
    () => STATUSES.map((s) => ({ name: s, value: inPeriod.filter((l) => l.status === s).length })).filter((x) => x.value > 0),
    [inPeriod],
  )

  const byBranch = useMemo(() => {
    const m = new Map<string, number>()
    inPeriod.forEach((l) => m.set(branchOf(l), (m.get(branchOf(l)) ?? 0) + 1))
    return [...m.entries()].map(([name, leads]) => ({ name, leads })).sort((a, b) => b.leads - a.leads)
  }, [inPeriod])

  const byProduct = useMemo(() => {
    const m = new Map<string, number>()
    inPeriod.forEach((l) => {
      const p = (l.interested_product || 'Not specified').trim()
      m.set(p, (m.get(p) ?? 0) + 1)
    })
    return [...m.entries()].map(([name, leads]) => ({ name, leads })).sort((a, b) => b.leads - a.leads).slice(0, 6)
  }, [inPeriod])

  const byExec = useMemo(() => {
    const todayKey = dayKey(new Date())
    const m = new Map<number, { id: number; name: string; branch: string; leads: number; interested: number; purchased: number; due: number }>()
    inPeriod.forEach((l) => {
      const e = l.executive
      const row = m.get(l.executive_id) ?? { id: l.executive_id, name: e?.name ?? `#${l.executive_id}`, branch: e?.branch ?? '—', leads: 0, interested: 0, purchased: 0, due: 0 }
      row.leads += 1
      if (l.status === 'interested') row.interested += 1
      if (l.status === 'purchased') row.purchased += 1
      if (l.followup_date && l.status !== 'purchased' && l.status !== 'closed' && String(l.followup_date).slice(0, 10) <= todayKey) row.due += 1
      m.set(l.executive_id, row)
    })
    return [...m.values()].sort((a, b) => b.leads - a.leads)
  }, [inPeriod])

  const followups = useMemo(() => {
    const todayKey = dayKey(new Date())
    const weekKey = dayKey(addDays(new Date(), 7))
    return stats.open
      .filter((l) => String(l.followup_date).slice(0, 10) <= weekKey)
      .sort((a, b) => String(a.followup_date).localeCompare(String(b.followup_date)))
      .slice(0, 8)
      .map((l) => {
        const d = String(l.followup_date).slice(0, 10)
        return { lead: l, d, tag: d < todayKey ? 'Overdue' : d === todayKey ? 'Today' : d }
      })
  }, [stats.open])

  const recent = useMemo(() => scoped.slice(0, 8), [scoped])

  const filtersActive = branch !== 'all' || exec !== 'all' || status !== 'all' || period !== '30d'
  const resetFilters = () => { setBranch('all'); setExec('all'); setStatus('all'); setPeriod('30d') }

  if (!leads) return <CircularProgress />

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? ''
  const cards: { title: string; value: number | string; icon: ElementType; color: string; caption: string; delta?: number | null; invert?: boolean }[] = [
    { title: 'Total leads', value: stats.total, icon: PeopleIcon, color: '#2F4A6D', caption: stats.delta === null ? periodLabel : `${periodLabel} · vs previous`, delta: stats.delta },
    { title: 'New today', value: stats.today, icon: TodayIcon, color: '#3A8F6B', caption: `${stats.yesterday} yesterday` },
    { title: 'Open pipeline', value: stats.pipeline, icon: HourglassTopIcon, color: '#7C5CBF', caption: `${stats.interestedOpen} interested` },
    { title: 'Conversion rate', value: `${stats.conversion}%`, icon: TrendingUpIcon, color: '#C8963E', caption: `${stats.purchased} purchased · ${periodLabel.toLowerCase()}` },
    { title: 'Follow-ups due', value: stats.due, icon: PendingActionsIcon, color: '#C0504D', caption: `${stats.overdue} overdue` },
    { title: 'Not contacted', value: stats.untouched, icon: PhoneMissedIcon, color: '#64748B', caption: 'still "new" after 2+ days' },
  ]

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
        action={
          <>
        {admin && (
          <>
            <TextField select size="small" label="Branch" value={branch} onChange={(e) => { setBranch(e.target.value); setExec('all') }} sx={{ width: 170 }}>
              <MenuItem value="all">All branches</MenuItem>
              {branches.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Executive" value={exec} onChange={(e) => setExec(e.target.value)} sx={{ width: 170 }}>
              <MenuItem value="all">All executives</MenuItem>
              {execOptions.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>)}
            </TextField>
          </>
        )}
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 170 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} sx={{ width: 170 }}>
          {PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
        </TextField>
        {filtersActive && <Button startIcon={<FilterAltOffIcon />} onClick={resetFilters} >Reset</Button>}
                </>
        }
      />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {cards.map((c) => (
          <Grid key={c.title} size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
            <StatCard title={c.title} value={c.value} icon={c.icon} color={c.color} caption={c.caption} delta={c.delta} invertDelta={c.invert} />
          </Grid>
        ))}
      </Grid>

      {/* Trend + status */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Panel title="Leads over time" height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F4A6D" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2F4A6D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#2F4A6D" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Status breakdown" height={300}>
            {byStatus.length ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                        {byStatus.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
                  {byStatus.map((s) => (
                    <Chip key={s.name} size="small" label={`${s.name} · ${s.value}`}
                      sx={{ bgcolor: `${STATUS_COLORS[s.name]}20`, color: STATUS_COLORS[s.name], textTransform: 'capitalize' }} />
                  ))}
                </Box>
              </Box>
            ) : <Empty />}
          </Panel>
        </Grid>
      </Grid>

      {/* Branch + products */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {admin && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Panel title="Leads by branch" height={280}>
              {byBranch.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBranch} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="leads" name="Leads" fill="#2F4A6D" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </Panel>
          </Grid>
        )}
        <Grid size={{ xs: 12, lg: admin ? 6 : 12 }}>
          <Panel title="Top interested products" height={280}>
            {byProduct.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProduct} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="leads" name="Leads" fill="#7C5CBF" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Panel>
        </Grid>
      </Grid>

      {/* Executive performance */}
      {admin && (
        <Box sx={{ mb: 2.5 }}>
          <Card>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Executive performance</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Executive</TableCell><TableCell>Branch</TableCell>
                    <TableCell align="right">Leads</TableCell><TableCell align="right">Interested</TableCell>
                    <TableCell align="right">Purchased</TableCell><TableCell align="right">Conversion</TableCell>
                    <TableCell align="right">Follow-ups due</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byExec.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell>{r.branch}</TableCell>
                      <TableCell align="right">{r.leads}</TableCell>
                      <TableCell align="right">{r.interested}</TableCell>
                      <TableCell align="right">{r.purchased}</TableCell>
                      <TableCell align="right">{r.leads ? Math.round((r.purchased / r.leads) * 100) : 0}%</TableCell>
                      <TableCell align="right" sx={{ color: r.due ? 'error.main' : undefined, fontWeight: r.due ? 700 : 400 }}>{r.due}</TableCell>
                    </TableRow>
                  ))}
                  {!byExec.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No data for this selection</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Box>
      )}

      {/* Follow-ups + recent */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Follow-ups — overdue &amp; next 7 days</Typography>
            </Box>
            <List disablePadding>
              {!followups.length && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Nothing due 🎉</Typography>}
              {followups.map(({ lead, tag }) => (
                <ListItemButton key={lead.id} onClick={() => nav(`/leads/${lead.id}`)} sx={{ px: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                  <ListItemText primary={lead.name} secondary={`${lead.mobile}${admin && lead.executive ? ' · ' + lead.executive.name : ''}`} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                  <Chip size="small" label={tag} color={tag === 'Overdue' ? 'error' : tag === 'Today' ? 'warning' : 'default'} sx={{ fontWeight: 700 }} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>Recent leads</Typography>
              <Button size="small" onClick={() => nav('/leads')}>View all</Button>
            </Box>
            <List disablePadding>
              {!recent.length && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>No leads for this selection.</Typography>}
              {recent.map((c) => (
                <ListItemButton key={c.id} onClick={() => nav(`/leads/${c.id}`)} sx={{ px: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                  <ListItemText primary={c.name} secondary={`${c.mobile}${admin ? ' · ' + branchOf(c) : ''}`} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                  <StatusChip status={c.status} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
