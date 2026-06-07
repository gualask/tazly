import type { StateCreator } from 'zustand'

import type { BoardState, FocusSlice } from '../types'

export const focusSlice: StateCreator<BoardState, [], [], FocusSlice> = (set, get) => ({
  focusProjectId: null,
  filterTagIds: [],

  setFocusProject(id) {
    // i filtri NON si resettano: persistono sulla vista (vedi FilterBar).
    // composerCapture sì: è un seed legato al progetto corrente, non deve riemergere
    // nel composer di un altro progetto al rimontaggio della QuickAddBar.
    set({ focusProjectId: id, overviewSelectedProjectId: null, composerCapture: null })
  },

  clearFocus() {
    const prevFocus = get().focusProjectId
    set({
      focusProjectId: null,
      overviewSelectedProjectId: prevFocus,
      selectedTaskId: null,
      selectedCategoryId: null,
      composerCapture: null,
    })
  },

  toggleFilterTag(id) {
    set((s) => ({
      filterTagIds: s.filterTagIds.includes(id)
        ? s.filterTagIds.filter((x) => x !== id)
        : [...s.filterTagIds, id],
    }))
  },

  clearFilters() {
    set({ filterTagIds: [] })
  },
})
