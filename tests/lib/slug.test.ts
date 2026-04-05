import { describe, it, expect } from 'vitest'
import { generateEventSlug } from '@/lib/slug'

describe('generateEventSlug', () => {
  it('creates a URL-friendly slug from title', () => {
    const slug = generateEventSlug('Dinner Jump Amsterdam Oost')
    expect(slug).toMatch(/^dinner-jump-amsterdam-oost-[a-z0-9_-]+$/)
  })
  it('handles special characters', () => {
    const slug = generateEventSlug('Dîner à la française!')
    expect(slug).not.toContain('!')
    expect(slug).not.toContain(' ')
  })
})
