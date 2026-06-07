import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { debounceStorage } from '@/lib/debouncedStorage'
import { safeBoardStorage } from '@/lib/safeBoardStorage'
import { emptyBoard } from './helpers'
import { categorySlice } from './slices/categorySlice'
import { focusSlice } from './slices/focusSlice'
import { projectSlice } from './slices/projectSlice'
import { promemoriaSlice } from './slices/promemoriaSlice'
import { quickAddMemorySlice } from './slices/quickAddMemorySlice'
import { tagSlice } from './slices/tagSlice'
import { taskSlice } from './slices/taskSlice'
import { uiSlice } from './slices/uiSlice'
import type { BoardState } from './types'

export type { BoardState } from './types'

export const useBoardStore = create<BoardState>()(
  persist(
    (...a) => ({
      board: emptyBoard,

      ...uiSlice(...a),
      ...projectSlice(...a),
      ...promemoriaSlice(...a),
      ...categorySlice(...a),
      ...taskSlice(...a),
      ...tagSlice(...a),
      ...quickAddMemorySlice(...a),
      ...focusSlice(...a),

      resetBoard() {
        const [set] = a
        set({
          board: emptyBoard,
          focusProjectId: null,
          filterTagIds: [],
          lastClosedTask: null,
        })
      },

      importBoard(board) {
        const [set] = a
        set({
          board,
          focusProjectId: null,
          filterTagIds: [],
          lastClosedTask: null,
        })
      },
    }),

    {
      name: 'tazly-board',
      // Le scritture sono debounced: una raffica di mutazioni (es. digitazione
      // nel notepad) persiste una volta sola, non a ogni keystroke.
      storage: createJSONStorage(() => debounceStorage(safeBoardStorage)),
      // Lo schema persistito evolve in modo additivo: una migrazione versionata
      // backfilla i campi nuovi sui dati già salvati, così aggiungere un campo non fa
      // crashare il render leggendolo `undefined`. Bump `version` ad ogni campo nuovo.
      version: 1,
      migrate: (persisted) => {
        // tipo volutamente lasco: stiamo normalizzando dati di uno schema precedente
        const s = persisted as { board?: { projects?: Array<{ promemoria?: unknown }> } }
        for (const p of s.board?.projects ?? []) {
          if (!Array.isArray(p.promemoria)) p.promemoria = [] // v1: campo promemoria
        }
        return persisted as BoardState
      },
      partialize: (s) => ({
        board: s.board,
        focusProjectId: s.focusProjectId,
        lastQuickAdd: s.lastQuickAdd,
      }),
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
