import { orderHtml, type LeadOrder } from './orderHtml'

/** Opens the Order Confirmation sheet in a new tab and starts printing (the print dialog also offers "Save as PDF"). */
export function printOrder(order: LeadOrder) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.open()
  w.document.write(orderHtml(order))
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
  return true
}
