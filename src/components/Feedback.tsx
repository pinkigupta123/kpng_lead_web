import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from '@mui/material'

interface Ctx {
  notify: (msg: string, severity?: 'success' | 'error' | 'info') => void
  confirm: (title: string, text: string, confirmLabel?: string, destructive?: boolean) => Promise<boolean>
}
const FeedbackCtx = createContext<Ctx>(null as unknown as Ctx)
export const useFeedback = () => useContext(FeedbackCtx)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null)
  const [dlg, setDlg] = useState<{ title: string; text: string; label: string; destructive: boolean } | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})

  const notify = useCallback((msg: string, severity: 'success' | 'error' | 'info' = 'success') => setSnack({ msg, severity }), [])
  const confirm = useCallback(
    (title: string, text: string, label = 'Confirm', destructive = false) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setDlg({ title, text, label, destructive })
      }),
    [],
  )
  const close = (v: boolean) => { setDlg(null); resolver.current(v) }

  return (
    <FeedbackCtx.Provider value={{ notify, confirm }}>
      {children}
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : undefined}
      </Snackbar>
      <Dialog open={!!dlg} onClose={() => close(false)}>
        <DialogTitle>{dlg?.title}</DialogTitle>
        <DialogContent><DialogContentText>{dlg?.text}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button onClick={() => close(true)} color={dlg?.destructive ? 'error' : 'primary'} variant="contained">{dlg?.label}</Button>
        </DialogActions>
      </Dialog>
    </FeedbackCtx.Provider>
  )
}
