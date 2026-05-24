import { useCallback } from 'react'

import { useBoardKeyboard } from '@/hooks/useBoardKeyboard'
import type { NavModel } from '@/hooks/useBoardNav'
import { focusQuickAdd as focusQuickAddInput } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { Project } from '@/types/domain'

/** Cablaggio della navigazione da tastiera in modalità focus (singolo progetto). */
export function useFocusModeKeyboard(args: {
  focusProjectId: string | null
  focusProject: Project | null
  navModel: NavModel
}) {
  const { focusProjectId, focusProject, navModel } = args

  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const activeFilters = useBoardStore((s) => s.activeFilters)
  const clearSelection = useBoardStore((s) => s.clearSelection)
  const clearFocus = useBoardStore((s) => s.clearFocus)
  const clearFilters = useBoardStore((s) => s.clearFilters)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const focusQuickAdd = useCallback(() => {
    clearSelection()
    focusQuickAddInput()
  }, [clearSelection])

  const onArrowRight = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      requestOpenNotepad()
    },
    [requestOpenNotepad],
  )

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      if (selectedTaskId || selectedCategoryId) {
        clearSelection()
        return
      }
      if (activeFilters.tagIds.length > 0 || activeFilters.categoryIds.length > 0) {
        clearFilters()
        return
      }
      clearFocus()
    },
    [selectedTaskId, selectedCategoryId, activeFilters, clearSelection, clearFilters, clearFocus],
  )

  useBoardKeyboard({
    active: !!focusProjectId,
    projectId: focusProjectId,
    project: focusProject,
    navModel,
    selectedTaskId,
    selectedCategoryId,
    onArrowRight,
    onArrowUpAtUnselected: focusQuickAdd,
    onArrowUpAtFirst: focusQuickAdd,
    onJumpExitTop: focusQuickAdd,
    onEscape,
  })
}
