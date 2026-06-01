import type { StateCreator } from 'zustand'

import type { BoardState, QuickAddMemorySlice } from '../types'

export const quickAddMemorySlice: StateCreator<BoardState, [], [], QuickAddMemorySlice> = (
  set,
) => ({
  lastQuickAdd: null,

  setLastQuickAdd(projectId, categoryId) {
    set({ lastQuickAdd: { projectId, categoryId } })
  },
})
