import { useMemo } from 'react'

import type { CategoryId, Project, Task, TaskId } from '@/types/domain'

export type NavItem =
  | { kind: 'header'; categoryId: CategoryId }
  | { kind: 'task'; id: TaskId; categoryId: CategoryId }

/** Elenco lineare di header categoria + task visibili, in ordine di rendering. */
export function buildNavItems(project: Project, taskFilter: (t: Task) => boolean): NavItem[] {
  const items: NavItem[] = []
  const sortedCats = [...project.categories].sort((a, b) => a.order - b.order)
  for (const c of sortedCats) {
    items.push({ kind: 'header', categoryId: c.id })
    if (c.collapsed) continue
    for (const t of project.tasks) {
      if (t.categoryId !== c.id) continue
      if (!taskFilter(t)) continue
      items.push({ kind: 'task', id: t.id, categoryId: c.id })
    }
  }
  return items
}

export function navIndexOf(
  items: NavItem[],
  selectedTaskId: TaskId | null,
  selectedCategoryId: CategoryId | null,
): number {
  if (selectedTaskId) return items.findIndex((i) => i.kind === 'task' && i.id === selectedTaskId)
  if (selectedCategoryId)
    return items.findIndex((i) => i.kind === 'header' && i.categoryId === selectedCategoryId)
  return -1
}

export interface NavModel {
  navItems: NavItem[]
  navIdx: number
  sortedCategoryIds: CategoryId[]
}

/** Modello di navigazione da tastiera per un progetto (lista, indice corrente, categorie). */
export function useNavModel(
  project: Project | null,
  taskFilter: (t: Task) => boolean,
  selectedTaskId: TaskId | null,
  selectedCategoryId: CategoryId | null,
): NavModel {
  const navItems = useMemo(
    () => (project ? buildNavItems(project, taskFilter) : []),
    [project, taskFilter],
  )
  const navIdx = useMemo(
    () => navIndexOf(navItems, selectedTaskId, selectedCategoryId),
    [navItems, selectedTaskId, selectedCategoryId],
  )
  const sortedCategoryIds = useMemo(
    () => navItems.flatMap((i) => (i.kind === 'header' ? [i.categoryId] : [])),
    [navItems],
  )
  return { navItems, navIdx, sortedCategoryIds }
}

export type CategoryJump =
  | { type: 'select'; id: CategoryId }
  | { type: 'exitTop' }
  | { type: 'none' }

/**
 * Calcola la categoria target per il salto Shift+↑/↓. `exitTop` segnala che si è
 * sopra la prima categoria: il chiamante decide come uscire (focus vs overview).
 */
export function categoryJumpTarget(
  direction: 'up' | 'down',
  args: {
    sortedCategoryIds: CategoryId[]
    selectedCategoryId: CategoryId | null
    selectedTaskCategoryId: CategoryId | null
  },
): CategoryJump {
  const { sortedCategoryIds, selectedCategoryId, selectedTaskCategoryId } = args
  if (direction === 'down') {
    const startCatId = selectedCategoryId ?? selectedTaskCategoryId
    if (!startCatId) {
      return sortedCategoryIds.length > 0
        ? { type: 'select', id: sortedCategoryIds[0] }
        : { type: 'none' }
    }
    const i = sortedCategoryIds.indexOf(startCatId)
    if (i >= 0 && i < sortedCategoryIds.length - 1) {
      return { type: 'select', id: sortedCategoryIds[i + 1] }
    }
    return { type: 'none' }
  }
  if (selectedTaskCategoryId) return { type: 'select', id: selectedTaskCategoryId }
  if (selectedCategoryId) {
    const i = sortedCategoryIds.indexOf(selectedCategoryId)
    if (i > 0) return { type: 'select', id: sortedCategoryIds[i - 1] }
    return { type: 'exitTop' }
  }
  return { type: 'none' }
}
