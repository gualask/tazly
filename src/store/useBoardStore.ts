import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { chromeStorage } from '@/lib/storage'
import type { Board, Project, ProjectId } from '@/types/domain'
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
    }),

    {
      name: 'tazly-board',
      storage: createJSONStorage(() => chromeStorage),
      version: 2,
      partialize: (s) => ({ board: s.board, focusProjectId: s.focusProjectId }),
      migrate: (persistedState, version) => {
        const state = persistedState as { board?: Board; focusProjectId?: ProjectId | null }
        if (!state?.board) return state
        if (version < 2) {
          state.board = {
            ...state.board,
            projects: state.board.projects.map((p) => {
              const raw = p as Project & { notes?: string }
              return 'notes' in raw && raw.notes !== undefined ? raw : { ...raw, notes: '' }
            }),
          }
        }
        return state
      },
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
