import { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import api from '../api/client'

export interface WhatsAppLead {
  id: number
  name: string
  mobile: string
  interested_product?: string | null
}

export const templateText = (n: number, c: { name: string; interested_product?: string | null }) => {
  const product = c.interested_product || 'laptop service'
  switch (n) {
    case 1:
      return `Hello ${c.name},\n\nThank you for visiting our store. We have registered your enquiry regarding ${product}.\n\nPlease feel free to contact us if you have any questions.\n\nThank you.`
    case 2:
      return `Hello ${c.name},\n\nWe are following up regarding your enquiry.\n\nPlease let us know if you're interested.\n\nThank you.`
    default:
      return `Hello ${c.name},\n\nThank you for choosing us.\n\nIf you need any assistance, feel free to contact us anytime.\n\nRegards.`
  }
}

/**
 * "Send WhatsApp message" dialog: pick a template, edit the text, open WhatsApp.
 * Logs a "WhatsApp Sent" entry on the lead's timeline (best effort).
 */
export default function WhatsAppDialog({ lead, onClose, onSent }: { lead: WhatsAppLead | null; onClose: () => void; onSent?: () => void }) {
  const [tpl, setTpl] = useState(1)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (lead) {
      setTpl(1)
      setMsg(templateText(1, lead))
    }
  }, [lead])

  if (!lead) return null

  const send = async () => {
    const digits = lead.mobile.replace(/\D/g, '')
    const num = digits.length === 10 ? `91${digits}` : digits
    // open synchronously so the browser doesn't block the popup
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    onClose()
    try {
      await api.post(`/lead/customers/${lead.id}/timeline`, { action: 'WhatsApp Sent', remarks: `Sent WhatsApp Template ${tpl}` })
      onSent?.()
    } catch {
      /* timeline logging is best-effort */
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send WhatsApp message</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        <ToggleButtonGroup exclusive size="small" value={tpl} onChange={(_, v) => { if (v) { setTpl(v); setMsg(templateText(v, lead)) } }}>
          {[1, 2, 3].map((n) => <ToggleButton key={n} value={n}>Template {n}</ToggleButton>)}
        </ToggleButtonGroup>
        <TextField multiline minRows={6} label="Message" value={msg} onChange={(e) => setMsg(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" startIcon={<WhatsAppIcon />} onClick={send}>Open WhatsApp</Button>
      </DialogActions>
    </Dialog>
  )
}
