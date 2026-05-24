import type { StateCreator } from 'zustand'

import { newId } from '@/lib/id'
import type { CategoryId } from '@/types/domain'
import { mapProject, trimOrNull } from '../helpers'
import type { BoardState, CategorySlice } from '../types'

export const categorySlice: StateCreator<BoardState, [], [], CategorySlice> = (set) => ({
  addCategory(projectId, name) {
    const trimmed = trimOrNull(name)
    if (!trimmed) return null
    let createdId: CategoryId | null = null
    set((s) =>
      mapProject(s, projectId, (p) => {
        const existing = p.categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
        if (existing) {
          createdId = existing.id
          return p
        }
        const id = newId()
        createdId = id
        const maxOrder = p.categories.reduce((m, c) => Math.max(m, c.order), -1)
        return {
          ...p,
          categories: [
            ...p.categories,
            { id, name: trimmed, collapsed: false, order: maxOrder + 1 },
          ],
        }
      }),
    )
    return createdId
  },

  renameCategory(projectId, id, name) {
    const trimmed = trimOrNull(name)
    if (!trimmed) return
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        categories: p.categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
      })),
    )
  },

  toggleCategoryCollapsed(projectId, id) {
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        categories: p.categories.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed } : c)),
      })),
    )
  },

  expandCategory(projectId, id) {
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        categories: p.categories.map((c) => (c.id === id ? { ...c, collapsed: false } : c)),
      })),
    )
  },

  removeCategory(projectId, id) {
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        categories: p.categories.filter((c) => c.id !== id),
        tasks: p.tasks.filter((t) => t.categoryId !== id),
      })),
    )
  },
})
