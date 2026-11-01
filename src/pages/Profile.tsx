import { Box, Button, Card, Divider, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import api from '../api/client'

export default function Profile() {
  const { user, clearAuth } = useAuth()
  const nav = useNavigate()
  if (!user) return null

  const rows: [string, string | null][] = [
    ['Employee ID', user.employee_id],
    ['Mobile', user.mobile],
    ['Email', user.email],
    ['Branch', user.branch],
    ['Designation', user.designation],
    ['Role', user.role === 'super_admin' ? 'Super Admin' : 'Sales Executive'],
  ]

  return (
    <Card sx={{ maxWidth: 560, p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>{user.name}</Typography>
      <Divider sx={{ mb: 2 }} />
      {rows.map(([k, v]) => (
        <Box key={k} sx={{ display: 'flex', py: 0.75 }}>
          <Typography color="text.secondary" sx={{ width: 140 }}>{k}</Typography>
          <Typography>{v || '—'}</Typography>
        </Box>
      ))}
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={() => nav('/change-password')}>Change password</Button>
        <Button
          color="error"
          onClick={async () => {
            await api.post('/lead/logout').catch(() => {})
            clearAuth()
          }}
        >
          Logout
        </Button>
      </Box>
    </Card>
  )
}
