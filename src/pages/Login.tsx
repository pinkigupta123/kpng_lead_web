import { useState } from 'react'
import { Alert, Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import api, { errMsg } from '../api/client'
import { useAuth } from '../store/auth'
import { brand } from '../theme'

export default function Login() {
  const setAuth = useAuth((s) => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<{ mobile: string; password: string }>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (d: { mobile: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const r = await api.post('/lead/login', d)
      setAuth(r.data.token, r.data.user)
    } catch (e) {
      setError(errMsg(e, 'Network error. Please check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: brand.charcoal, p: 2 }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary" gutterBottom>
          KPMG Lead Manager
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in to continue
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Mobile number"
            margin="normal"
            autoFocus
            {...register('mobile', { required: 'Mobile number is required' })}
            error={!!errors.mobile}
            helperText={errors.mobile?.message}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password', { required: 'Password is required' })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
        </form>
      </Card>
    </Box>
  )
}
