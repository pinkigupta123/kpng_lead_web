import { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ShareIcon from '@mui/icons-material/Share'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { useFeedback } from './Feedback'

export interface ShareLead {
  id?: number
  name: string
  mobile: string
  interested_product?: string | null
}

export const welcomeMessage = (name: string, product?: string | null) =>
  `Hello ${name},\n\nThank you for visiting KPMG Laptop Sales & Services! 🎉\n\nWe have successfully registered your enquiry regarding *${product || 'Laptop Service'}*.\n\nOur team will reach out to you shortly.\n\nFor any queries, feel free to contact us.\n\nThank you for choosing KPMG! 🙏`

/**
 * Share dialog for a lead: edit the message, then Copy / Share / WhatsApp.
 * `created` shows the "Lead added" header (used right after creating a lead).
 */
export default function ShareLeadDialog({ lead, created = false, onClose }: { lead: ShareLead | null; created?: boolean; onClose: () => void }) {
  const { notify } = useFeedback()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (lead) setMsg(welcomeMessage(lead.name, lead.interested_product))
  }, [lead])

  if (!lead) return null

  const digits = lead.mobile.replace(/\D/g, '')
  const number = digits.length === 10 ? `91${digits}` : digits
  const wa = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg)
      notify('Message copied')
    } catch {
      notify('Could not copy', 'error')
    }
  }

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: msg }) } catch { /* cancelled */ }
    } else {
      copy()
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        {created ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 34 }} />
            <Box>
              Lead added
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>{lead.name} · {lead.mobile}</Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            Share with {lead.name}
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>{lead.mobile}</Typography>
          </Box>
        )}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {created ? 'Send a welcome message to the customer?' : 'Edit the message if needed, then share it.'}
        </Typography>
        <TextField fullWidth multiline minRows={7} value={msg} onChange={(e) => setMsg(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} sx={{ mr: 'auto' }}>{created ? 'Skip for now' : 'Close'}</Button>
        <Button startIcon={<ContentCopyIcon />} onClick={copy}>Copy</Button>
        <Button startIcon={<ShareIcon />} onClick={share}>Share</Button>
        <Button variant="contained" color="success" startIcon={<WhatsAppIcon />} href={wa} target="_blank" rel="noopener" onClick={onClose}>
          WhatsApp
        </Button>
      </DialogActions>
    </Dialog>
  )
}
