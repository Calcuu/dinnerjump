import { describe, it, expect } from 'vitest'
import { computeDuoStatus, computeWaitlistInfo } from '@/lib/waitlist'

describe('computeDuoStatus', () => {
  it('returns registered when total < 9', () => { expect(computeDuoStatus(5)).toBe('registered') })
  it('returns confirmed when total reaches exactly 9', () => { expect(computeDuoStatus(9)).toBe('confirmed') })
  it('returns waitlisted when total is 10', () => { expect(computeDuoStatus(10)).toBe('waitlisted') })
  it('returns waitlisted when total is 11', () => { expect(computeDuoStatus(11)).toBe('waitlisted') })
  it('returns confirmed when total is 12', () => { expect(computeDuoStatus(12)).toBe('confirmed') })
  it('returns waitlisted when total is 13', () => { expect(computeDuoStatus(13)).toBe('waitlisted') })
  it('returns confirmed when total is 15', () => { expect(computeDuoStatus(15)).toBe('confirmed') })
})

describe('computeWaitlistInfo', () => {
  it('returns duos needed for minimum when < 9', () => {
    const info = computeWaitlistInfo(5)
    expect(info.duosNeeded).toBe(4)
    expect(info.phase).toBe('minimum')
  })
  it('returns 0 needed when exactly at threshold', () => {
    const info = computeWaitlistInfo(9)
    expect(info.duosNeeded).toBe(0)
    expect(info.phase).toBe('confirmed')
  })
  it('returns duos needed for next table when > 9', () => {
    const info = computeWaitlistInfo(10)
    expect(info.duosNeeded).toBe(2)
    expect(info.phase).toBe('waitlist')
  })
  it('returns 1 needed when 1 away from next table', () => {
    const info = computeWaitlistInfo(11)
    expect(info.duosNeeded).toBe(1)
    expect(info.phase).toBe('waitlist')
  })
  it('returns 0 needed at 12', () => {
    const info = computeWaitlistInfo(12)
    expect(info.duosNeeded).toBe(0)
    expect(info.phase).toBe('confirmed')
  })
})
