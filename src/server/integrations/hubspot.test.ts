import { describe, it, expect } from 'vitest'
import { __internals } from './hubspot'

describe('hubspot internals', () => {
  it('slugify removes accents and non-alphanum', () => {
    expect(__internals.slugify('Família Silva')).toBe('familia-silva')
  })
  it('slugify truncates long strings', () => {
    const long = 'a'.repeat(100)
    expect(__internals.slugify(long).length).toBe(60)
  })
  it('slugify handles leading/trailing hyphens', () => {
    expect(__internals.slugify('  Hello World  ')).toBe('hello-world')
  })
})
