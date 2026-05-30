import { describe, expect, it } from 'vitest'

import type { CategoryId, TagId } from '@/types/domain'
import {
  initialQuickAddState,
  type QuickAddState,
  type QuickAddStep,
  quickAddReducer,
} from './quickAddReducer'

const cat = (s: string) => s as CategoryId
const tag = (s: string) => s as TagId

function state(overrides: Partial<QuickAddState> = {}): QuickAddState {
  return { ...initialQuickAddState, ...overrides }
}

describe('quickAddReducer', () => {
  describe('navigazione bozza/dropdown', () => {
    it('SET_CATEGORY_DRAFT aggiorna la bozza e azzera l’highlight', () => {
      const next = quickAddReducer(state({ activeIdx: 3 }), {
        type: 'SET_CATEGORY_DRAFT',
        value: 'back',
      })
      expect(next.categoryDraft).toBe('back')
      expect(next.activeIdx).toBe(0)
    })

    it('SET_TITLE_DRAFT non tocca l’highlight (lo step titolo non ha dropdown)', () => {
      const next = quickAddReducer(state({ activeIdx: 2 }), {
        type: 'SET_TITLE_DRAFT',
        value: 'fix',
      })
      expect(next.titleDraft).toBe('fix')
      expect(next.activeIdx).toBe(2)
    })

    it('MOVE_ACTIVE clampa entro [0, length-1]', () => {
      const s = state({ activeIdx: 0 })
      expect(quickAddReducer(s, { type: 'MOVE_ACTIVE', delta: -1, length: 3 }).activeIdx).toBe(0)
      const s2 = state({ activeIdx: 2 })
      expect(quickAddReducer(s2, { type: 'MOVE_ACTIVE', delta: 1, length: 3 }).activeIdx).toBe(2)
      const s3 = state({ activeIdx: 1 })
      expect(quickAddReducer(s3, { type: 'MOVE_ACTIVE', delta: 1, length: 3 }).activeIdx).toBe(2)
    })
  })

  describe('avanzamento category → title → tags', () => {
    it('CONFIRM_CATEGORY blocca la categoria, pulisce la bozza e passa al titolo', () => {
      const next = quickAddReducer(state({ categoryDraft: 'back', activeIdx: 2 }), {
        type: 'CONFIRM_CATEGORY',
        id: cat('c1'),
        name: 'Backend',
      })
      expect(next).toMatchObject({
        lockedCategoryId: cat('c1'),
        lockedCategoryName: 'Backend',
        categoryDraft: '',
        step: 'title',
        activeIdx: 0,
      })
    })

    it('COMMIT_TITLE blocca il titolo (trimmato) e passa ai tag', () => {
      const next = quickAddReducer(state({ step: 'title', titleDraft: '  fix login  ' }), {
        type: 'COMMIT_TITLE',
      })
      expect(next.lockedTitle).toBe('fix login')
      expect(next.step).toBe('tags')
    })

    it('COMMIT_TITLE è no-op se il titolo è vuoto', () => {
      const s = state({ step: 'title', titleDraft: '   ' })
      expect(quickAddReducer(s, { type: 'COMMIT_TITLE' })).toBe(s)
    })
  })

  describe('gestione tag', () => {
    it('ADD_TAG accoda il tag e svuota la bozza', () => {
      const next = quickAddReducer(state({ step: 'tags', tagDraft: 'bu' }), {
        type: 'ADD_TAG',
        id: tag('t1'),
      })
      expect(next.selectedTagIds).toEqual([tag('t1')])
      expect(next.tagDraft).toBe('')
    })

    it('ADD_TAG non duplica un tag già selezionato', () => {
      const next = quickAddReducer(state({ step: 'tags', selectedTagIds: [tag('t1')] }), {
        type: 'ADD_TAG',
        id: tag('t1'),
      })
      expect(next.selectedTagIds).toEqual([tag('t1')])
    })

    it('REMOVE_TAG rimuove il tag indicato', () => {
      const next = quickAddReducer(state({ selectedTagIds: [tag('t1'), tag('t2')] }), {
        type: 'REMOVE_TAG',
        id: tag('t1'),
      })
      expect(next.selectedTagIds).toEqual([tag('t2')])
    })

    it('REMOVE_LAST_TAG toglie l’ultimo selezionato', () => {
      const next = quickAddReducer(state({ selectedTagIds: [tag('t1'), tag('t2')] }), {
        type: 'REMOVE_LAST_TAG',
      })
      expect(next.selectedTagIds).toEqual([tag('t1')])
    })
  })

  describe('transizioni all’indietro', () => {
    it('BACK_TO_CATEGORY ripristina la bozza categoria e preserva il titolo digitato', () => {
      const next = quickAddReducer(
        state({
          step: 'title',
          lockedCategoryId: cat('c1'),
          lockedCategoryName: 'Backend',
          titleDraft: 'fix a metà',
        }),
        { type: 'BACK_TO_CATEGORY' },
      )
      expect(next.step).toBe('category')
      expect(next.categoryDraft).toBe('Backend')
      expect(next.lockedCategoryId).toBeNull()
      // il titolo in bozza non va perso
      expect(next.titleDraft).toBe('fix a metà')
    })

    it('BACK_TO_TITLE ripristina la bozza titolo ma mantiene i tag selezionati', () => {
      const next = quickAddReducer(
        state({ step: 'tags', lockedTitle: 'fix login', selectedTagIds: [tag('t1')] }),
        { type: 'BACK_TO_TITLE' },
      )
      expect(next.step).toBe('title')
      expect(next.titleDraft).toBe('fix login')
      expect(next.lockedTitle).toBeNull()
      expect(next.selectedTagIds).toEqual([tag('t1')])
    })

    it('EDIT_CATEGORY (chip) azzera titolo e tag a valle', () => {
      const next = quickAddReducer(
        state({
          step: 'tags',
          lockedCategoryId: cat('c1'),
          lockedCategoryName: 'Backend',
          lockedTitle: 'fix login',
          selectedTagIds: [tag('t1'), tag('t2')],
        }),
        { type: 'EDIT_CATEGORY' },
      )
      expect(next).toMatchObject({
        step: 'category',
        categoryDraft: 'Backend',
        lockedCategoryId: null,
        titleDraft: 'fix login',
        lockedTitle: null,
        selectedTagIds: [],
      })
    })
  })

  describe('ciclo di vita del task', () => {
    it('RESET_FOR_NEXT_TASK riparte dal titolo tenendo la categoria bloccata', () => {
      const next = quickAddReducer(
        state({
          step: 'tags',
          lockedCategoryId: cat('c1'),
          lockedCategoryName: 'Backend',
          lockedTitle: 'fix login',
          titleDraft: 'fix login',
          selectedTagIds: [tag('t1')],
        }),
        { type: 'RESET_FOR_NEXT_TASK' },
      )
      expect(next.step).toBe('title')
      expect(next.lockedCategoryId).toBe(cat('c1'))
      expect(next.lockedCategoryName).toBe('Backend')
      expect(next.titleDraft).toBe('')
      expect(next.lockedTitle).toBeNull()
      expect(next.selectedTagIds).toEqual([])
    })

    it('CATEGORY_LOST sblocca la categoria e torna allo step categoria', () => {
      const next = quickAddReducer(
        state({ step: 'title', lockedCategoryId: cat('c1'), lockedCategoryName: 'Backend' }),
        { type: 'CATEGORY_LOST' },
      )
      expect(next.lockedCategoryId).toBeNull()
      expect(next.lockedCategoryName).toBeNull()
      expect(next.step).toBe('category')
    })
  })

  it('percorso completo: categoria → titolo → tag → submit/reset', () => {
    let s = initialQuickAddState
    s = quickAddReducer(s, { type: 'SET_CATEGORY_DRAFT', value: 'Back' })
    s = quickAddReducer(s, { type: 'CONFIRM_CATEGORY', id: cat('c1'), name: 'Backend' })
    expect(s.step).toBe<QuickAddStep>('title')
    s = quickAddReducer(s, { type: 'SET_TITLE_DRAFT', value: 'fix login' })
    s = quickAddReducer(s, { type: 'COMMIT_TITLE' })
    expect(s.step).toBe<QuickAddStep>('tags')
    s = quickAddReducer(s, { type: 'ADD_TAG', id: tag('t1') })
    expect(s.selectedTagIds).toEqual([tag('t1')])
    // dopo la creazione del task l’hook dispatcha RESET_FOR_NEXT_TASK
    s = quickAddReducer(s, { type: 'RESET_FOR_NEXT_TASK' })
    expect(s.step).toBe<QuickAddStep>('title')
    expect(s.lockedCategoryName).toBe('Backend')
  })
})
