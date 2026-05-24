import type { StateCreator } from 'zustand'

import { newId } from '@/lib/id'
import { trimOrNull } from '../helpers'
import type { BoardState, TagSlice } from '../types'

export const tagSlice: StateCreator<BoardState, [], [], TagSlice> = (set) => ({
  addTag(input) {
    const trimmed = trimOrNull(input.name)
    if (!trimmed) return
    const normalized = trimmed.toUpperCase()
    set((s) => {
      const exists = s.board.tags.some((t) => t.name === normalized)
      if (exists) return s
      return {
        board: {
          ...s.board,
          tags: [
            ...s.board.tags,
            {
              id: newId(),
              name: normalized,
              color: input.color,
              description: input.description?.trim() || undefined,
            },
          ],
        },
      }
    })
  },

  updateTag(id, patch) {
    set((s) => {
      if (patch.name !== undefined) {
        const trimmed = trimOrNull(patch.name)
        if (!trimmed) return s
        const normalized = trimmed.toUpperCase()
        const dup = s.board.tags.some((t) => t.id !== id && t.name === normalized)
        if (dup) return s
        patch = { ...patch, name: normalized }
      }
      return {
        board: {
          ...s.board,
          tags: s.board.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        },
      }
    })
  },

  removeTag(id) {
    set((s) => ({
      board: {
        ...s.board,
        tags: s.board.tags.filter((t) => t.id !== id),
        projects: s.board.projects.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((tid) => tid !== id),
          })),
        })),
      },
    }))
  },
})
