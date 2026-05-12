import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { chromeStorage } from '@/lib/storage'
import type { Board } from '@/types/domain'

interface BoardState {
  board: Board
}

const emptyBoard: Board = { projects: [], tags: [] }

export const useBoardStore = create<BoardState>()(
  persist(
    () => ({
      board: emptyBoard,
    }),
    {
      name: 'recap-board',
      storage: createJSONStorage(() => chromeStorage),
      version: 1,
    },
  ),
)
