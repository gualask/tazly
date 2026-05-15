import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { TagColor } from '@/lib/colors'
import { newId } from '@/lib/id'
import { chromeStorage } from '@/lib/storage'
import type { Board, CategoryId, ProjectId, Tag, TagId, Task, TaskId } from '@/types/domain'

export interface ActiveFilters {
  tagIds: TagId[]
  categoryIds: CategoryId[]
}

interface BoardState {
  board: Board
  focusProjectId: ProjectId | null
  activeFilters: ActiveFilters
  editingTaskId: TaskId | null
  editingCategoryId: CategoryId | null
  selectedTaskId: TaskId | null
  selectedCategoryId: CategoryId | null
  notepadOpenTick: number
  viewResetTick: number
  lastClosedTask: { projectId: ProjectId; taskId: TaskId } | null

  setEditingTaskId: (id: TaskId | null) => void
  setEditingCategoryId: (id: CategoryId | null) => void
  setSelectedTaskId: (id: TaskId | null) => void
  setSelectedCategoryId: (id: CategoryId | null) => void
  clearSelection: () => void
  requestOpenNotepad: () => void
  setFocusProject: (id: ProjectId | null) => void
  clearFocus: () => void
  toggleFilterTag: (id: TagId) => void
  toggleFilterCategory: (id: CategoryId) => void
  clearFilters: () => void
  resetView: () => void
  isProjectNameTaken: (name: string) => boolean

  addProject: (name: string) => ProjectId | null
  renameProject: (id: ProjectId, name: string) => void
  updateProjectNotes: (id: ProjectId, notes: string) => void
  removeProject: (id: ProjectId) => void

  addCategory: (projectId: ProjectId, name: string) => CategoryId | null
  renameCategory: (projectId: ProjectId, id: CategoryId, name: string) => void
  toggleCategoryCollapsed: (projectId: ProjectId, id: CategoryId) => void
  expandCategory: (projectId: ProjectId, id: CategoryId) => void
  removeCategory: (projectId: ProjectId, id: CategoryId) => void

  addTask: (
    projectId: ProjectId,
    input: { title: string; categoryId: CategoryId; tagIds: TagId[] },
  ) => TaskId | null
  updateTask: (
    projectId: ProjectId,
    id: TaskId,
    patch: Partial<Pick<Task, 'title' | 'categoryId' | 'tagIds' | 'done'>>,
  ) => void
  toggleTaskDone: (projectId: ProjectId, id: TaskId) => void
  undoLastClose: () => void
  removeTask: (projectId: ProjectId, id: TaskId) => void

  addTag: (input: { name: string; color: TagColor; description?: string }) => void
  updateTag: (id: TagId, patch: Partial<Pick<Tag, 'name' | 'color' | 'description'>>) => void
  removeTag: (id: TagId) => void

  resetBoard: () => void
}

const emptyBoard: Board = { projects: [], tags: [] }

function trimOrNull(s: string): string | null {
  const t = s.trim()
  return t.length === 0 ? null : t
}

function mapProject(
  state: BoardState,
  projectId: ProjectId,
  fn: (p: BoardState['board']['projects'][number]) => BoardState['board']['projects'][number],
): BoardState {
  return {
    ...state,
    board: {
      ...state.board,
      projects: state.board.projects.map((p) => (p.id === projectId ? fn(p) : p)),
    },
  }
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      board: emptyBoard,
      focusProjectId: null,
      activeFilters: { tagIds: [], categoryIds: [] },
      editingTaskId: null,
      editingCategoryId: null,
      selectedTaskId: null,
      selectedCategoryId: null,
      notepadOpenTick: 0,
      viewResetTick: 0,
      lastClosedTask: null,

      setEditingTaskId(id) {
        set({ editingTaskId: id })
      },

      setEditingCategoryId(id) {
        set({ editingCategoryId: id })
      },

      setSelectedTaskId(id) {
        set({ selectedTaskId: id, selectedCategoryId: null })
      },

      setSelectedCategoryId(id) {
        set({ selectedCategoryId: id, selectedTaskId: null })
      },

      clearSelection() {
        set({ selectedTaskId: null, selectedCategoryId: null })
      },

      requestOpenNotepad() {
        set((s) => ({ notepadOpenTick: s.notepadOpenTick + 1 }))
      },

      setFocusProject(id) {
        set({ focusProjectId: id, activeFilters: { tagIds: [], categoryIds: [] } })
      },

      clearFocus() {
        set({ focusProjectId: null, activeFilters: { tagIds: [], categoryIds: [] } })
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

      resetView() {
        set((s) => ({
          focusProjectId: null,
          activeFilters: { tagIds: [], categoryIds: [] },
          viewResetTick: s.viewResetTick + 1,
        }))
      },

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
        }))
      },

      addCategory(projectId, name) {
        const trimmed = trimOrNull(name)
        if (!trimmed) return null
        let createdId: CategoryId | null = null
        set((s) =>
          mapProject(s, projectId, (p) => {
            const existing = p.categories.find(
              (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
            )
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
            categories: p.categories.map((c) =>
              c.id === id ? { ...c, collapsed: !c.collapsed } : c,
            ),
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

      addTask(projectId, input) {
        const title = trimOrNull(input.title)
        if (!title) return null
        const id = newId()
        set((s) =>
          mapProject(s, projectId, (p) => ({
            ...p,
            tasks: [
              ...p.tasks,
              {
                id,
                title,
                categoryId: input.categoryId,
                tagIds: input.tagIds,
                done: false,
                createdAt: Date.now(),
              },
            ],
          })),
        )
        return id
      },

      updateTask(projectId, id, patch) {
        set((s) => {
          let closedRef: { projectId: ProjectId; taskId: TaskId } | null = null
          const next = mapProject(s, projectId, (p) => ({
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id !== id) return t
              const wasDone = t.done
              const merged: Task = { ...t, ...patch }
              if ('done' in patch) {
                if (merged.done && !wasDone) {
                  merged.completedAt = Date.now()
                  closedRef = { projectId, taskId: id }
                } else if (!merged.done && wasDone) {
                  merged.completedAt = undefined
                }
              }
              return merged
            }),
          }))
          return { ...next, lastClosedTask: closedRef ?? s.lastClosedTask }
        })
      },

      toggleTaskDone(projectId, id) {
        set((s) => {
          let closedRef: { projectId: ProjectId; taskId: TaskId } | null = null
          const next = mapProject(s, projectId, (p) => ({
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id !== id) return t
              const nextDone = !t.done
              if (nextDone) {
                closedRef = { projectId, taskId: id }
                return { ...t, done: true, completedAt: Date.now() }
              }
              return { ...t, done: false, completedAt: undefined }
            }),
          }))
          return { ...next, lastClosedTask: closedRef ?? s.lastClosedTask }
        })
      },

      undoLastClose() {
        const last = get().lastClosedTask
        if (!last) return
        set((s) => ({
          ...mapProject(s, last.projectId, (p) => ({
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === last.taskId ? { ...t, done: false, completedAt: undefined } : t,
            ),
          })),
          lastClosedTask: null,
        }))
      },

      removeTask(projectId, id) {
        set((s) =>
          mapProject(s, projectId, (p) => ({
            ...p,
            tasks: p.tasks.filter((t) => t.id !== id),
          })),
        )
      },

      addTag(input) {
        const trimmed = trimOrNull(input.name)
        if (!trimmed) return
        set((s) => {
          const exists = s.board.tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
          if (exists) return s
          return {
            board: {
              ...s.board,
              tags: [
                ...s.board.tags,
                {
                  id: newId(),
                  name: trimmed,
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
            const dup = s.board.tags.some(
              (t) => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase(),
            )
            if (dup) return s
            patch = { ...patch, name: trimmed }
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

      resetBoard() {
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
        if (!state || !state.board) return state
        if (version < 2) {
          state.board = {
            ...state.board,
            projects: state.board.projects.map((p) =>
              'notes' in p ? p : { ...p, notes: '' },
            ),
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
