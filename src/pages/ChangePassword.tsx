import { useState } from 'react'
import { Alert, Box, Button, Card, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useAuth } from '../store/auth'
import { brand } from '../theme'

interface F {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export default function ChangePassword({ forced = false }: { forced?: boolean }) {
  const { updateUser, clearAuth } = useAuth()
  const nav = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<F>()
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (d: F) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/lead/change-password', {
        ...d,
        current_password: d.current_password || '',
        is_force_reset: forced ? 1 : 0,
      })
      setOk(true)
      setTimeout(() => {
        updateUser({ is_temp_password: false })
        if (!forced) nav(-1)
      }, 1200)
    } catch (e) {
      setError(errMsg(e, 'Failed to change password'))
    } finally {
      setLoading(false)
    }
  }

  const card = (
    <Card sx={{ p: 4, width: '100%', maxWidth: 440 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {forced ? 'Set a new password' : 'Change password'}
      </Typography>
      {forced && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are using a temporary password. Please set a new one to continue.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>Password changed successfully.</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        {!forced && (
          <TextField
            fullWidth
            type="password"
            label="Current password"
            margin="normal"
            {...register('current_password', { required: 'Required' })}
            error={!!errors.current_password}
            helperText={errors.current_password?.message}
          />
        )}
        <TextField
          fullWidth
          type="password"
          label="New password"
          margin="normal"
          {...register('new_password', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })}
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
        />
        <TextField
          fullWidth
          type="password"
          label="Confirm new password"
          margin="normal"
          {...register('new_password_confirmation', {
            required: 'Required',
            validate: (v) => v === watch('new_password') || 'Passwords do not match',
          })}
          error={!!errors.new_password_confirmation}
          helperText={errors.new_password_confirmation?.message}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button type="submit" variant="contained" disabled={loading || ok}>
            Update password
          </Button>
          {forced ? <Button onClick={clearAuth}>Logout</Button> : <Button onClick={() => nav(-1)}>Cancel</Button>}
        </Box>
      </form>
    </Card>
  )

  return forced ? (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: brand.canvas, p: 2 }}>{card}</Box>
  ) : (
    card
  )
}
