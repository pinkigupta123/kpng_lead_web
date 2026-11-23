import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, Chip, CircularProgress, IconButton, MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import PrintIcon from '@mui/icons-material/Print'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNavigate, useParams } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useFeedback } from '../components/Feedback'
import { useAuth } from '../store/auth'
import { useLeadOptions } from '../hooks/useLeadOptions'
import { localDate } from '../dates'
import PageHeader from '../components/PageHeader'
import { METHOD_LABEL, money, paymentLine, type LeadOrder, type PayMethod } from '../orderHtml'
import { printOrder } from '../orderPrint'

type ItemRow = { particulars: string; unit: string; amount: string }
type PayRow = { method: PayMethod; provider: string; customProvider: string; amount: string; cashback: string; reference: string }

const METHODS: PayMethod[] = ['cash', 'card', 'upi', 'imps', 'finance', 'cheque']
const emptyItem = (): ItemRow => ({ particulars: '', unit: '1', amount: '' })
const emptyPay = (): PayRow => ({ method: 'cash', provider: '', customProvider: '', amount: '', cashback: '', reference: '' })
const num = (s: string) => Number(String(s).replace(/,/g, '')) || 0
const hasProvider = (m: PayMethod) => m === 'card' || m === 'upi' || m === 'finance'

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <Card sx={{ p: 2.5, mb: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
    {hint && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{hint}</Typography>}
    {!hint && <Box sx={{ mb: 1.5 }} />}
    {children}
  </Card>
)

/**
 * Order Confirmation form: filled when a lead turns into a sale. Saving it marks the lead as Confirmed (Purchased),
 * keeps the order on the lead, and the order can be printed / saved as a PDF that looks like the paper form.
 */
export function OrderForm({ customerId, embedded = false, onCancel, onDone, onSaved }: {
  customerId: number
  /** shown inside the side drawer: no page header, tighter layout */
  embedded?: boolean
  onCancel: () => void
  /** called when the user is finished (after saving, or "Back to lead") */
  onDone: (saved: boolean) => void
  /** called right after the order is saved (the lead is now Confirmed) so the caller can refresh */
  onSaved?: () => void
}) {
  const id = customerId
  const { notify, confirm } = useFeedback()
  const me = useAuth((s) => s.user)
  const { options } = useLeadOptions()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<LeadOrder | null>(null)
  const [existing, setExisting] = useState(false)

  const [orderDate, setOrderDate] = useState(localDate())
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [gst, setGst] = useState('')
  const [items, setItems] = useState<ItemRow[]>([emptyItem()])
  const [pays, setPays] = useState<PayRow[]>([emptyPay()])
  const [offers, setOffers] = useState<string[]>([])
  const [offerOther, setOfferOther] = useState('')
  const [salesPerson, setSalesPerson] = useState(me?.name || '')
  const [store, setStore] = useState(me?.branch || '')
  const [cashCounter, setCashCounter] = useState('')
  const [verifiedBy, setVerifiedBy] = useState('')
  const [notes, setNotes] = useState('')

  const fill = (o: LeadOrder) => {
    setOrderDate(String(o.order_date).slice(0, 10))
    setName(o.name); setAddress(o.address || ''); setMobile(o.mobile); setEmail(o.email || ''); setGst(o.gst_no || '')
    setItems(o.items.length ? o.items.map((i) => ({ particulars: i.particulars, unit: i.unit || '', amount: String(i.amount) })) : [emptyItem()])
    setPays(o.payments.length ? o.payments.map((p) => ({
      method: p.method, provider: p.provider || '', customProvider: '', amount: String(p.amount), cashback: p.cashback ? String(p.cashback) : '', reference: p.reference || '',
    })) : [emptyPay()])
    setOffers(o.offers || [])
    setSalesPerson(o.sales_person || ''); setStore(o.store || ''); setCashCounter(o.cash_counter || ''); setVerifiedBy(o.verified_by || ''); setNotes(o.notes || '')
  }

  useEffect(() => {
    let live = true
    Promise.all([api.get(`/lead/customers/${id}`), api.get(`/lead/customers/${id}/order`)])
      .then(([lead, ord]) => {
        if (!live) return
        const o: LeadOrder | null = ord.data?.order ?? null
        if (o) { fill(o); setExisting(true) } else {
          const c = lead.data?.data || lead.data
          setName(c.name || ''); setMobile(c.mobile || ''); setEmail(c.email || '')
          setAddress([c.company, c.city].filter(Boolean).join(', '))
          setItems([{ particulars: c.interested_product || '', unit: '1', amount: '' }])
        }
      })
      .catch(() => { notify('Could not load this lead', 'error'); onCancel() })
      .finally(() => live && setLoading(false))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const total = useMemo(() => items.reduce((s, i) => s + num(i.amount), 0), [items])
  const paid = useMemo(() => pays.reduce((s, p) => s + num(p.amount), 0), [pays])
  const mismatch = Math.abs(total - paid) > 0.009
  const providersFor = (m: PayMethod) =>
    (m === 'card' ? options.card_provider : m === 'upi' ? options.upi_provider : m === 'finance' ? options.finance_provider : []).map((o) => o.label)

  const setItem = (i: number, patch: Partial<ItemRow>) => setItems((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const setPay = (i: number, patch: Partial<PayRow>) => setPays((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)))

  const validate = (): string | null => {
    if (!name.trim()) return 'Enter the customer name.'
    if (!/^[0-9]{10}$/.test(mobile.trim())) return 'Enter a valid 10-digit mobile number.'
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.'
    if (gst.trim() && !/^[0-9A-Za-z]{15}$/.test(gst.trim())) return 'GST number must be 15 letters / digits.'
    const filled = items.filter((i) => i.particulars.trim() || i.amount)
    if (!filled.length) return 'Add at least one item (particulars and amount).'
    if (filled.some((i) => !i.particulars.trim() || !(num(i.amount) > 0))) return 'Every item needs particulars and an amount.'
    const pf = pays.filter((p) => p.amount)
    if (!pf.length) return 'Add at least one payment with an amount.'
    for (const p of pf) {
      if (hasProvider(p.method) && !p.provider) return `Choose the ${METHOD_LABEL[p.method]} provider.`
    }
    return null
  }

  const save = async () => {
    const problem = validate()
    if (problem) { setError(problem); return }
    if (mismatch && !(await confirm('Payments do not match the total', `Order total ${money(total)} but payments add up to ${money(paid)}. Save anyway?`, 'Save anyway'))) return
    setSaving(true); setError('')
    try {
      const body = {
        order_date: orderDate,
        name: name.trim(), address: address.trim() || null, mobile: mobile.trim(), email: email.trim() || null, gst_no: gst.trim() ? gst.trim().toUpperCase() : null,
        items: items.filter((i) => i.particulars.trim() || i.amount).map((i) => ({ particulars: i.particulars.trim(), unit: i.unit.trim() || null, amount: num(i.amount) })),
        payments: pays.filter((p) => p.amount).map((p) => ({
          method: p.method,
          provider: hasProvider(p.method) ? (p.provider === 'Other' ? (p.customProvider.trim() || 'Other') : p.provider) || null : null,
          amount: num(p.amount), cashback: p.cashback ? num(p.cashback) : null, reference: p.reference.trim() || null,
        })),
        offers: [...offers, ...(offerOther.trim() ? [offerOther.trim()] : [])],
        sales_person: salesPerson.trim() || null, store: store.trim() || null, cash_counter: cashCounter.trim() || null,
        verified_by: verifiedBy.trim() || null, notes: notes.trim() || null,
      }
      const r = await api.post(`/lead/customers/${id}/order`, body)
      setSaved(r.data.order)
      onSaved?.()
    } catch (e) {
      setError(errMsg(e, 'Could not save the order. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>

  /* ───── saved ───── */
  if (saved) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', p: embedded ? 2 : 0 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>Sale confirmed</Typography>
          <Typography color="text.secondary">{saved.name}</Typography>
          <Typography color="primary" sx={{ fontWeight: 800, fontSize: '1.15rem', mt: 2 }}>{saved.order_no}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.8rem' }}>{money(saved.total)}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {saved.payments.map((p) => `${paymentLine(p)} ${money(p.amount)}`).join('  ·  ')}
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => { if (!printOrder(saved)) notify('Allow pop-ups to print the order', 'error') }}>
              Print / save as PDF
            </Button>
            <Button variant="outlined" onClick={() => setSaved(null)}>Edit order</Button>
            <Button onClick={() => onDone(true)}>{embedded ? 'Done' : 'Back to lead'}</Button>
          </Stack>
        </Card>
      </Box>
    )
  }

  /* ───── form ───── */
  return (
    <Box sx={{ width: '100%', maxWidth: embedded ? undefined : 900, mx: 'auto', p: embedded ? 2.5 : 0, boxSizing: 'border-box' }}>
      {!embedded && (
        <PageHeader
          title={existing ? 'Edit order' : 'Order confirmation'}
          subtitle={existing ? 'Update the order details.' : 'Fill this in to confirm the sale. The lead is marked Confirmed when you save.'}
        />
      )}
      {embedded && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {existing ? 'Update the order details.' : 'Fill this in to confirm the sale. The lead is marked Confirmed when you save.'}
        </Typography>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Section title="Customer">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <TextField size="small" type="date" label="Date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" label="GST No." value={gst} onChange={(e) => setGst(e.target.value.toUpperCase())} slotProps={{ htmlInput: { maxLength: 15 } }} />
          <TextField size="small" label="Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField size="small" label="Mobile *" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))} slotProps={{ htmlInput: { maxLength: 10 } }} />
          <TextField size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField size="small" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Box>
      </Section>

      <Section title="Items" hint="What the customer is buying">
        <Stack spacing={1.5}>
          {items.map((it, i) => (
            <Box key={i} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 64px 110px 36px', sm: '1fr 90px 150px 40px' }, alignItems: 'center' }}>
              <TextField size="small" label="Particulars *" value={it.particulars} onChange={(e) => setItem(i, { particulars: e.target.value })} />
              <TextField size="small" label="Unit" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
              <TextField size="small" label="Amount (₹) *" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value.replace(/[^0-9.]/g, '') })} />
              <IconButton size="small" color="error" disabled={items.length === 1} onClick={() => setItems((r) => r.filter((_, k) => k !== i))}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Box>
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setItems((r) => [...r, emptyItem()])}>Add item</Button>
          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>Total {money(total)}</Typography>
        </Box>
      </Section>

      <Section title="Payment details" hint="One line for each way the customer paid">
        <Stack spacing={2}>
          {pays.map((p, i) => (
            <Box key={i} sx={{ p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <TextField select size="small" label="Method" sx={{ width: 160 }} value={p.method} onChange={(e) => setPay(i, { method: e.target.value as PayMethod, provider: '', customProvider: '', cashback: '' })}>
                  {METHODS.map((m) => <MenuItem key={m} value={m}>{METHOD_LABEL[m]}</MenuItem>)}
                </TextField>
                {hasProvider(p.method) ? (
                  <TextField select size="small" sx={{ flex: '1 1 200px', minWidth: 180 }} label={`${METHOD_LABEL[p.method]} provider *`} value={p.provider} onChange={(e) => setPay(i, { provider: e.target.value })}>
                    {providersFor(p.method).map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                ) : null}
                <TextField size="small" sx={{ flex: '1 1 150px', minWidth: 130 }} label="Amount (₹) *" value={p.amount} onChange={(e) => setPay(i, { amount: e.target.value.replace(/[^0-9.]/g, '') })} />
                {(p.method === 'card' || p.method === 'upi')
                  ? <TextField size="small" sx={{ flex: '1 1 130px', minWidth: 120 }} label="Cash back (₹)" value={p.cashback} onChange={(e) => setPay(i, { cashback: e.target.value.replace(/[^0-9.]/g, '') })} />
                  : null}
                <IconButton size="small" color="error" sx={{ ml: 'auto' }} disabled={pays.length === 1} onClick={() => setPays((r) => r.filter((_, k) => k !== i))}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1.5 }}>
                {p.provider === 'Other' && hasProvider(p.method) && (
                  <TextField size="small" label="Provider name" value={p.customProvider} onChange={(e) => setPay(i, { customProvider: e.target.value })} />
                )}
                {p.method !== 'cash' && (
                  <TextField size="small" label={p.method === 'cheque' ? 'Cheque no.' : 'Reference / transaction ID'} value={p.reference} onChange={(e) => setPay(i, { reference: e.target.value })} />
                )}
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setPays((r) => [...r, emptyPay()])}>Add payment</Button>
          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: mismatch ? 'warning.main' : 'success.main' }}>Paid {money(paid)}</Typography>
        </Box>
        {mismatch && <Alert severity="warning" sx={{ mt: 1.5 }}>Payments {paid > total ? 'are more than' : 'are less than'} the order total ({money(total)}).</Alert>}
      </Section>

      <Section title="Offers" hint="Tick what the customer was given">
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {options.order_offer.map((o) => (
            <Chip key={o.id} label={o.label} clickable color={offers.includes(o.label) ? 'primary' : 'default'} variant={offers.includes(o.label) ? 'filled' : 'outlined'}
              onClick={() => setOffers((r) => (r.includes(o.label) ? r.filter((x) => x !== o.label) : [...r, o.label]))} />
          ))}
        </Stack>
        <TextField size="small" fullWidth sx={{ mt: 1.5 }} label="Any other offer" value={offerOther} onChange={(e) => setOfferOther(e.target.value)} />
      </Section>

      <Section title="Hand-over">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <TextField size="small" label="Sales person" value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} />
          <TextField size="small" label="Our store" value={store} onChange={(e) => setStore(e.target.value)} />
          <TextField size="small" label="Cash counter" value={cashCounter} onChange={(e) => setCashCounter(e.target.value)} />
          <TextField size="small" label="Material verified & handed over by" value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} />
          <TextField size="small" label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ gridColumn: embedded ? undefined : { sm: '1 / -1' } }} />
        </Box>
      </Section>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 4 }}>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : existing ? 'Save changes' : 'Confirm sale'}</Button>
      </Box>
    </Box>
  )
}

/** Standalone page version (kept for direct links to /leads/:id/order). */
export default function OrderConfirmation() {
  const { id } = useParams()
  const nav = useNavigate()
  const back = () => nav(`/leads/${id}`)
  return <OrderForm customerId={Number(id)} onCancel={back} onDone={back} />
}
