import { useState } from 'react'
import {
  AppBar, Avatar, Box, ButtonBase, Divider, Drawer, IconButton, ListItemButton, ListItemIcon,
  ListItemText, ListItemIcon as MenuIcon2, Menu, MenuItem, Toolbar, Tooltip, Typography,
} from '@mui/material'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import LogoutIcon from '@mui/icons-material/Logout'
import LockIcon from '@mui/icons-material/LockOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import api from '../api/client'
import NotificationBell from './NotificationBell'
import { SaleFlowProvider } from './SaleFlow'
import { brand } from '../theme'

const FULL = 232
const RAIL = 68
const INK = brand.charcoal

type Item = { to: string; label: string; icon: React.ReactNode }

// Where the user is: shown at the top of every screen (so pages don't repeat their own big heading).
const SCREENS: { path: string; title: string; hint: string }[] = [
  { path: '/leads/new', title: 'New lead', hint: 'Capture a new enquiry' },
  { path: '/staff', title: 'Staff', hint: 'Sales executives, their branches and permissions' },
  { path: '/organization', title: 'Companies & Branches', hint: 'Shared with KPNG Technology — add or edit locations' },
  { path: '/options', title: 'Dropdowns', hint: 'Manage lead sources, designations, payment providers and offers' },
  { path: '/profile', title: 'Profile', hint: 'Your account details' },
  { path: '/change-password', title: 'Change password', hint: 'Keep your account secure' },
  { path: '/leads', title: 'Leads', hint: 'Every enquiry, its status and next follow-up' },
  { path: '/', title: 'Dashboard', hint: 'How your leads are doing' },
]

function screenOf(pathname: string) {
  if (/^\/leads\/\d+\/order/.test(pathname)) return { title: 'Order confirmation', hint: 'Confirm the sale and record the payment' }
  if (/^\/leads\/\d+\/edit/.test(pathname)) return { title: 'Edit lead', hint: 'Update the enquiry details' }
  if (/^\/leads\/\d+/.test(pathname)) return { title: 'Lead details', hint: 'Follow-ups, activity and order' }
  return SCREENS.find((s) => (s.path === '/' ? pathname === '/' : pathname.startsWith(s.path))) ?? SCREENS[SCREENS.length - 1]
}

export default function Layout() {
  const { user, clearAuth } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar_collapsed') === '1')
  const W = collapsed ? RAIL : FULL
  const screen = screenOf(pathname)

  const admin = user?.role === 'super_admin'
  const groups: { label: string; items: Item[] }[] = [
    { label: 'Workspace', items: [
      { to: '/', label: 'Dashboard', icon: <SpaceDashboardOutlinedIcon /> },
      { to: '/leads', label: 'Leads', icon: <PeopleAltOutlinedIcon /> },
    ] },
    ...(admin ? [{ label: 'Admin', items: [
      { to: '/staff', label: 'Staff', icon: <BadgeOutlinedIcon /> },
      { to: '/organization', label: 'Companies & Branches', icon: <StorefrontOutlinedIcon /> },
      { to: '/options', label: 'Dropdowns', icon: <TuneOutlinedIcon /> },
    ] }] : []),
    { label: 'Account', items: [{ to: '/profile', label: 'Profile', icon: <PersonOutlineIcon /> }] },
  ]

  const logout = async () => {
    await api.post('/lead/logout').catch(() => {})
    clearAuth()
  }
  const toggle = () => setCollapsed((c) => { localStorage.setItem('sidebar_collapsed', c ? '0' : '1'); return !c })

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Sales Executive'

  const drawer = (rail: boolean) => (
    <Box sx={{
      height: '100%', color: '#fff', display: 'flex', flexDirection: 'column', bgcolor: INK,
      backgroundImage: 'radial-gradient(120% 60% at 0% 0%, rgba(92,143,224,0.14) 0%, rgba(15,27,45,0) 60%)',
    }}>
      <Box sx={{ px: rail ? 0 : 2.5, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${brand.primaryLight} 0%, ${brand.primary} 100%)`, boxShadow: '0 4px 14px rgba(43,93,174,0.5)' }}>
          <Typography sx={{ fontWeight: 800, color: '#fff' }}>K</Typography>
        </Box>
        {!rail && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.15, letterSpacing: '-0.01em' }}>KPMG Leads</Typography>
            <Typography sx={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', fontWeight: 600 }}>LEAD MANAGEMENT</Typography>
          </Box>
        )}
      </Box>

      <Box component="nav" sx={{ px: 1.25, pt: 0.5, pb: 1, flex: 1, overflowY: 'auto' }}>
        {groups.map((g) => (
          <Box key={g.label} sx={{ mb: 1.25 }}>
            {rail
              ? <Box sx={{ mx: 1.5, mb: 0.75, borderTop: '1px solid rgba(255,255,255,0.1)' }} />
              : <Typography sx={{ px: 1.5, mb: 0.75, fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}>{g.label}</Typography>}
            {g.items.map((i) => {
              const active = i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)
              return (
                <Tooltip key={i.to} title={rail ? i.label : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => { nav(i.to); setMobileOpen(false) }}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      position: 'relative', borderRadius: 2, mb: 0.125, py: 0.7, px: rail ? 0 : 1.25, justifyContent: rail ? 'center' : 'flex-start',
                      color: active ? '#fff' : 'rgba(255,255,255,0.66)', bgcolor: active ? 'rgba(92,143,224,0.18)' : 'transparent',
                      '&:hover': { bgcolor: active ? 'rgba(92,143,224,0.22)' : 'rgba(255,255,255,0.06)', color: '#fff' },
                      '&::before': { content: '""', position: 'absolute', left: rail ? -6 : -10, top: 9, bottom: 9, width: 4, borderRadius: '0 4px 4px 0', bgcolor: brand.primaryLight, opacity: active ? 1 : 0 },
                      '& .MuiListItemIcon-root': { color: active ? brand.primaryLight : 'rgba(255,255,255,0.55)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: rail ? 0 : 34, justifyContent: 'center' }}>{i.icon}</ListItemIcon>
                    {!rail && <ListItemText primary={i.label} slotProps={{ primary: { sx: { fontSize: '0.86rem', fontWeight: active ? 700 : 500 } } }} />}
                  </ListItemButton>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 1.25, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start', gap: 1.25, p: rail ? 0.75 : 1.25, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: brand.primary, color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{initials}</Avatar>
          {!rail && (
            <>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>{user?.name}</Typography>
                <Typography noWrap sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>{roleLabel}</Typography>
              </Box>
              <Tooltip title="Logout">
                <IconButton onClick={logout} size="small" sx={{ color: 'rgba(255,255,255,0.65)', '&:hover': { color: '#FCA5A5', bgcolor: 'rgba(239,68,68,0.15)' } }}><LogoutIcon fontSize="small" /></IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )

  return (
    <SaleFlowProvider>
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{
        width: { sm: `calc(100% - ${W}px)` }, ml: { sm: `${W}px` }, transition: 'width .2s ease, margin .2s ease',
        bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Toolbar variant="dense" sx={{ minHeight: 56, px: { xs: 1.5, md: 2 } }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5, display: { sm: 'none' } }}><MenuIcon /></IconButton>
          <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'}>
            <IconButton color="inherit" edge="start" aria-label={collapsed ? 'Expand side menu' : 'Collapse side menu'} onClick={toggle} sx={{ mr: 1.5, display: { xs: 'none', sm: 'inline-flex' } }}>
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{screen.title}</Typography>
            <Typography noWrap sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.3, display: { xs: 'none', sm: 'block' } }}>{screen.hint}</Typography>
          </Box>
          <NotificationBell />
          <ButtonBase onClick={(e) => setAnchor(e.currentTarget)} sx={{ gap: 1.25, py: 0.5, pl: 0.5, pr: 1, borderRadius: 2, textAlign: 'left', '&:hover': { bgcolor: 'action.hover' } }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.25 }}>{user?.name}</Typography>
              <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.25 }}>{roleLabel}</Typography>
            </Box>
            <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setAnchor(null); nav('/profile') }}><MenuIcon2><PersonOutlineIcon fontSize="small" /></MenuIcon2>Profile</MenuItem>
            <MenuItem onClick={() => { setAnchor(null); nav('/change-password') }}><MenuIcon2><LockIcon fontSize="small" /></MenuIcon2>Change password</MenuItem>
            <Divider />
            <MenuItem onClick={logout} sx={{ color: 'error.main' }}><MenuIcon2 sx={{ color: 'inherit' }}><LogoutIcon fontSize="small" /></MenuIcon2>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: W }, flexShrink: { sm: 0 }, transition: 'width .2s ease' }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: FULL, border: 0 } }}>{drawer(false)}</Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: W, border: 0, overflowX: 'hidden', transition: 'width .2s ease' } }}>{drawer(collapsed)}</Drawer>
      </Box>

      <Box component="main" sx={{
        flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)',
        p: { xs: 1.5, md: 2 }, pt: { xs: 1.5, md: 1.5 }, pb: { xs: 1.5, md: 1.5 }, mt: 7, width: { sm: `calc(100% - ${W}px)` }, transition: 'width .2s ease',
      }}>
        <Outlet />
      </Box>
    </Box>
    </SaleFlowProvider>
  )
}
