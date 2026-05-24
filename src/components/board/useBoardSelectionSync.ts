import { useCallback, useEffect, useMemo } from 'react'

import { useBoardStore } from '@/store/useBoardStore'
import type { Project, Task, TaskId } from '@/types/domain'

/**
 * Calcola il filtro task attivo e l'elenco dei task visibili nel progetto in focus,
 * e tiene coerente la selezione (task/categoria/progetto) quando il contenuto cambia,
 * scrollando l'elemento selezionato in vista.
 */
export function useBoardSelectionSync(args: { focusProject: Project | null }) {
  const { focusProject } = args

  const projects = useBoardStore((s) => s.board.projects)
  const activeFilters = useBoardStore((s) => s.activeFilters)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const setSelectedTaskId = useBoardStore((s) => s.setSelectedTaskId)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const clearSelection = useBoardStore((s) => s.clearSelection)

  const taskFilter = useCallback(
    (t: Task) => {
      if (t.done) return false
      if (activeFilters.tagIds.length > 0) {
        const hasAnyTag = t.tagIds.some((id) => activeFilters.tagIds.includes(id))
        if (!hasAnyTag) return false
      }
      if (activeFilters.categoryIds.length > 0) {
        if (!activeFilters.categoryIds.includes(t.categoryId)) return false
      }
      return true
    },
    [activeFilters],
  )

  const visibleTaskIds = useMemo(() => {
    if (!focusProject) return [] as TaskId[]
    const ids: TaskId[] = []
    const sortedCats = [...focusProject.categories].sort((a, b) => a.order - b.order)
    for (const c of sortedCats) {
      if (c.collapsed) continue
      for (const t of focusProject.tasks) {
        if (t.categoryId !== c.id) continue
        if (!taskFilter(t)) continue
        ids.push(t.id)
      }
    }
    return ids
  }, [focusProject, taskFilter])

  useEffect(() => {
    if (focusProjectId) {
      if (selectedTaskId && !visibleTaskIds.includes(selectedTaskId)) {
        setSelectedTaskId(null)
      }
      return
    }
    if (!overviewSelectedProjectId) {
      if (selectedTaskId || selectedCategoryId) clearSelection()
      return
    }
    const proj = projects.find((p) => p.id === overviewSelectedProjectId)
    if (selectedTaskId && !proj?.tasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
    if (selectedCategoryId && !proj?.categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null)
    }
  }, [
    focusProjectId,
    overviewSelectedProjectId,
    projects,
    visibleTaskIds,
    selectedTaskId,
    selectedCategoryId,
    setSelectedTaskId,
    setSelectedCategoryId,
    clearSelection,
  ])

  useEffect(() => {
    if (!selectedTaskId) return
    const el = document.querySelector<HTMLElement>(`[data-task-id="${selectedTaskId}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedTaskId])

  useEffect(() => {
    if (!selectedCategoryId) return
    const el = document.querySelector<HTMLElement>(`[data-category-id="${selectedCategoryId}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedCategoryId])

  useEffect(() => {
    if (focusProjectId) return
    if (!overviewSelectedProjectId) return
    const el = document.querySelector<HTMLElement>(
      `[data-project-id="${overviewSelectedProjectId}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [overviewSelectedProjectId, focusProjectId])

  return { taskFilter, visibleTaskIds }
}
