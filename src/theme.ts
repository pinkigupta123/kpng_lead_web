import { createTheme } from '@mui/material'

// Same visual language as the KPNG Technology web app: slate neutrals + muted steel-blue accent.
export const brand = {
  primary: '#2F4A6D',
  primaryDark: '#1E3350',
  tint: '#EBEFF5',
  charcoal: '#1E293B',
  canvas: '#F4F6F9',
  line: '#E2E8F0',
}

const shadow = '0 2px 10px rgba(30, 41, 59, 0.06)'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.primary, dark: brand.primaryDark, contrastText: '#FFFFFF' },
    secondary: { main: '#5B6B7A' },
    background: { default: brand.canvas, paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    success: { main: '#3A8F6B' },
    error: { main: '#C0504D' },
    warning: { main: '#C8963E' },
    info: { main: brand.primary },
    divider: brand.line,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.82rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '7px 18px' },
      },
    },
    MuiCard: {
      styleOverrides: { root: { border: `1px solid ${brand.line}`, borderRadius: 12, boxShadow: shadow } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none', boxShadow: shadow, borderRadius: 12 } },
    },
    MuiDrawer: { styleOverrides: { paper: { borderRadius: 0, boxShadow: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D3DAE2' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9AA9B8' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.line}`, padding: '14px 20px', fontSize: '0.85rem' },
        head: {
          fontWeight: 700,
          backgroundColor: '#F8FAFC',
          color: '#475569',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          letterSpacing: '0.6px',
          borderBottom: `2px solid ${brand.line}`,
        },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: '#F5F8FB' } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 14, boxShadow: '0 16px 48px rgba(30, 41, 59, 0.22)' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.15rem', fontWeight: 700, padding: '18px 24px' } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: '#1E293B', fontSize: '0.75rem' } } },
  },
})
