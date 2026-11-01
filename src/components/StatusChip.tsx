import { Chip } from '@mui/material'

export const STATUS_COLORS: Record<string, string> = {
  new: '#2F4A6D',
  contacted: '#3B82A0',
  'follow-up': '#C8963E',
  interested: '#7C5CBF',
  purchased: '#3A8F6B',
  closed: '#78909C',
  active: '#3A8F6B',
  inactive: '#C0504D',
}

/** Tinted, uppercase badge — same style as the KPNG Technology status badges. */
export default function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? '#78909C'
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        backgroundColor: `${c}20`,
        color: c,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: '0.68rem',
      }}
    />
  )
}
