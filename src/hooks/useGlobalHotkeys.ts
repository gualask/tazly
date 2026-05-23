import { useEffect } from 'react'

import { copyText } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'

interface Options {
  onToggleHelp: () => void
  resetEnabled: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

export function useGlobalHotkeys({ onToggleHelp, resetEnabled }: Options) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return

      if (e.key === '?') {
        if (isEditableTarget(e.target)) return
        e.preventDefault()
        onToggleHelp()
      }
    }

    function onCopy(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey
      if (!mod || e.shiftKey || e.altKey) return
      if (e.key !== 'c' && e.key !== 'C') return
      if (isEditableTarget(e.target)) return
      // non sovrascrivere la copia nativa quando c'è testo selezionato
      if (window.getSelection()?.toString()) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      if (!st.selectedTaskId) return
      const task = st.board.projects.flatMap((p) => p.tasks).find((t) => t.id === st.selectedTaskId)
      if (!task) return
      e.preventDefault()
      void copyText(task.title).then((ok) => {
        if (ok) useBoardStore.getState().markTaskCopied(task.id)
      })
    }

    function onUndo(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey
      if (!mod || e.shiftKey || e.altKey) return
      if (e.key !== 'z' && e.key !== 'Z') return
      if (isEditableTarget(e.target)) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      if (!st.lastClosedTask) return
      e.preventDefault()
      st.undoLastClose()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onCopy)
    window.addEventListener('keydown', onUndo)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onCopy)
      window.removeEventListener('keydown', onUndo)
    }
  }, [onToggleHelp])

  useEffect(() => {
    if (!resetEnabled) return

    function onKeyDown(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey
      if (!mod || e.shiftKey || e.altKey) return
      if (e.key !== 'k' && e.key !== 'K') return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      e.preventDefault()
      st.resetView()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [resetEnabled])
}
