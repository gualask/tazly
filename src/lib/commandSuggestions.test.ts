import { describe, expect, it } from 'vitest'

import type { Project, Tag } from '@/types/domain'
import { buildSuggestions } from './commandSuggestions'

const tags: Tag[] = [
  { id: 't1', name: 'BUG', color: 'red' },
  { id: 't2', name: 'FEATURE', color: 'blue' },
]

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
const noFilters = { tagIds: [], categoryIds: [] }

describe('buildSuggestions — overview (nessun progetto in focus)', () => {
  it('lista progetti con conteggio task aperti', () => {
    const r = buildSuggestions({
      draft: '',
      focusProject: null,
      projects,
      tags,
      activeFilters: noFilters,
    })
    expect(r.map((s) => s.kind)).toEqual(['project', 'project'])
    expect(r[0]).toMatchObject({ kind: 'project', name: 'Alpha', openCount: 1 })
  })

  it('filtra per query e propone create-project se non esiste', () => {
    const r = buildSuggestions({
      draft: 'Gamma',
      focusProject: null,
      projects,
      tags,
      activeFilters: noFilters,
    })
    expect(r).toEqual([{ kind: 'create-project', name: 'Gamma' }])
  })

  it('non propone create-project se il nome esiste già', () => {
    const r = buildSuggestions({
      draft: 'Alpha',
      focusProject: null,
      projects,
      tags,
      activeFilters: noFilters,
    })
    expect(r.some((s) => s.kind === 'create-project')).toBe(false)
  })
})

describe('buildSuggestions — focus (filtri tag/categoria)', () => {
  it('propone tag e categorie, escludendo quelli già attivi', () => {
    const r = buildSuggestions({
      draft: '',
      focusProject: projectA,
      projects,
      tags,
      activeFilters: { tagIds: ['t1'], categoryIds: ['c1'] },
    })
    expect(r).toEqual([
      { kind: 'tag', tag: tags[1] },
      { kind: 'category', category: projectA.categories[1] },
    ])
  })

  it('filtra per query su tag e categorie', () => {
    const r = buildSuggestions({
      draft: 'front',
      focusProject: projectA,
      projects,
      tags,
      activeFilters: noFilters,
    })
    expect(r).toEqual([{ kind: 'category', category: projectA.categories[1] }])
  })
})
