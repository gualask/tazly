import { describe, expect, it } from 'vitest'

import type { Category, Project, Task } from '@/types/domain'
import { buildNavItems, categoryJumpTarget, navIndexOf } from './useBoardNav'

function category(id: string, order: number, collapsed = false): Category {
  return { id, name: id, collapsed, order }
}

function task(id: string, categoryId: string): Task {
  return { id, title: id, categoryId, tagIds: [], done: false, createdAt: 0 }
}

function project(categories: Category[], tasks: Task[]): Project {
  return { id: 'p', name: 'p', categories, tasks, notes: '' }
}

const acceptAll = () => true

describe('buildNavItems', () => {
  it('intervalla header categoria e task in ordine di rendering', () => {
    const p = project(
      [category('b', 1), category('a', 0)],
      [task('t1', 'a'), task('t2', 'b'), task('t3', 'a')],
    )
    expect(buildNavItems(p, acceptAll)).toEqual([
      { kind: 'header', categoryId: 'a' },
      { kind: 'task', id: 't1', categoryId: 'a' },
      { kind: 'task', id: 't3', categoryId: 'a' },
      { kind: 'header', categoryId: 'b' },
      { kind: 'task', id: 't2', categoryId: 'b' },
    ])
  })

  it('una categoria collassata mostra l’header ma non i suoi task', () => {
    const p = project([category('a', 0, true)], [task('t1', 'a')])
    expect(buildNavItems(p, acceptAll)).toEqual([{ kind: 'header', categoryId: 'a' }])
  })

  it('applica il filtro task', () => {
    const p = project([category('a', 0)], [task('t1', 'a'), task('t2', 'a')])
    const items = buildNavItems(p, (t) => t.id === 't2')
    expect(items).toEqual([
      { kind: 'header', categoryId: 'a' },
      { kind: 'task', id: 't2', categoryId: 'a' },
    ])
  })
})

describe('navIndexOf', () => {
  const items = buildNavItems(
    project([category('a', 0)], [task('t1', 'a'), task('t2', 'a')]),
    acceptAll,
  )

  it('trova il task selezionato', () => {
    expect(navIndexOf(items, 't2', null)).toBe(2)
  })

  it('trova l’header categoria selezionato', () => {
    expect(navIndexOf(items, null, 'a')).toBe(0)
  })

  it('ritorna -1 senza selezione', () => {
    expect(navIndexOf(items, null, null)).toBe(-1)
  })
})

describe('categoryJumpTarget', () => {
  const sortedCategoryIds = ['a', 'b', 'c']

  describe('verso il basso', () => {
    it('senza selezione salta alla prima categoria', () => {
      expect(
        categoryJumpTarget('down', {
          sortedCategoryIds,
          selectedCategoryId: null,
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'select', id: 'a' })
    })

    it('salta alla categoria successiva rispetto a quella selezionata', () => {
      expect(
        categoryJumpTarget('down', {
          sortedCategoryIds,
          selectedCategoryId: 'a',
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'select', id: 'b' })
    })

    it('usa la categoria del task selezionato come punto di partenza', () => {
      expect(
        categoryJumpTarget('down', {
          sortedCategoryIds,
          selectedCategoryId: null,
          selectedTaskCategoryId: 'b',
        }),
      ).toEqual({ type: 'select', id: 'c' })
    })

    it('sull’ultima categoria non fa nulla', () => {
      expect(
        categoryJumpTarget('down', {
          sortedCategoryIds,
          selectedCategoryId: 'c',
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'none' })
    })
  })

  describe('verso l’alto', () => {
    it('da un task risale all’header della sua categoria', () => {
      expect(
        categoryJumpTarget('up', {
          sortedCategoryIds,
          selectedCategoryId: null,
          selectedTaskCategoryId: 'b',
        }),
      ).toEqual({ type: 'select', id: 'b' })
    })

    it('da una categoria intermedia salta a quella precedente', () => {
      expect(
        categoryJumpTarget('up', {
          sortedCategoryIds,
          selectedCategoryId: 'b',
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'select', id: 'a' })
    })

    it('sopra la prima categoria segnala l’uscita verso l’alto', () => {
      expect(
        categoryJumpTarget('up', {
          sortedCategoryIds,
          selectedCategoryId: 'a',
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'exitTop' })
    })

    it('senza alcuna selezione non fa nulla', () => {
      expect(
        categoryJumpTarget('up', {
          sortedCategoryIds,
          selectedCategoryId: null,
          selectedTaskCategoryId: null,
        }),
      ).toEqual({ type: 'none' })
    })
  })
})
