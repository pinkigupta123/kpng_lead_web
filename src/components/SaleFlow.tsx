import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import api, { errMsg } from '../api/client'
import { useFeedback } from './Feedback'
import { OrderForm } from '../pages/OrderConfirmation'

interface FlowOpts {
  /** called as soon as the user agrees (e.g. to close the dialog they were in) */
  onYes?: () => void
  /** called after the lead actually changed (sale saved / lead closed) so the screen can refresh */
  onDone?: () => void
}
interface Ctx {
  confirmSale: (customerId: number, opts?: FlowOpts) => void
  openOrder: (customerId: number, opts?: FlowOpts) => void
  closeLead: (customerId: number, opts?: FlowOpts) => void
}
const SaleFlowCtx = createContext<Ctx>(null as unknown as Ctx)
export const useSaleFlow = () => useContext(SaleFlowCtx)

export const CLOSE_REASONS = ['Bought elsewhere', 'Price too high', 'Not interested anymore', 'Not reachable', 'Wrong / duplicate lead', 'Other']

/**
 * Status flows that need more than flipping a value:
 *  - Confirmed: "was the sale successful?" then the order form in a right-hand side panel (no page change)
 *  - Closed: a reason is required and is written to the lead's activity timeline
 */
export function SaleFlowProvider({ children }: { children: ReactNode }) {
  const { confirm, notify } = useFeedback()
  const [orderFor, setOrderFor] = useState<number | null>(null)
  const [closeFor, setCloseFor] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [saving, setSaving] = useState(false)
  const opts = useRef<FlowOpts>({})
  const dirty = useRef(false)

  const openOrder = useCallback((id: number, o: FlowOpts = {}) => { opts.current = o; dirty.current = false; setOrderFor(id) }, [])

  const confirmSale = useCallback(async (id: number, o: FlowOpts = {}) => {
    const ok = await confirm(
      'Was this sale successful?',
      'If yes, fill in the order confirmation and the lead will be marked as Confirmed.',
      'Yes, confirm sale',
    )
    if (ok) { o.onYes?.(); openOrder(id, o) }
  }, [confirm, openOrder])

  const closeLead = useCallback((id: number, o: FlowOpts = {}) => {
    opts.current = o
    setReason(''); setDetail(''); setCloseFor(id)
  }, [])

  const closeOrder = () => {
    setOrderFor(null)
    if (dirty.current) opts.current.onDone?.()
  }

  const saveClose = async () => {
    if (!reason) return notify('Choose a reason for closing this lead', 'error')
    if (reason === 'Other' && !detail.trim()) return notify('Please describe the reason', 'error')
    setSaving(true)
    try {
      const text = reason === 'Other' ? detail.trim() : detail.trim() ? `${reason} — ${detail.trim()}` : reason
      await api.post(`/lead/customers/${closeFor}/activity`, { note: `Lead closed. Reason: ${text}`, status: 'closed' })
      notify('Lead closed')
      setCloseFor(null)
      opts.current.onYes?.()
      opts.current.onDone?.()
    } catch (e) {
      notify(errMsg(e, 'Could not close the lead'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SaleFlowCtx.Provider value={{ confirmSale, openOrder, closeLead }}>
      {children}

      {/* Order confirmation in a side panel */}
      <Drawer anchor="right" open={orderFor !== null} onClose={closeOrder} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 720, md: 860 } } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>Order confirmation</Typography>
          <IconButton onClick={closeOrder} aria-label="Close"><CloseIcon /></IconButton>
        </Box>
        {orderFor !== null && (
          <OrderForm key={orderFor} customerId={orderFor} embedded
            onSaved={() => { dirty.current = true }}
            onCancel={closeOrder}
            onDone={closeOrder} />
        )}
      </Drawer>

      {/* Closing a lead needs a reason */}
      <Dialog open={closeFor !== null} onClose={saving ? undefined : () => setCloseFor(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 0.5 }}>
          Close this lead?
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>Tell us why. The reason is saved in the lead's activity.</Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          <TextField select label="Reason *" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus>
            {CLOSE_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField label={reason === 'Other' ? 'Describe the reason *' : 'Details (optional)'} multiline minRows={2} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCloseFor(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="error" onClick={saveClose} disabled={saving}>{saving ? 'Closing…' : 'Close lead'}</Button>
        </DialogActions>
      </Dialog>
    </SaleFlowCtx.Provider>
  )
}
