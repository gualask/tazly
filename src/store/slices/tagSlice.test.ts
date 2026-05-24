import { beforeEach, describe, expect, it } from 'vitest'

import { useBoardStore } from '../useBoardStore'

const store = () => useBoardStore.getState()

describe('tagSlice', () => {
  beforeEach(() => {
    store().resetBoard()
  })

  it('addTag normalizza il nome in maiuscolo', () => {
    store().addTag({ name: 'bug', color: 'red' })
    expect(store().board.tags[0].name).toBe('BUG')
  })

  it('addTag ignora i duplicati (dopo normalizzazione)', () => {
    store().addTag({ name: 'bug', color: 'red' })
    store().addTag({ name: 'BUG', color: 'blue' })
    expect(store().board.tags).toHaveLength(1)
  })

  it('updateTag rifiuta un nome che collide con un altro tag', () => {
    store().addTag({ name: 'bug', color: 'red' })
    store().addTag({ name: 'feature', color: 'blue' })
    const featureId = store().board.tags[1].id
    store().updateTag(featureId, { name: 'bug' })
    expect(store().board.tags[1].name).toBe('FEATURE')
  })

  it('removeTag elimina il tag e lo rimuove dai task (cascade)', () => {
    store().addTag({ name: 'bug', color: 'red' })
    const tagId = store().board.tags[0].id
    const projectId = store().addProject('Alpha')
    if (!projectId) throw new Error('progetto non creato')
    const categoryId = store().addCategory(projectId, 'Backend')
    if (!categoryId) throw new Error('categoria non creata')
    store().addTask(projectId, { title: 't', categoryId, tagIds: [tagId] })

    store().removeTag(tagId)
    expect(store().board.tags).toHaveLength(0)
    expect(store().board.projects[0].tasks[0].tagIds).toEqual([])
  })
})
