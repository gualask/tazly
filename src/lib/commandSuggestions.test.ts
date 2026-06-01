import { describe, expect, it } from 'vitest'

import type { Project } from '@/types/domain'
import { buildSuggestions } from './commandSuggestions'

const projectA: Project = {
  id: 'p1',
  name: 'Alpha',
  notes: '',
  categories: [
    { id: 'c1', name: 'Backend', collapsed: false, order: 0 },
    { id: 'c2', name: 'Frontend', collapsed: false, order: 1 },
  ],
  tasks: [
    { id: 'k1', title: 'a', categoryId: 'c1', tagIds: [], done: false, createdAt: 0 },
    { id: 'k2', title: 'b', categoryId: 'c1', tagIds: [], done: true, createdAt: 0 },
  ],
}
const projects: Project[] = [projectA, { ...projectA, id: 'p2', name: 'Beta', tasks: [] }]

describe('buildSuggestions — selezione progetto', () => {
  it('lista progetti con conteggio task aperti', () => {
    const r = buildSuggestions({ draft: '', projects })
    expect(r.map((s) => s.kind)).toEqual(['project', 'project'])
    expect(r[0]).toMatchObject({ kind: 'project', name: 'Alpha', openCount: 1 })
  })

  it('filtra per query e propone create-project se non esiste', () => {
    const r = buildSuggestions({ draft: 'Gamma', projects })
    expect(r).toEqual([{ kind: 'create-project', name: 'Gamma' }])
  })

  it('non propone create-project se il nome esiste già', () => {
    const r = buildSuggestions({ draft: 'Alpha', projects })
    expect(r.some((s) => s.kind === 'create-project')).toBe(false)
  })
})
