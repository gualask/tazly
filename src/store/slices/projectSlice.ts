import type { StateCreator } from 'zustand'

import { newId } from '@/lib/id'
import { mapProject, trimOrNull } from '../helpers'
import type { BoardState, ProjectSlice } from '../types'

export const projectSlice: StateCreator<BoardState, [], [], ProjectSlice> = (set, get) => ({
  isProjectNameTaken(name) {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return false
    return get().board.projects.some((p) => p.name.toLowerCase() === trimmed)
  },

  addProject(name) {
    const trimmed = trimOrNull(name)
    if (!trimmed) return null
    if (get().board.projects.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return null
    }
    const id = newId()
    set((s) => ({
      board: {
        ...s.board,
        projects: [
          ...s.board.projects,
          { id, name: trimmed, categories: [], tasks: [], notes: '' },
        ],
      },
    }))
    return id
  },

  renameProject(id, name) {
    const trimmed = trimOrNull(name)
    if (!trimmed) return
    set((s) => ({
      board: {
        ...s.board,
        projects: s.board.projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
      },
    }))
  },

  updateProjectNotes(id, notes) {
    set((s) => mapProject(s, id, (p) => ({ ...p, notes })))
  },

  removeProject(id) {
    set((s) => ({
      board: {
        ...s.board,
        projects: s.board.projects.filter((p) => p.id !== id),
      },
      focusProjectId: s.focusProjectId === id ? null : s.focusProjectId,
      overviewSelectedProjectId:
        s.overviewSelectedProjectId === id ? null : s.overviewSelectedProjectId,
    }))
  },
})
