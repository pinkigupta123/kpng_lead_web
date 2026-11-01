import { useState } from 'react'
import {
  AppBar, Avatar, Box, ButtonBase, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, ListItemIcon as MenuIcon2, Menu, MenuItem, Toolbar, Tooltip, Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/People'
import BadgeIcon from '@mui/icons-material/Badge'
import PersonIcon from '@mui/icons-material/Person'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import LockIcon from '@mui/icons-material/LockOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import api from '../api/client'
import NotificationBell from './NotificationBell'

const W = 260
const INK = '#1E293B'
const LINE = 'rgba(255,255,255,0.14)'

export default function Layout() {
  const { user, clearAuth } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const items = [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/leads', label: 'Leads', icon: <GroupIcon /> },
    ...(user?.role === 'super_admin' ? [{ to: '/staff', label: 'Staff', icon: <BadgeIcon /> }] : []),
    { to: '/profile', label: 'Profile', icon: <PersonIcon /> },
  ]

  const logout = async () => {
    await api.post('/lead/logout').catch(() => {})
    clearAuth()
  }

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Sales Executive'

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: INK, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, height: 65, mb: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${LINE}` }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#fff', display: 'grid', placeItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: INK }}>K</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>KPMG Leads</Typography>
      </Box>

      <List sx={{ px: 2, flex: 1, overflowY: 'auto' }}>
        {items.map((i) => {
          const active = i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)
          return (
            <ListItem key={i.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { nav(i.to); setOpen(false) }}
                sx={{
                  borderRadius: 2,
                  color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                  bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  '&:hover': { bgcolor: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)', color: '#fff' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{i.icon}</ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}>{i.label}</Typography>} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ px: 2, py: 1.75, flexShrink: 0, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '1rem' }}>{initials}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>{user?.name}</Typography>
          <Typography noWrap variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.6)' }}>{roleLabel}</Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton onClick={logout} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}><LogoutIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${W}px)` }, ml: { sm: `${W}px` }, bgcolor: INK, color: '#fff', boxShadow: 'none', borderBottom: `1px solid ${LINE}` }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 1, display: { sm: 'none' } }}><MenuIcon /></IconButton>
          <Typography sx={{ fontWeight: 600, flex: 1 }}>Lead Management</Typography>
          <NotificationBell />
          <ButtonBase onClick={(e) => setAnchor(e.currentTarget)} sx={{ gap: 1, p: 0.5, pr: 1, borderRadius: 2, color: '#fff' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.18)', fontSize: '0.85rem' }}>{initials}</Avatar>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, display: { xs: 'none', md: 'block' } }}>{user?.name}</Typography>
            <KeyboardArrowDownIcon fontSize="small" />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setAnchor(null); nav('/profile') }}><MenuIcon2><PersonIcon fontSize="small" /></MenuIcon2>Profile</MenuItem>
            <MenuItem onClick={() => { setAnchor(null); nav('/change-password') }}><MenuIcon2><LockIcon fontSize="small" /></MenuIcon2>Change password</MenuItem>
            <Divider />
            <MenuItem onClick={logout}><MenuIcon2><LogoutIcon fontSize="small" /></MenuIcon2>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: W }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: W, border: 0 } }}>{drawer}</Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: W, border: 0, borderRight: `1px solid ${LINE}` } }}>{drawer}</Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', p: { xs: 2, md: 3 }, pt: { xs: 3, md: 3 }, mt: 8, width: { sm: `calc(100% - ${W}px)` } }}>
        <Outlet />
      </Box>
    </Box>
  )
}
