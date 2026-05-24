import { beforeEach, describe, expect, it } from 'vitest'

import { useBoardStore } from '../useBoardStore'

const store = () => useBoardStore.getState()

function seedProjectWithCategory() {
  const projectId = store().addProject('Alpha')
  if (!projectId) throw new Error('progetto non creato')
  const categoryId = store().addCategory(projectId, 'Backend')
  if (!categoryId) throw new Error('categoria non creata')
  return { projectId, categoryId }
}

function addTask(projectId: string, categoryId: string, title = 't') {
  const taskId = store().addTask(projectId, { title, categoryId, tagIds: [] })
  if (!taskId) throw new Error('task non creato')
  return taskId
}

describe('taskSlice', () => {
  beforeEach(() => {
    store().resetBoard()
  })

  it('addTask aggiunge un task non completato e ne ritorna l’id', () => {
    const { projectId, categoryId } = seedProjectWithCategory()
    const taskId = store().addTask(projectId, { title: '  fix login  ', categoryId, tagIds: [] })
    expect(taskId).toBeTruthy()
    const task = store().board.projects[0].tasks[0]
    expect(task.title).toBe('fix login')
    expect(task.done).toBe(false)
    expect(task.completedAt).toBeUndefined()
  })

  it('addTask ignora titoli vuoti', () => {
    const { projectId, categoryId } = seedProjectWithCategory()
    expect(store().addTask(projectId, { title: '   ', categoryId, tagIds: [] })).toBeNull()
    expect(store().board.projects[0].tasks).toHaveLength(0)
  })

  it('toggleTaskDone imposta e azzera completedAt e traccia lastClosedTask', () => {
    const { projectId, categoryId } = seedProjectWithCategory()
    const taskId = addTask(projectId, categoryId)

    store().toggleTaskDone(projectId, taskId)
    let task = store().board.projects[0].tasks[0]
    expect(task.done).toBe(true)
    expect(task.completedAt).toBeTypeOf('number')
    expect(store().lastClosedTask).toEqual({ projectId, taskId })

    store().toggleTaskDone(projectId, taskId)
    task = store().board.projects[0].tasks[0]
    expect(task.done).toBe(false)
    expect(task.completedAt).toBeUndefined()
  })

  it('undoLastClose riapre l’ultimo task chiuso', () => {
    const { projectId, categoryId } = seedProjectWithCategory()
    const taskId = addTask(projectId, categoryId)
    store().toggleTaskDone(projectId, taskId)

    store().undoLastClose()
    const task = store().board.projects[0].tasks[0]
    expect(task.done).toBe(false)
    expect(task.completedAt).toBeUndefined()
    expect(store().lastClosedTask).toBeNull()
  })
})
