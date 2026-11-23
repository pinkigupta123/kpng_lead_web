import { useSaleFlow } from '../components/SaleFlow'

/**
 * Choosing the "Confirmed" (purchased) status is a sale confirmation: ask whether the sale really happened and, if yes,
 * open the Order Confirmation form in a side panel. Saving that form is what marks the lead as Confirmed.
 * `onYes` runs when the user agrees; `onDone` runs after the order is saved (use it to refresh the screen).
 */
export function useConfirmSale() {
  const { confirmSale } = useSaleFlow()
  return (customerId: number, onYes?: () => void, onDone?: () => void) => confirmSale(customerId, { onYes, onDone })
}

/** Closing a lead asks for a reason first. */
export function useCloseLead() {
  const { closeLead } = useSaleFlow()
  return (customerId: number, onDone?: () => void, onYes?: () => void) => closeLead(customerId, { onYes, onDone })
}
