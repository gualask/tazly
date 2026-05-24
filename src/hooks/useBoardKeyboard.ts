import { useEffect } from 'react'

import { categoryJumpTarget, type NavItem, type NavModel } from '@/hooks/useBoardNav'
import { isEditableTarget } from '@/lib/dom'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, Project, ProjectId, TaskId } from '@/types/domain'

interface BoardKeyboardOptions {
  /** Abilita il listener (es. modalità focus attiva o progetto selezionato in overview). */
  active: boolean
  projectId: ProjectId | null
  project: Project | null
  navModel: NavModel
  selectedTaskId: TaskId | null
  selectedCategoryId: CategoryId | null
  /** ←: gestita dal chiamante (preventDefault incluso). Assente = nessuna azione. */
  onArrowLeft?: (e: KeyboardEvent) => void
  /** →: gestita dal chiamante (preventDefault incluso). Assente = nessuna azione. */
  onArrowRight?: (e: KeyboardEvent) => void
  /** ↑ senza alcuna selezione (navIdx === -1). */
  onArrowUpAtUnselected: () => void
  /** ↑ sul primo elemento navigabile (navIdx === 0). */
  onArrowUpAtFirst: () => void
  /** Shift+↑ sopra la prima categoria. */
  onJumpExitTop: () => void
  /** Invio senza selezione: ritorna true se gestito (preventDefault a carico del chiamante). */
  onEnterUnselected?: () => boolean
  /** Esc: gestita interamente dal chiamante (preventDefault incluso). */
  onEscape: (e: KeyboardEvent) => void
}

/**
 * Navigazione da tastiera condivisa tra modalità focus e overview.
 * La logica verticale (↑/↓, Shift+↑/↓, Spazio, Invio) è comune; i casi di bordo
 * (uscita verso QuickAdd/CommandBar, navigazione orizzontale, Esc) sono delegati al chiamante.
 */
export function useBoardKeyboard(opts: BoardKeyboardOptions) {
  const {
    active,
    projectId,
    project,
    navModel,
    selectedTaskId,
    selectedCategoryId,
    onArrowLeft,
    onArrowRight,
    onArrowUpAtUnselected,
    onArrowUpAtFirst,
    onJumpExitTop,
    onEnterUnselected,
    onEscape,
  } = opts

  const toggleTaskDone = useBoardStore((s) => s.toggleTaskDone)
  const toggleCategoryCollapsed = useBoardStore((s) => s.toggleCategoryCollapsed)
  const expandCategory = useBoardStore((s) => s.expandCategory)
  const setEditingTaskId = useBoardStore((s) => s.setEditingTaskId)
  const setEditingCategoryId = useBoardStore((s) => s.setEditingCategoryId)
  const setSelectedTaskId = useBoardStore((s) => s.setSelectedTaskId)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)

  const { navItems, navIdx, sortedCategoryIds } = navModel

  useEffect(() => {
    if (!active || !projectId || !project) return

    function applyNavItem(item: NavItem) {
      if (item.kind === 'header') setSelectedCategoryId(item.categoryId)
      else setSelectedTaskId(item.id)
    }

    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      if (isEditableTarget(e.target)) return
      if (!project || !projectId) return

      if (e.key === 'ArrowLeft' && onArrowLeft) {
        onArrowLeft(e)
        return
      }
      if (e.key === 'ArrowRight' && onArrowRight) {
        onArrowRight(e)
        return
      }

      // Shift+↑/↓: salta tra header categoria
      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        if (navItems.length === 0) return
        const selectedTaskCategoryId = selectedTaskId
          ? (project.tasks.find((x) => x.id === selectedTaskId)?.categoryId ?? null)
          : null
        const jump = categoryJumpTarget(e.key === 'ArrowDown' ? 'down' : 'up', {
          sortedCategoryIds,
          selectedCategoryId,
          selectedTaskCategoryId,
        })
        if (jump.type === 'select') setSelectedCategoryId(jump.id)
        else if (jump.type === 'exitTop') onJumpExitTop()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (navItems.length === 0) return
        // se siamo su una header collassata, espandila prima di scendere
        if (selectedCategoryId) {
          const cat = project.categories.find((c) => c.id === selectedCategoryId)
          if (cat?.collapsed) expandCategory(projectId, selectedCategoryId)
        }
        if (navIdx === -1) {
          applyNavItem(navItems[0])
          return
        }
        applyNavItem(navItems[Math.min(navIdx + 1, navItems.length - 1)])
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (navIdx === -1) {
          onArrowUpAtUnselected()
          return
        }
        if (navIdx === 0) {
          onArrowUpAtFirst()
          return
        }
        applyNavItem(navItems[navIdx - 1])
        return
      }

      if (e.key === ' ') {
        if (selectedTaskId) {
          e.preventDefault()
          toggleTaskDone(projectId, selectedTaskId)
          return
        }
        if (selectedCategoryId) {
          e.preventDefault()
          toggleCategoryCollapsed(projectId, selectedCategoryId)
          return
        }
      }

      if (e.key === 'Enter') {
        if (navIdx === -1 && onEnterUnselected?.()) {
          e.preventDefault()
          return
        }
        if (selectedTaskId) {
          e.preventDefault()
          setEditingTaskId(selectedTaskId)
          return
        }
        if (selectedCategoryId) {
          e.preventDefault()
          setEditingCategoryId(selectedCategoryId)
          return
        }
      }

      if (e.key === 'Escape') {
        onEscape(e)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    active,
    projectId,
    project,
    navItems,
    navIdx,
    sortedCategoryIds,
    selectedTaskId,
    selectedCategoryId,
    onArrowLeft,
    onArrowRight,
    onArrowUpAtUnselected,
    onArrowUpAtFirst,
    onJumpExitTop,
    onEnterUnselected,
    onEscape,
    toggleTaskDone,
    toggleCategoryCollapsed,
    expandCategory,
    setEditingTaskId,
    setEditingCategoryId,
    setSelectedTaskId,
    setSelectedCategoryId,
  ])
}
