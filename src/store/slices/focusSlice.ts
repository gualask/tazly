import type { StateCreator } from 'zustand'

import type { BoardState, FocusSlice } from '../types'

export const focusSlice: StateCreator<BoardState, [], [], FocusSlice> = (set, get) => ({
  focusProjectId: null,
  activeFilters: { tagIds: [], categoryIds: [] },

  setFocusProject(id) {
    set({
      focusProjectId: id,
      overviewSelectedProjectId: null,
      activeFilters: { tagIds: [], categoryIds: [] },
    })
  },

  clearFocus() {
    const prevFocus = get().focusProjectId
    set({
      focusProjectId: null,
      overviewSelectedProjectId: prevFocus,
      selectedTaskId: null,
      selectedCategoryId: null,
      activeFilters: { tagIds: [], categoryIds: [] },
    })
  },

  toggleFilterTag(id) {
    set((s) => ({
      activeFilters: {
        ...s.activeFilters,
        tagIds: s.activeFilters.tagIds.includes(id)
          ? s.activeFilters.tagIds.filter((x) => x !== id)
          : [...s.activeFilters.tagIds, id],
      },
    }))
  },

  toggleFilterCategory(id) {
    set((s) => ({
      activeFilters: {
        ...s.activeFilters,
        categoryIds: s.activeFilters.categoryIds.includes(id)
          ? s.activeFilters.categoryIds.filter((x) => x !== id)
          : [...s.activeFilters.categoryIds, id],
      },
    }))
  },

  clearFilters() {
    set({ activeFilters: { tagIds: [], categoryIds: [] } })
  },
})
