const MINIMUM_DUOS = 9
const TABLE_SIZE = 3

export function computeDuoStatus(totalDuos: number): 'registered' | 'waitlisted' | 'confirmed' {
  if (totalDuos < MINIMUM_DUOS) return 'registered'
  if (totalDuos === MINIMUM_DUOS) return 'confirmed'
  const afterMinimum = totalDuos - MINIMUM_DUOS
  if (afterMinimum % TABLE_SIZE === 0) return 'confirmed'
  return 'waitlisted'
}

export type WaitlistInfo = {
  duosNeeded: number
  phase: 'minimum' | 'waitlist' | 'confirmed'
  confirmedDuos: number
}

export function computeWaitlistInfo(totalPaidDuos: number): WaitlistInfo {
  if (totalPaidDuos < MINIMUM_DUOS) {
    return { duosNeeded: MINIMUM_DUOS - totalPaidDuos, phase: 'minimum', confirmedDuos: 0 }
  }
  const afterMinimum = totalPaidDuos - MINIMUM_DUOS
  const remainder = afterMinimum % TABLE_SIZE
  if (remainder === 0) {
    return { duosNeeded: 0, phase: 'confirmed', confirmedDuos: totalPaidDuos }
  }
  return { duosNeeded: TABLE_SIZE - remainder, phase: 'waitlist', confirmedDuos: totalPaidDuos - remainder }
}
