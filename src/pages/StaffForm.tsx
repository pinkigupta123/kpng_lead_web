import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import Grid from '@mui/material/Grid'
import { Controller, useForm } from 'react-hook-form'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'

interface F {
  name: string
  mobile: string
  email: string
  branch: string
  designation: string
  password: string
}

export interface NewCreds {
  name: string
  employeeId: string
  username: string
  password: string
}

const EMPTY: F = { name: '', mobile: '', email: '', branch: '', designation: '', password: '' }

interface Props {
  open: boolean
  /** set to edit an existing executive; omit to add a new one */
  executiveId?: number | null
  onClose: () => void
  /** called after a successful save; for a new executive it receives the generated credentials */
  onSaved: (creds?: NewCreds) => void
}

export default function StaffForm({ open, executiveId, onClose, onSaved }: Props) {
  const edit = !!executiveId
  const { notify } = useFeedback()
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<F>({ defaultValues: EMPTY })
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [inactive, setInactive] = useState<Set<string>>(new Set())
  const [branchesLoading, setBranchesLoading] = useState(true)
  const currentBranch = watch('branch')

  // Branch list comes from the branches table
  useEffect(() => {
    if (!open) return
    setBranchesLoading(true)
    api.get('/branches')
      .then((r) => {
        // tolerate { data: [...] }, { data: { data: [...] } } and a bare array
        let list: any = r.data
        while (list && !Array.isArray(list) && list.data) list = list.data
        const all: any[] = Array.isArray(list) ? list : []
        setBranches(all.filter((b) => b?.name).map((b) => (b.is_active === false ? `${b.name}` : b.name)))
        setInactive(new Set(all.filter((b) => b?.name && b.is_active === false).map((b) => b.name)))
      })
      .catch(() => notify('Failed to load branches', 'error'))
      .finally(() => setBranchesLoading(false))
  }, [open, notify])

  // Reset / load whenever the dialog opens
  useEffect(() => {
    if (!open) return
    setError('')
    if (!executiveId) {
      reset(EMPTY)
      return
    }
    setFetching(true)
    api.get(`/lead/executives/${executiveId}`)
      .then((r) => {
        const d = r.data?.data || r.data
        reset({ name: d.name, mobile: d.mobile, email: d.email || '', branch: d.branch, designation: d.designation || '', password: '' })
      })
      .catch(() => { notify('Failed to load executive', 'error'); onClose() })
      .finally(() => setFetching(false))
  }, [open, executiveId, reset, notify, onClose])

  const onSubmit = async (data: F) => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...data, password: data.password.trim() ? data.password : undefined }
      if (edit) {
        await api.put(`/lead/executives/${executiveId}`, payload)
        notify('Executive updated')
        onSaved()
      } else {
        const r = await api.post('/lead/executives', payload)
        onSaved({ name: data.name, employeeId: r.data.employee_id, username: r.data.username, password: r.data.password })
      }
    } catch (e) {
      setError(errMsg(e, 'Failed to save executive'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <DialogTitle>{edit ? 'Edit executive' : 'Add executive'}</DialogTitle>
        <DialogContent dividers>
          {fetching ? (
            <CircularProgress />
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2} sx={{ pt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Full name *" autoComplete="off" {...register('name', { required: 'Name is required' })} error={!!errors.name} helperText={errors.name?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Mobile number *" autoComplete="off" {...register('mobile', { required: 'Mobile number is required' })} error={!!errors.mobile} helperText={errors.mobile?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth type="email" label="Email" autoComplete="off" {...register('email')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="branch"
                    control={control}
                    rules={{ required: 'Branch is required' }}
                    render={({ field }) => (
                      <TextField select fullWidth label="Branch *" {...field} disabled={branchesLoading} error={!!errors.branch} helperText={errors.branch?.message}>
                        {/* keep a legacy value selectable if it is no longer in the branch table */}
                        {currentBranch && !branches.includes(currentBranch) && <MenuItem value={currentBranch}>{currentBranch}</MenuItem>}
                        {branches.map((b) => <MenuItem key={b} value={b}>{b}{inactive.has(b) ? ' (inactive)' : ''}</MenuItem>)}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Designation" autoComplete="off" {...register('designation')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    autoComplete="new-password"
                    label={edit ? 'New password (optional)' : 'Password (optional)'}
                    helperText={edit ? undefined : 'Auto-generated if left empty'}
                    {...register('password')}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || fetching}>
            {saving ? 'Saving…' : edit ? 'Save changes' : 'Create executive'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
