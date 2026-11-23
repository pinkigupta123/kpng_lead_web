import type { ElementType } from 'react'
import { Box, Card, Typography } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward'

interface Props {
  title: string
  value: number | string
  icon: ElementType
  color?: string
  /** small line under the value, e.g. "3 overdue" */
  caption?: string
  /** % change vs the previous period; null/undefined hides it */
  delta?: number | null
  /** when true a rising number is bad (e.g. overdue items) */
  invertDelta?: boolean
  onClick?: () => void
}

/** KPI tile: tinted icon, large figure, label and caption. Clickable tiles lift on hover and show a corner arrow. */
export default function StatCard({ title, value, icon: Icon, color = '#2B5DAE', caption, delta, invertDelta, onClick }: Props) {
  const up = (delta ?? 0) > 0
  const good = invertDelta ? !up : up
  const deltaColor = delta === 0 ? '#5E6C80' : good ? '#2E8B63' : '#C94A45'

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%', p: 1.75, position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
        '&::after': { content: '""', position: 'absolute', right: -28, top: -28, width: 96, height: 96, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' },
        '& .stat-go': { opacity: 0, transform: 'translate(-4px, 4px)', transition: 'all .2s ease' },
        '&:hover': onClick ? { boxShadow: '0 2px 4px rgba(15,27,45,.05), 0 10px 28px rgba(15,27,45,.10)', transform: 'translateY(-2px)', borderColor: `${color}55`, '& .stat-go': { opacity: 1, transform: 'none' } } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: `${color}1A`, color }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        {onClick && <ArrowOutwardIcon className="stat-go" sx={{ fontSize: 18, color }} />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.7rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>{value}</Typography>
        {delta !== null && delta !== undefined && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', color: deltaColor }}>
            {delta !== 0 && (up ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
            <Typography sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{delta === 0 ? '0%' : `${Math.abs(delta)}%`}</Typography>
          </Box>
        )}
      </Box>
      <Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, mt: 0.5 }}>{title}</Typography>
      {caption && <Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.72rem', opacity: 0.85 }}>{caption}</Typography>}
    </Card>
  )
}
