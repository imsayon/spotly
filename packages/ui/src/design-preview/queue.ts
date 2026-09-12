export type Status = 'PENDING_ACCEPTANCE' | 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED'
export type Entry = { id: string; outletId: string; tokenNumber: number; status: Status; minutes: number }
export type Action = 'accept' | 'decline' | 'call' | 'serve' | 'miss' | 'leave'

export const MAIN_OUTLET_ID = '00000000-0000-4000-8000-000000000041'
export const NORTH_OUTLET_ID = '00000000-0000-4000-8000-000000000042'

const main = (tokenNumber: number) => `00000000-0000-4000-8000-0000000000${String(tokenNumber).padStart(2, '0')}`
const north = (tokenNumber: number) => `10000000-0000-4000-8000-0000000000${String(tokenNumber).padStart(2, '0')}`

export const initialQueues: Record<string, Entry[]> = {
  [MAIN_OUTLET_ID]: [
    { id: main(41), outletId: MAIN_OUTLET_ID, tokenNumber: 41, status: 'CALLED', minutes: 12 },
    ...[42, 43, 44, 45].map((tokenNumber, i): Entry => ({ id: main(tokenNumber), outletId: MAIN_OUTLET_ID, tokenNumber, status: 'WAITING', minutes: 10 - i * 2 })),
    ...[46, 47, 48].map((tokenNumber): Entry => ({ id: main(tokenNumber), outletId: MAIN_OUTLET_ID, tokenNumber, status: 'PENDING_ACCEPTANCE', minutes: 1 })),
  ],
  [NORTH_OUTLET_ID]: [
    { id: north(41), outletId: NORTH_OUTLET_ID, tokenNumber: 41, status: 'WAITING', minutes: 8 },
    { id: north(42), outletId: NORTH_OUTLET_ID, tokenNumber: 42, status: 'PENDING_ACCEPTANCE', minutes: 2 },
    { id: north(45), outletId: NORTH_OUTLET_ID, tokenNumber: 45, status: 'SERVED', minutes: 35 },
  ],
}

export const initialQueue = initialQueues[MAIN_OUTLET_ID]
export const queueForOutlet = (outletId: string) => (initialQueues[outletId] || []).map((entry) => ({ ...entry }))

// Preview only: production mutations remain authoritative on the server.
export function transition(entries: Entry[], action: Action, id?: string): Entry[] {
  const entry = entries.find((e) => e.id === id)
  const changes: Partial<Record<Action, { from: Status[]; to: Status }>> = {
    accept: { from: ['PENDING_ACCEPTANCE'], to: 'WAITING' },
    decline: { from: ['PENDING_ACCEPTANCE', 'WAITING'], to: 'MISSED' },
    serve: { from: ['CALLED'], to: 'SERVED' },
    miss: { from: ['CALLED'], to: 'MISSED' },
    leave: { from: ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'], to: 'CANCELLED' },
  }
  if (action === 'call') {
    if (entries.some((e) => e.status === 'CALLED')) return entries
    const next = entries.find((e) => e.status === 'WAITING')
    return next ? entries.map((e) => e.id === next.id ? { ...e, status: 'CALLED' } : e) : entries
  }
  const change = changes[action]
  if (!entry || !change || !change.from.includes(entry.status)) return entries
  return entries.map((e) => e.id === id ? { ...e, status: change.to } : e)
}
