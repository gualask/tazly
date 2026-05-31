import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { safeBoardStorage } from '@/lib/safeBoardStorage'
import { emptyBoard } from './helpers'
import { categorySlice } from './slices/categorySlice'
import { focusSlice } from './slices/focusSlice'
import { projectSlice } from './slices/projectSlice'
import { tagSlice } from './slices/tagSlice'
import { taskSlice } from './slices/taskSlice'
import { uiSlice } from './slices/uiSlice'
import type { BoardState } from './types'

export type { ActiveFilters, BoardState } from './types'

export const useBoardStore = create<BoardState>()(
  persist(
    (...a) => ({
      board: emptyBoard,

      ...uiSlice(...a),
      ...projectSlice(...a),
      ...categorySlice(...a),
      ...taskSlice(...a),
      ...tagSlice(...a),
      ...focusSlice(...a),

      resetBoard() {
        const [set] = a
        set({
          board: emptyBoard,
          focusProjectId: null,
          activeFilters: { tagIds: [], categoryIds: [] },
          lastClosedTask: null,
        })
      },

      importBoard(board) {
        const [set] = a
        set({
          board,
          focusProjectId: null,
          activeFilters: { tagIds: [], categoryIds: [] },
          lastClosedTask: null,
        })
      },
    }),

    {
      name: 'tazly-board',
      storage: createJSONStorage(() => safeBoardStorage),
      // Niente version/migrate: in dev lo schema non è versionato, si resetta (vedi DEVELOPMENT.md).
      partialize: (s) => ({ board: s.board, focusProjectId: s.focusProjectId }),
    },
  ),
)

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __tazlyReset: () => void }).__tazlyReset = () => {
    useBoardStore.persist.clearStorage()
    useBoardStore.getState().resetBoard()
    console.info('[tazly] board reset')
  }
}
