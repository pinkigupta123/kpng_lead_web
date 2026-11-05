import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import type { LeadOption, OptionType, PermissionDef } from '../types'

type Grouped = Record<OptionType, LeadOption[]>
const EMPTY: Grouped = { lead_source: [], designation: [] }

/** Admin-managed dropdown values + the grantable permission catalog. */
export function useLeadOptions(includeInactive = false) {
  const [options, setOptions] = useState<Grouped>(EMPTY)
  const [permissions, setPermissions] = useState<PermissionDef[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const r = await api.get('/lead/options', { params: includeInactive ? { all: 1 } : {} })
      setOptions({ ...EMPTY, ...(r.data?.options || {}) })
      setPermissions(r.data?.permissions || [])
    } catch {
      /* leave empty */
    } finally {
      setLoading(false)
    }
  }, [includeInactive])

  useEffect(() => { reload() }, [reload])

  return { options, permissions, loading, reload }
}
