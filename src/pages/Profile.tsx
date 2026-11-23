import { Avatar, Box, Button, Card, Typography } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import api from '../api/client'

export default function Profile() {
  const { user, clearAuth } = useAuth()
  const nav = useNavigate()
  if (!user) return null

  const roleLabel = user.role === 'super_admin' ? 'Super Admin' : 'Sales Executive'
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const rows: [string, string | null][] = [
    ['Employee ID', user.employee_id],
    ['Mobile', user.mobile],
    ['Email', user.email],
    ['Branch', user.branch],
    ['Designation', user.designation],
    ['Role', roleLabel],
  ]
  const logout = async () => {
    await api.post('/lead/logout').catch(() => {})
    clearAuth()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
      {/* masthead: who you are + the two account actions on the right */}
      <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>{initials}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{user.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{roleLabel}{user.branch ? ` · ${user.branch}` : ''}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="primary" startIcon={<LockOutlinedIcon />} onClick={() => nav('/change-password')}>Change password</Button>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout}>Logout</Button>
        </Box>
      </Card>

      {/* details across the full width */}
      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>Account details</Typography>
        <Box sx={{ mt: 1.5, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
          {rows.map(([k, v]) => (
            <Box key={k} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 600 }}>{k}</Typography>
              <Typography noWrap sx={{ fontSize: '1.02rem', fontWeight: 600, mt: 0.25 }}>{v || '—'}</Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  )
}
