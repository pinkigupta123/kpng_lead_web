/** The Order Confirmation sheet as printable HTML (mirrors the paper form). Used for PDF / share / print. */

export type PayMethod = 'cash' | 'card' | 'upi' | 'imps' | 'finance' | 'cheque';

export interface OrderItem { particulars: string; unit?: string | null; amount: number }
export interface OrderPayment { method: PayMethod; provider?: string | null; amount: number; cashback?: number | null; reference?: string | null }
export interface LeadOrder {
  id: number;
  customer_id: number;
  order_no: string | null;
  order_date: string;
  name: string;
  address?: string | null;
  mobile: string;
  email?: string | null;
  gst_no?: string | null;
  items: OrderItem[];
  total: number;
  payments: OrderPayment[];
  offers?: string[] | null;
  sales_person?: string | null;
  store?: string | null;
  cash_counter?: string | null;
  verified_by?: string | null;
  notes?: string | null;
}

export const METHOD_LABEL: Record<PayMethod, string> = {
  cash: 'Cash', card: 'Card', upi: 'UPI', imps: 'IMPS', finance: 'Finance', cheque: 'Cheque',
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const money = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const prettyDate = (d: string) => {
  const x = new Date(String(d).slice(0, 10) + 'T00:00:00');
  return isNaN(x.getTime()) ? d : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function paymentLine(p: OrderPayment): string {
  const parts = [METHOD_LABEL[p.method] || p.method];
  if (p.provider) parts.push(`(${p.provider})`);
  return parts.join(' ');
}

export function orderHtml(o: LeadOrder, company = 'KPNG Technologies'): string {
  const rows = Array.from({ length: Math.max(6, o.items.length) }, (_, i) => o.items[i]);
  const itemRows = rows.map((it, i) => `
    <tr>
      <td class="c">${it ? i + 1 : ''}</td>
      <td>${it ? esc(it.particulars) : '&nbsp;'}</td>
      <td class="c">${it ? esc(it.unit) : ''}</td>
      <td class="r">${it ? Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
    </tr>`).join('');

  const payRows = o.payments.map((p) => `
    <tr>
      <td>${esc(paymentLine(p))}${p.reference ? ` <span class="muted">· ${esc(p.reference)}</span>` : ''}</td>
      <td class="r">${Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td class="r">${p.cashback ? `Cash back ${Number(p.cashback).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''}</td>
    </tr>`).join('');

  const paid = o.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; margin: 0; }
  h1 { text-align: center; font-size: 24px; letter-spacing: 1px; margin: 0 0 4px; }
  .company { text-align: center; color: #555; margin-bottom: 10px; }
  .meta { display: flex; justify-content: space-between; margin: 8px 0; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #111; padding: 6px 8px; vertical-align: top; }
  th { background: #f1f1f1; text-align: center; }
  .lbl { width: 22%; font-weight: 700; background: #fafafa; }
  .c { text-align: center; } .r { text-align: right; }
  .muted { color: #666; }
  .box { border: 1px solid #111; padding: 8px 10px; }
  .sec { margin-top: 10px; }
  .sec h3 { margin: 0 0 4px; font-size: 13px; }
  .sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; }
  .sign div { border-top: 1px solid #111; padding-top: 4px; min-width: 150px; text-align: center; }
  .terms { font-size: 11px; line-height: 1.5; margin-top: 10px; }
  .total td { font-weight: 700; background: #f1f1f1; }
</style></head>
<body>
  <h1>ORDER CONFIRMATION</h1>
  <div class="company">${esc(company)}</div>
  <div class="meta"><span>Sr. No.: ${esc(o.order_no || '')}</span><span>Date: ${esc(prettyDate(o.order_date))}</span></div>

  <table>
    <tr><td class="lbl">Name:</td><td>${esc(o.name)}</td></tr>
    <tr><td class="lbl">Address:</td><td>${esc(o.address || '')}</td></tr>
    <tr><td class="lbl">Mobile:</td><td>${esc(o.mobile)}</td></tr>
    <tr><td class="lbl">Email:</td><td>${esc(o.email || '')}</td></tr>
    <tr><td class="lbl">GST No.:</td><td>${esc(o.gst_no || '')}</td></tr>
  </table>

  <table class="sec">
    <tr><th style="width:8%">Sl.</th><th>Particulars</th><th style="width:14%">Unit</th><th style="width:20%">Amount (Rs.)</th></tr>
    ${itemRows}
    <tr class="total"><td colspan="3" class="r">Total</td><td class="r">${Number(o.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
  </table>

  <div class="sec">
    <h3>Payment Details</h3>
    <table>
      ${payRows}
      <tr class="total"><td>Total paid</td><td class="r">${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td></td></tr>
    </table>
  </div>

  ${o.offers && o.offers.length ? `<div class="sec box"><b>Offers:</b> ${o.offers.map(esc).join(' &nbsp;|&nbsp; ')}</div>` : ''}
  ${o.notes ? `<div class="sec box"><b>Notes:</b> ${esc(o.notes)}</div>` : ''}

  <table class="sec">
    <tr>
      <td><b>Sales Person:</b> ${esc(o.sales_person || '')}</td>
      <td><b>Our from Store:</b> ${esc(o.store || '')}</td>
      <td><b>Cash counter:</b> ${esc(o.cash_counter || '')}</td>
    </tr>
    <tr><td colspan="3"><b>Material verified &amp; handed over to customer by:</b> ${esc(o.verified_by || '')}</td></tr>
  </table>

  <div class="terms">
    1. We accept payment by (Cash, Card, Cheque, Transfer, Demand Draft &amp; Finance)<br>
    2. Card swiping charges <b>@2% extra</b> applicable on all master &amp; Visa &amp; other card payments<br>
    3. In case of Cheque or DD, delivery on the realization of cheque &amp; subject of material
  </div>

  <div class="sign"><span></span><div>Customer Signature</div></div>
</body></html>`;
}
