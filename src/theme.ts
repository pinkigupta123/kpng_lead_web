import { createTheme } from '@mui/material'

// Same visual language as the KPNG Technology web app: deep ink chrome, one confident cobalt accent,
// hairline borders, soft shadows and tighter corners.
export const brand = {
  primary: '#2B5DAE',
  primaryDark: '#1E4585',
  primaryLight: '#5C8FE0',
  tint: '#EAF1FB',
  charcoal: '#0F1B2D', // sidebar / login ink
  ink2: '#16263B',
  canvas: '#F3F5F9',
  line: '#E6EAF0',
}

const shadow = '0 1px 2px rgba(15, 27, 45, 0.04), 0 4px 16px rgba(15, 27, 45, 0.05)'
const input = '#D5DCE6'
const inputHover = '#9AA9BC'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.primary, dark: brand.primaryDark, light: brand.primaryLight, contrastText: '#FFFFFF' },
    secondary: { main: '#5B6B7A' },
    background: { default: brand.canvas, paper: '#FFFFFF' },
    text: { primary: '#0F1B2D', secondary: '#5E6C80' },
    success: { main: '#2E8B63' },
    error: { main: '#C94A45' },
    warning: { main: '#C98A1E' },
    info: { main: brand.primary },
    divider: brand.line,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 700 },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.82rem' },
    overline: { fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.68rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.1 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: brand.canvas } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, padding: '7px 16px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        sizeMedium: { minHeight: 40 }, // same height as small text fields / selects, so toolbars line up
        sizeSmall: { padding: '4px 12px', borderRadius: 6, minHeight: 32 },
      },
      variants: [
        { props: { variant: 'contained', color: 'primary' }, style: { boxShadow: '0 1px 2px rgba(43, 93, 174, 0.35)', '&:hover': { backgroundColor: brand.primaryDark, boxShadow: '0 2px 8px rgba(43, 93, 174, 0.35)' } } },
        { props: { variant: 'outlined' }, style: { backgroundColor: '#FFFFFF', borderColor: input, color: '#0F1B2D', '&:hover': { backgroundColor: '#FFFFFF', borderColor: inputHover } } },
        { props: { variant: 'outlined', color: 'primary' }, style: { color: brand.primary, '&:hover': { borderColor: brand.primary, backgroundColor: brand.tint } } },
      ],
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiCard: {
      styleOverrides: { root: { border: `1px solid ${brand.line}`, borderRadius: 8, boxShadow: shadow } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', boxShadow: shadow, borderRadius: 8 },
        outlined: { border: `1px solid ${brand.line}`, boxShadow: 'none' },
      },
    },
    MuiDrawer: { styleOverrides: { paper: { borderRadius: 0, boxShadow: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600, letterSpacing: 0.1 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: input },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: inputHover },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(43, 93, 174, 0.14)' },
        },
      },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 44 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderColor: brand.line } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 8, border: `1px solid ${brand.line}`, boxShadow: '0 12px 32px rgba(15, 27, 45, 0.16)' } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.line}`, padding: '10px 16px', fontSize: '0.85rem' },
        head: {
          fontWeight: 700,
          backgroundColor: '#F7F9FC',
          color: '#5E6C80',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          borderBottom: `1px solid ${brand.line}`,
        },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: '#F5F8FD' } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 10, boxShadow: '0 24px 64px rgba(15, 27, 45, 0.28)' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', padding: '20px 24px' } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: '#0F1B2D', fontSize: '0.75rem', borderRadius: 6, padding: '6px 10px' } } },
  },
})
