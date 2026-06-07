import type { StateCreator } from 'zustand'

import { copyText } from '@/lib/utils'
import type { BoardState, UiSlice } from '../types'

export const uiSlice: StateCreator<BoardState, [], [], UiSlice> = (set, get) => ({
  editingTaskId: null,
  editingCategoryId: null,
  selectedTaskId: null,
  selectedCategoryId: null,
  overviewSelectedProjectId: null,
  notepadOpenTick: 0,
  viewResetTick: 0,
  copiedTaskId: null,
  copyTick: 0,
  composerCapture: null,

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

  setOverviewSelectedProjectId(id) {
    set({ overviewSelectedProjectId: id, selectedTaskId: null, selectedCategoryId: null })
  },

  clearSelection() {
    set({ selectedTaskId: null, selectedCategoryId: null })
  },

  markTaskCopied(id) {
    set((s) => ({ copiedTaskId: id, copyTick: s.copyTick + 1 }))
  },

  async copyTaskById(id) {
    const task = get()
      .board.projects.flatMap((p) => p.tasks)
      .find((t) => t.id === id)
    if (!task) return
    const ok = await copyText(task.title)
    if (ok) get().markTaskCopied(id)
  },

  requestOpenNotepad() {
    set((s) => ({ notepadOpenTick: s.notepadOpenTick + 1 }))
  },

  sendToComposer(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    set((s) => ({ composerCapture: { text: trimmed, seq: (s.composerCapture?.seq ?? 0) + 1 } }))
  },

  resetView() {
    set((s) => ({
      focusProjectId: null,
      overviewSelectedProjectId: null,
      selectedTaskId: null,
      selectedCategoryId: null,
      filterTagIds: [],
      // come setFocusProject/clearFocus: uscendo dal focus il seed del composer decade
      composerCapture: null,
      viewResetTick: s.viewResetTick + 1,
    }))
  },
})
