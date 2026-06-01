import { useEffect } from 'react'

import { isEditableTarget, isMac } from '@/lib/dom'
import { useBoardStore } from '@/store/useBoardStore'

interface Options {
  onToggleHelp: () => void
  /** Toggle dello storico: apre se sulla board, chiude se già nel log. */
  onToggleLog: () => void
  /** Toggle della gestione tag: apre se sulla board, chiude se già nei tag. */
  onToggleTags: () => void
  /** Toggle della barra filtri (per tag) sotto la navbar. */
  onToggleFilters: () => void
  /** Toggle del tema chiaro/scuro. */
  onToggleTheme: () => void
  /** Esc: torna alla board da una vista secondaria (attivo solo quando `inOverlay`). */
  onLeaveOverlay: () => void
  /** True quando è attiva una vista secondaria (log o tag). */
  inOverlay: boolean
  resetEnabled: boolean
}

export function useGlobalHotkeys({
  onToggleHelp,
  onToggleLog,
  onToggleTags,
  onToggleFilters,
  onToggleTheme,
  onLeaveOverlay,
  inOverlay,
  resetEnabled,
}: Options) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const st = useBoardStore.getState()

      // Azioni globali con Option/Alt: funzionano ovunque, anche dentro gli input.
      // Si matcha su e.code perché su macOS Option+lettera produce caratteri speciali in e.key.
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        // non scartare una rinomina inline in corso (i wrapper annullano l'edit su blur)
        if (st.editingTaskId || st.editingCategoryId) return
        const action = (
          {
            KeyL: onToggleLog,
            KeyT: onToggleTags,
            KeyF: onToggleFilters,
            KeyD: onToggleTheme,
            KeyH: onToggleHelp,
          } as Record<string, (() => void) | undefined>
        )[e.code]
        if (action) {
          e.preventDefault()
          action()
        }
        return
      }

      if (e.metaKey || e.ctrlKey) return
      if (st.editingTaskId || st.editingCategoryId) return

      if (e.key === 'Escape' && inOverlay) {
        if (isEditableTarget(e.target)) return
        e.preventDefault()
        onLeaveOverlay()
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
      e.preventDefault()
      void st.copyTaskById(st.selectedTaskId)
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
  }, [
    onToggleHelp,
    onToggleLog,
    onToggleTags,
    onToggleFilters,
    onToggleTheme,
    onLeaveOverlay,
    inOverlay,
  ])

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
