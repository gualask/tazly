import { describe, expect, it } from 'vitest'

import type { Category, Tag } from '@/types/domain'
import { parseRapidInput } from './quickAddParse'

const tags: Tag[] = [
  { id: 't1', name: 'BUG', color: 'red' },
  { id: 't2', name: 'FEATURE', color: 'blue' },
]
const categories: Category[] = [{ id: 'c1', name: 'Backend', collapsed: false, order: 0 }]

describe('parseRapidInput', () => {
  it('interpreta categoria, titolo e tag risolti', () => {
    const r = parseRapidInput('Backend: fix login #bug', { categories, tags })
    expect(r).toEqual({ categoryName: 'Backend', title: 'fix login', tagIds: ['t1'] })
  })

  it('risolve più tag, ignorando il case', () => {
    const r = parseRapidInput('UI: nuovo header #bug #feature', { categories, tags })
    expect(r?.tagIds).toEqual(['t1', 't2'])
  })

  it('ritorna null senza i due punti', () => {
    expect(parseRapidInput('fix login', { categories, tags })).toBeNull()
  })

  it('ritorna null se nessun tag è risolvibile', () => {
    expect(parseRapidInput('Backend: fix login #inesistente', { categories, tags })).toBeNull()
    expect(parseRapidInput('Backend: fix login', { categories, tags })).toBeNull()
  })

  it('ritorna null con categoria o titolo vuoti', () => {
    expect(parseRapidInput('  : testo #bug', { categories, tags })).toBeNull()
  })
})
