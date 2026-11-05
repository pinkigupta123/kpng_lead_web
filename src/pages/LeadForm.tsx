import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CircularProgress, MenuItem, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import { useAuth } from '../store/auth'
import { useLeadOptions } from '../hooks/useLeadOptions'
import { localDate } from '../dates'
import { STATUSES, statusLabel, type CustomerStatus } from '../types'

interface F {
  name: string
  mobile: string
  email: string
  city: string
  company: string
  lead_source: string
  interested_product: string
  device_brand: string
  device_model: string
  customer_query: string
  status: CustomerStatus
  followup_date: string
  notes: string
}

const EMPTY: F = {
  name: '', mobile: '', email: '', city: '', company: '', lead_source: '', interested_product: '',
  device_brand: '', device_model: '', customer_query: '', status: 'new', followup_date: '', notes: '',
}

interface Props {
  /** Render inside a side panel (no card wrapper); onDone/onCancel close the panel. */
  embedded?: boolean
  /** Lead to edit when embedded (otherwise taken from the route). */
  leadId?: number
  onDone?: (leadId?: number, opts?: { existing?: boolean; lead?: { id?: number; name: string; mobile: string; interested_product?: string } }) => void
  onCancel?: () => void
}

export default function LeadForm({ embedded = false, leadId, onDone, onCancel }: Props = {}) {
  const params = useParams()
  const id = leadId != null ? String(leadId) : params.id
  const edit = !!id
  const nav = useNavigate()
  const { notify } = useFeedback()
  const me = useAuth((x) => x.user)
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<F>({ defaultValues: EMPTY })
  const { options: leadOptions } = useLeadOptions()
  const currentSource = watch('lead_source')
  const [fetching, setFetching] = useState(edit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/lead/customers/${id}`).then((r) => {
      const d = r.data?.data || r.data
      reset({
        name: d.name, mobile: d.mobile, email: d.email || '', city: d.city || '', company: d.company || '', lead_source: d.lead_source || '',
        interested_product: d.interested_product || '', device_brand: d.device_brand || '',
        device_model: d.device_model || '', customer_query: d.customer_query || '', status: d.status,
        followup_date: d.followup_date ? String(d.followup_date).slice(0, 10) : '', notes: d.notes || '',
      })
    }).catch(() => { notify('Failed to load lead', 'error'); if (onCancel) onCancel(); else nav(-1) }).finally(() => setFetching(false))
  }, [id, reset, nav, notify])

  const onSubmit = async (data: F) => {
    setSaving(true)
    setError('')
    try {
      if (edit) {
        await api.put(`/lead/customers/${id}`, data)
        notify('Lead updated')
        if (onDone) onDone(Number(id))
        else nav(`/leads/${id}`)
      } else {
        const r = await api.post('/lead/customers', { ...data, status: 'new' })
        if (r.data.duplicate) {
          const dup = r.data.customer?.data || r.data.customer
          const mine = me?.role === 'super_admin' || dup?.executive_id === me?.id
          if (!mine) {
            // The backend only lets an executive open their own leads, so don't navigate (it would 403).
            setError(
              `This mobile number is already registered as a lead for ${dup?.name ?? 'another customer'}` +
                `${dup?.executive?.name ? ` (handled by ${dup.executive.name})` : ''}. Please contact an admin if you need access.`,
            )
            return
          }
          notify(`Mobile already registered to ${dup?.name}. Opening existing lead.`, 'info')
          if (onDone) onDone(dup?.id, { existing: true })
          else nav(`/leads/${dup?.id}`)
        } else {
          const created = r.data.customer?.data || r.data.customer || r.data.data || r.data
          notify('Lead created')
          if (onDone) {
            onDone(created?.id, {
              lead: { id: created?.id, name: created?.name || data.name, mobile: created?.mobile || data.mobile, interested_product: data.interested_product },
            })
          }
          else nav(created?.id ? `/leads/${created.id}` : '/leads')
        }
      }
    } catch (e) {
      setError(errMsg(e, 'Failed to save lead'))
    } finally {
      setSaving(false)
    }
  }

  if (fetching) return <CircularProgress />

  const field = (name: keyof F, label: string, opts: { required?: string; multiline?: boolean; type?: string; size?: number; lock?: boolean } = {}) => {
    // when editing, customer identity / product details are read-only
    const ro = edit && !!opts.lock
    return (
    <Grid size={{ xs: 12, md: opts.size ?? 6 }}>
      <TextField
        fullWidth label={label} type={opts.type} multiline={opts.multiline} minRows={opts.multiline ? 3 : undefined}
        slotProps={{ ...(opts.type === 'date' ? { inputLabel: { shrink: true } } : {}), ...(ro ? { htmlInput: { readOnly: true, tabIndex: -1 } } : {}), ...(opts.type === 'date' && !ro ? { htmlInput: { min: localDate() } } : {}) }}
        sx={ro ? { '& .MuiOutlinedInput-root': { bgcolor: '#F1F5F9' }, '& input': { color: 'text.secondary', cursor: 'not-allowed' } } : undefined}
        {...register(name, opts.required ? { required: opts.required } : {})}
        error={!!errors[name]} helperText={errors[name]?.message as string | undefined}
      />
    </Grid>
    )
  }

  const Wrapper = embedded ? Box : Card
  return (
    <Wrapper sx={embedded ? {} : { p: { xs: 2, md: 4 }, maxWidth: 900 }}>
      {!embedded && <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>{edit ? 'Edit lead' : 'Add lead'}</Typography>}
      {edit && <Alert severity="info" sx={{ mb: 2 }}>Customer details, notes and the follow-up date are locked here. You can update the query and status. To add a note use Log update; to change the date use Schedule follow-up (both on the lead page).</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {field('name', 'Customer name *', { required: 'Customer name is required', lock: true })}
          {field('mobile', 'Mobile number *', { required: 'Mobile number is required', lock: true })}
          {field('email', 'Email', { type: 'email', lock: true })}
          {field('city', 'City', { lock: true })}
          {field('company', 'Company', { lock: true })}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="lead_source"
              control={control}
              render={({ field: f }) => (
                <TextField select fullWidth label="Lead came from" {...f}>
                  <MenuItem value="">—</MenuItem>
                  {/* keep a value saved earlier selectable even if the admin removed it */}
                  {currentSource && !leadOptions.lead_source.some((o) => o.label === currentSource) && (
                    <MenuItem value={currentSource}>{currentSource}</MenuItem>
                  )}
                  {leadOptions.lead_source.map((o) => <MenuItem key={o.id} value={o.label}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
          </Grid>
          {field('interested_product', 'Interested product', { lock: true })}
          {field('device_brand', 'Device brand', { lock: true })}
          {field('device_model', 'Device model', { lock: true })}
          {field('customer_query', 'Customer query', { multiline: true, size: 12 })}
          <Grid size={{ xs: 12, md: 6 }}>
            {edit ? (
              <TextField select fullWidth label="Status" defaultValue="new" {...register('status')} slotProps={{ select: { native: true } }}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </TextField>
            ) : (
              // a new lead always starts as "New"; it changes later through Log update / follow-ups
              <TextField fullWidth label="Status" value={statusLabel('new')} helperText="New leads always start as New"
                slotProps={{ htmlInput: { readOnly: true, tabIndex: -1 } }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F1F5F9' }, '& input': { color: 'text.secondary', cursor: 'not-allowed' } }} />
            )}
          </Grid>
          {field('followup_date', 'Follow-up date', { type: 'date', lock: true })}
          {field('notes', 'Notes / remarks', { multiline: true, size: 12, lock: true })}
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : edit ? 'Save changes' : 'Create lead'}</Button>
          <Button onClick={() => (onCancel ? onCancel() : nav(-1))}>Cancel</Button>
        </Box>
      </form>
    </Wrapper>
  )
}
