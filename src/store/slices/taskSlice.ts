import type { StateCreator } from 'zustand'

import { newId } from '@/lib/id'
import type { ProjectId, Task, TaskId } from '@/types/domain'
import { mapProject, trimOrNull } from '../helpers'
import type { BoardState, TaskSlice } from '../types'

export const taskSlice: StateCreator<BoardState, [], [], TaskSlice> = (set, get) => ({
  lastClosedTask: null,

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
})
