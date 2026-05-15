import { useEffect } from 'react'

import { COMMAND_BAR_INPUT_ID } from '@/components/board/CommandBar'
import { useBoardStore } from '@/store/useBoardStore'

interface Options {
  onToggleHelp: () => void
  resetEnabled: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.id === COMMAND_BAR_INPUT_ID) return true
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

      if (e.key === '/') {
        if (isEditableTarget(e.target)) return
        const bar = document.getElementById(COMMAND_BAR_INPUT_ID) as HTMLInputElement | null
        if (bar) {
          e.preventDefault()
          bar.focus()
          bar.select()
        }
        return
      }

      if (e.key === '?') {
        if (isEditableTarget(e.target)) return
        e.preventDefault()
        onToggleHelp()
      }
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
    window.addEventListener('keydown', onUndo)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onUndo)
    }
  }, [onToggleHelp])

  useEffect(() => {
    if (!resetEnabled) return
    const modifierKey = isMac() ? 'Meta' : 'Control'
    let tracking = false
    let invalidated = false

    function startTracking() {
      tracking = true
      invalidated = false
    }
    function stopTracking() {
      tracking = false
      invalidated = false
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return
      if (e.key === modifierKey) {
        const st = useBoardStore.getState()
        if (st.editingTaskId || st.editingCategoryId) {
          stopTracking()
          return
        }
        startTracking()
        return
      }
      if (tracking) invalidated = true
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== modifierKey) return
      const shouldFire = tracking && !invalidated
      stopTracking()
      if (!shouldFire) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      st.resetView()
    }

    function onBlur() {
      stopTracking()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [resetEnabled])
}
