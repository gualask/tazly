import type { StateCreator } from 'zustand'

import { newId } from '@/lib/id'
import type { Promemoria } from '@/types/domain'
import { mapProject, trimOrNull } from '../helpers'
import type { BoardState, PromemoriaSlice } from '../types'

/** Blocco da appendere alle note: divisorio con la provenienza (o la data) + il testo. */
function noteBlock(m: Promemoria): string {
  const title = m.sourceTitle ?? new Date(m.createdAt).toLocaleDateString('it-IT')
  return `--- ${title} ---\n${m.text}`
}

export const promemoriaSlice: StateCreator<BoardState, [], [], PromemoriaSlice> = (set, get) => ({
  addPromemoria(projectId, input) {
    const text = trimOrNull(input.text)
    if (!text) return null
    const id = newId()
    const item = {
      id,
      text,
      sourceUrl: input.sourceUrl,
      sourceTitle: input.sourceTitle,
      createdAt: Date.now(),
    }
    set((s) => mapProject(s, projectId, (p) => ({ ...p, promemoria: [...p.promemoria, item] })))
    return id
  },

  removePromemoria(projectId, id) {
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        promemoria: p.promemoria.filter((m) => m.id !== id),
      })),
    )
  },

  convertPromemoriaToNote(projectId, id) {
    const project = get().board.projects.find((p) => p.id === projectId)
    const item = project?.promemoria.find((m) => m.id === id)
    if (!project || !item) return
    const block = noteBlock(item)
    const notes = project.notes.trim() ? `${project.notes.trimEnd()}\n\n${block}` : block
    set((s) =>
      mapProject(s, projectId, (p) => ({
        ...p,
        notes,
        promemoria: p.promemoria.filter((m) => m.id !== id),
      })),
    )
  },
})
