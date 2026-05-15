import { useEffect } from 'react'

import { COMMAND_BAR_INPUT_ID } from '@/components/board/CommandBar'
import { useBoardStore } from '@/store/useBoardStore'

interface Options {
  onToggleHelp: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.id === COMMAND_BAR_INPUT_ID) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function useGlobalHotkeys({ onToggleHelp }: Options) {
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

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onToggleHelp])
}
