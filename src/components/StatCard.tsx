import type { ElementType } from 'react'
import { Box, Card, Typography } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

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

export default function StatCard({ title, value, icon: Icon, color = '#2F4A6D', caption, delta, invertDelta, onClick }: Props) {
  const up = (delta ?? 0) > 0
  const good = invertDelta ? !up : up
  const deltaColor = delta === 0 ? '#64748B' : good ? '#3A8F6B' : '#C0504D'

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        p: 2.25,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: '0 6px 18px rgba(30,41,59,.12)', transform: onClick ? 'translateY(-1px)' : 'none' },
        '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: color },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{title}</Typography>
        <Box sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: `${color}1F`, color }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.9rem', lineHeight: 1.15 }}>{value}</Typography>
        {delta !== null && delta !== undefined && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', color: deltaColor }}>
            {delta !== 0 && (up ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{delta === 0 ? '0%' : `${Math.abs(delta)}%`}</Typography>
          </Box>
        )}
      </Box>
      {caption && <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 }}>{caption}</Typography>}
    </Card>
  )
}
