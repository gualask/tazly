import { useCallback } from 'react'

import { useBoardKeyboard } from '@/hooks/useBoardKeyboard'
import type { NavModel } from '@/hooks/useBoardNav'
import { focusComposer } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { Project, Task } from '@/types/domain'

/** Cablaggio della navigazione da tastiera in modalità focus (singolo progetto). */
export function useFocusModeKeyboard(args: {
  focusProjectId: string | null
  focusProject: Project | null
  navModel: NavModel
  taskFilter: (t: Task) => boolean
}) {
  const { focusProjectId, focusProject, navModel, taskFilter } = args

  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const filterTagIds = useBoardStore((s) => s.filterTagIds)
  const clearSelection = useBoardStore((s) => s.clearSelection)
  const clearFocus = useBoardStore((s) => s.clearFocus)
  const clearFilters = useBoardStore((s) => s.clearFilters)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const focusComposerInput = useCallback(() => {
    clearSelection()
    focusComposer()
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
      if (filterTagIds.length > 0) {
        clearFilters()
        return
      }
      clearFocus()
    },
    [selectedTaskId, selectedCategoryId, filterTagIds, clearSelection, clearFilters, clearFocus],
  )

  useBoardKeyboard({
    active: !!focusProjectId,
    projectId: focusProjectId,
    project: focusProject,
    navModel,
    taskFilter,
    selectedTaskId,
    selectedCategoryId,
    onArrowRight,
    onArrowUpAtUnselected: focusComposerInput,
    onArrowUpAtFirst: focusComposerInput,
    onJumpExitTop: focusComposerInput,
    onEscape,
  })
}
