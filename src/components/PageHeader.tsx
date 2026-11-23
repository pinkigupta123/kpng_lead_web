import type { ReactNode } from 'react'
import { Box } from '@mui/material'

/**
 * The screen name and its one-line description now live in the top bar, so a page only keeps its action row
 * (filters, buttons). Pages with nothing to put there render nothing here.
 */
export default function PageHeader({ action }: { title?: string; subtitle?: string; action?: ReactNode }) {
  if (!action) return null
  return (
    <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
      {action}
    </Box>
  )
}
