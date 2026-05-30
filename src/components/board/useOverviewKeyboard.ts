import { useCallback } from 'react'

import { useBoardKeyboard } from '@/hooks/useBoardKeyboard'
import type { NavModel } from '@/hooks/useBoardNav'
import { focusCommandBar } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { Project, Task } from '@/types/domain'

/** Cablaggio della navigazione da tastiera in modalità overview (griglia progetti). */
export function useOverviewKeyboard(args: {
  focusProjectId: string | null
  overviewSelectedProject: Project | null
  navModel: NavModel
  taskFilter: (t: Task) => boolean
}) {
  const { focusProjectId, overviewSelectedProject, navModel, taskFilter } = args

  const projects = useBoardStore((s) => s.board.projects)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const setOverviewSelectedProjectId = useBoardStore((s) => s.setOverviewSelectedProjectId)
  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const clearSelection = useBoardStore((s) => s.clearSelection)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)

  const onHorizontal = useCallback(
    (e: KeyboardEvent) => {
      if (!overviewSelectedProjectId || projects.length === 0) return
      const projIdx = projects.findIndex((p) => p.id === overviewSelectedProjectId)
      const next = e.key === 'ArrowRight' ? projIdx + 1 : projIdx - 1
      if (next < 0 || next >= projects.length) return
      e.preventDefault()
      setOverviewSelectedProjectId(projects[next].id)
    },
    [overviewSelectedProjectId, projects, setOverviewSelectedProjectId],
  )

  const exitToCommandBar = useCallback(() => {
    setOverviewSelectedProjectId(null)
    focusCommandBar()
  }, [setOverviewSelectedProjectId])

  const onEnterUnselected = useCallback(() => {
    if (!overviewSelectedProjectId) return false
    setFocusProject(overviewSelectedProjectId)
    return true
  }, [overviewSelectedProjectId, setFocusProject])

  const clearSelectedCategory = useCallback(
    () => setSelectedCategoryId(null),
    [setSelectedCategoryId],
  )

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      if (navModel.navIdx !== -1) {
        clearSelection()
        return
      }
      exitToCommandBar()
    },
    [navModel.navIdx, clearSelection, exitToCommandBar],
  )

  // Uscita verso l'alto a due stadi (intenzionale): a differenza della modalità focus
  // — dove sopra la board c'è la QuickAdd come atterraggio intermedio — qui lasciare la
  // board significa saltare fino alla CommandBar. Quindi ↑/⇧↑ con selezione prima
  // deselezionano (restando nella board), e solo ↑ da già-deselezionato esce davvero.
  // Fa da guardia contro l'uscita accidentale per una freccia di troppo.
  useBoardKeyboard({
    active: !focusProjectId && !!overviewSelectedProjectId,
    projectId: overviewSelectedProjectId,
    project: overviewSelectedProject,
    navModel,
    taskFilter,
    selectedTaskId,
    selectedCategoryId,
    onArrowLeft: onHorizontal,
    onArrowRight: onHorizontal,
    onArrowUpAtUnselected: exitToCommandBar,
    onArrowUpAtFirst: clearSelection,
    onJumpExitTop: clearSelectedCategory,
    onEnterUnselected,
    onEscape,
  })
}
