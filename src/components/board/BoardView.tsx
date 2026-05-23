import { useCallback, useEffect, useMemo, useState } from 'react'

import { Notepad } from '@/components/board/Notepad'
import { NotepadTab } from '@/components/board/NotepadTab'
import { ProjectCard } from '@/components/board/ProjectCard'
import { isEditableTarget } from '@/lib/dom'
import { focusCommandBar, focusQuickAdd as focusQuickAddInput } from '@/lib/focus'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, ProjectId, Task, TaskId } from '@/types/domain'

interface BoardViewProps {
  onOpenLog?: (projectId: ProjectId) => void
}

export function BoardView({ onOpenLog }: BoardViewProps = {}) {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const activeFilters = useBoardStore((s) => s.activeFilters)
  const toggleTaskDone = useBoardStore((s) => s.toggleTaskDone)
  const expandCategory = useBoardStore((s) => s.expandCategory)
  const toggleCategoryCollapsed = useBoardStore((s) => s.toggleCategoryCollapsed)
  const setEditingTaskId = useBoardStore((s) => s.setEditingTaskId)
  const setEditingCategoryId = useBoardStore((s) => s.setEditingCategoryId)
  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const setSelectedTaskId = useBoardStore((s) => s.setSelectedTaskId)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const clearSelection = useBoardStore((s) => s.clearSelection)
  const clearFocus = useBoardStore((s) => s.clearFocus)
  const clearFilters = useBoardStore((s) => s.clearFilters)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const setOverviewSelectedProjectId = useBoardStore((s) => s.setOverviewSelectedProjectId)
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [notepadExpanded, setNotepadExpanded] = useState(false)

  // richiesta esplicita (freccia → o rail) → espandi e dai focus
  useEffect(() => {
    if (notepadOpenTick === 0) return
    setNotepadExpanded(true)
  }, [notepadOpenTick])

  // al cambio progetto: espanso di default solo se ci sono già delle note
  // biome-ignore lint/correctness/useExhaustiveDependencies: rivalutare solo al cambio progetto, non a ogni edit delle note
  useEffect(() => {
    setNotepadExpanded((focusProject?.notes.length ?? 0) > 0)
  }, [focusProjectId])

  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags])

  const focusProject = useMemo(
    () => (focusProjectId ? (projects.find((p) => p.id === focusProjectId) ?? null) : null),
    [focusProjectId, projects],
  )

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

  const sortedCategoryIds = useMemo(() => {
    if (!focusProject) return [] as CategoryId[]
    return [...focusProject.categories].sort((a, b) => a.order - b.order).map((c) => c.id)
  }, [focusProject])

  const focusQuickAdd = useCallback(() => {
    clearSelection()
    focusQuickAddInput()
  }, [clearSelection])

  type NavItem =
    | { kind: 'header'; categoryId: CategoryId }
    | { kind: 'task'; id: TaskId; categoryId: CategoryId }

  const navItems = useMemo<NavItem[]>(() => {
    if (!focusProject) return []
    const items: NavItem[] = []
    const sortedCats = [...focusProject.categories].sort((a, b) => a.order - b.order)
    for (const c of sortedCats) {
      items.push({ kind: 'header', categoryId: c.id })
      if (c.collapsed) continue
      for (const t of focusProject.tasks) {
        if (t.categoryId !== c.id) continue
        if (!taskFilter(t)) continue
        items.push({ kind: 'task', id: t.id, categoryId: c.id })
      }
    }
    return items
  }, [focusProject, taskFilter])

  const currentNavIdx = useMemo(() => {
    if (selectedTaskId)
      return navItems.findIndex((i) => i.kind === 'task' && i.id === selectedTaskId)
    if (selectedCategoryId)
      return navItems.findIndex((i) => i.kind === 'header' && i.categoryId === selectedCategoryId)
    return -1
  }, [navItems, selectedTaskId, selectedCategoryId])

  const applyNavItem = useCallback(
    (item: NavItem) => {
      if (item.kind === 'header') setSelectedCategoryId(item.categoryId)
      else setSelectedTaskId(item.id)
    },
    [setSelectedCategoryId, setSelectedTaskId],
  )

  const overviewSelectedProject = useMemo(
    () =>
      overviewSelectedProjectId
        ? (projects.find((p) => p.id === overviewSelectedProjectId) ?? null)
        : null,
    [projects, overviewSelectedProjectId],
  )

  const overviewNavItems = useMemo<NavItem[]>(() => {
    if (!overviewSelectedProject) return []
    const items: NavItem[] = []
    const sortedCats = [...overviewSelectedProject.categories].sort((a, b) => a.order - b.order)
    for (const c of sortedCats) {
      items.push({ kind: 'header', categoryId: c.id })
      if (c.collapsed) continue
      for (const t of overviewSelectedProject.tasks) {
        if (t.categoryId !== c.id) continue
        if (!taskFilter(t)) continue
        items.push({ kind: 'task', id: t.id, categoryId: c.id })
      }
    }
    return items
  }, [overviewSelectedProject, taskFilter])

  const overviewNavIdx = useMemo(() => {
    if (selectedTaskId)
      return overviewNavItems.findIndex((i) => i.kind === 'task' && i.id === selectedTaskId)
    if (selectedCategoryId)
      return overviewNavItems.findIndex(
        (i) => i.kind === 'header' && i.categoryId === selectedCategoryId,
      )
    return -1
  }, [overviewNavItems, selectedTaskId, selectedCategoryId])

  const overviewSortedCategoryIds = useMemo(() => {
    if (!overviewSelectedProject) return [] as CategoryId[]
    return [...overviewSelectedProject.categories]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id)
  }, [overviewSelectedProject])

  useEffect(() => {
    if (!focusProjectId || !focusProject) return
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      if (isEditableTarget(e.target)) return
      if (!focusProject || navItems.length === 0) return

      // Shift+↑/↓: salta tra header
      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        if (e.key === 'ArrowDown') {
          // header successiva rispetto alla cat corrente (o prima header se siamo fuori selezione)
          let startCatId: CategoryId | null = null
          if (selectedCategoryId) startCatId = selectedCategoryId
          else if (selectedTaskId) {
            const t = focusProject.tasks.find((x) => x.id === selectedTaskId)
            if (t) startCatId = t.categoryId
          }
          if (!startCatId) {
            const firstHeader = navItems.find((i) => i.kind === 'header')
            if (firstHeader) applyNavItem(firstHeader)
            return
          }
          const i = sortedCategoryIds.indexOf(startCatId)
          if (i >= 0 && i < sortedCategoryIds.length - 1) {
            setSelectedCategoryId(sortedCategoryIds[i + 1])
          }
          return
        }
        // Shift+↑
        if (selectedTaskId) {
          const t = focusProject.tasks.find((x) => x.id === selectedTaskId)
          if (t) setSelectedCategoryId(t.categoryId)
          return
        }
        if (selectedCategoryId) {
          const i = sortedCategoryIds.indexOf(selectedCategoryId)
          if (i > 0) setSelectedCategoryId(sortedCategoryIds[i - 1])
          else focusQuickAdd()
          return
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        // se header collassata e siamo su di essa, espandila prima
        if (selectedCategoryId) {
          const cat = focusProject.categories.find((c) => c.id === selectedCategoryId)
          if (cat?.collapsed) expandCategory(focusProject.id, selectedCategoryId)
        }
        if (currentNavIdx === -1) {
          applyNavItem(navItems[0])
          return
        }
        const nextIdx = Math.min(currentNavIdx + 1, navItems.length - 1)
        applyNavItem(navItems[nextIdx])
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentNavIdx <= 0) {
          // siamo sul primo elemento (header prima cat) o nessuna selezione → esci verso QuickAdd
          focusQuickAdd()
          return
        }
        applyNavItem(navItems[currentNavIdx - 1])
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        requestOpenNotepad()
        return
      }

      if (e.key === ' ') {
        if (selectedTaskId) {
          e.preventDefault()
          if (focusProjectId) toggleTaskDone(focusProjectId, selectedTaskId)
          return
        }
        if (selectedCategoryId) {
          e.preventDefault()
          if (focusProjectId) toggleCategoryCollapsed(focusProjectId, selectedCategoryId)
          return
        }
      }

      if (e.key === 'Enter') {
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
        if (selectedTaskId || selectedCategoryId) {
          e.preventDefault()
          clearSelection()
          return
        }
        if (activeFilters.tagIds.length > 0 || activeFilters.categoryIds.length > 0) {
          e.preventDefault()
          clearFilters()
          return
        }
        e.preventDefault()
        clearFocus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    focusProjectId,
    focusProject,
    navItems,
    currentNavIdx,
    sortedCategoryIds,
    selectedTaskId,
    selectedCategoryId,
    activeFilters,
    toggleTaskDone,
    toggleCategoryCollapsed,
    expandCategory,
    setEditingTaskId,
    setEditingCategoryId,
    setSelectedCategoryId,
    clearSelection,
    clearFocus,
    clearFilters,
    applyNavItem,
    requestOpenNotepad,
    focusQuickAdd,
  ])

  useEffect(() => {
    if (focusProjectId) return
    if (!overviewSelectedProjectId) return
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useBoardStore.getState()
      if (st.editingTaskId || st.editingCategoryId) return
      if (isEditableTarget(e.target)) return
      if (!overviewSelectedProjectId) return

      const projIdx = projects.findIndex((p) => p.id === overviewSelectedProjectId)

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (projects.length === 0) return
        const next = e.key === 'ArrowRight' ? projIdx + 1 : projIdx - 1
        if (next < 0 || next >= projects.length) return
        e.preventDefault()
        setOverviewSelectedProjectId(projects[next].id)
        return
      }

      if (e.key === 'Enter' && overviewNavIdx === -1) {
        e.preventDefault()
        setFocusProject(overviewSelectedProjectId)
        return
      }

      if (e.key === 'Enter') {
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

      if (e.key === ' ') {
        if (selectedTaskId) {
          e.preventDefault()
          toggleTaskDone(overviewSelectedProjectId, selectedTaskId)
          return
        }
        if (selectedCategoryId) {
          e.preventDefault()
          toggleCategoryCollapsed(overviewSelectedProjectId, selectedCategoryId)
          return
        }
      }

      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        if (overviewNavItems.length === 0) return
        if (e.key === 'ArrowDown') {
          let startCatId: CategoryId | null = null
          if (selectedCategoryId) startCatId = selectedCategoryId
          else if (selectedTaskId) {
            const t = overviewSelectedProject?.tasks.find((x) => x.id === selectedTaskId)
            if (t) startCatId = t.categoryId
          }
          if (!startCatId) {
            const firstHeader = overviewNavItems.find((i) => i.kind === 'header')
            if (firstHeader?.kind === 'header') setSelectedCategoryId(firstHeader.categoryId)
            return
          }
          const i = overviewSortedCategoryIds.indexOf(startCatId)
          if (i >= 0 && i < overviewSortedCategoryIds.length - 1) {
            setSelectedCategoryId(overviewSortedCategoryIds[i + 1])
          }
          return
        }
        if (selectedTaskId) {
          const t = overviewSelectedProject?.tasks.find((x) => x.id === selectedTaskId)
          if (t) setSelectedCategoryId(t.categoryId)
          return
        }
        if (selectedCategoryId) {
          const i = overviewSortedCategoryIds.indexOf(selectedCategoryId)
          if (i > 0) setSelectedCategoryId(overviewSortedCategoryIds[i - 1])
          else setSelectedCategoryId(null)
          return
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (overviewNavItems.length === 0) return
        if (selectedCategoryId) {
          const cat = overviewSelectedProject?.categories.find((c) => c.id === selectedCategoryId)
          if (cat?.collapsed) expandCategory(overviewSelectedProjectId, selectedCategoryId)
        }
        if (overviewNavIdx === -1) {
          const first = overviewNavItems[0]
          if (first.kind === 'header') setSelectedCategoryId(first.categoryId)
          else setSelectedTaskId(first.id)
          return
        }
        const nextIdx = Math.min(overviewNavIdx + 1, overviewNavItems.length - 1)
        const next = overviewNavItems[nextIdx]
        if (next.kind === 'header') setSelectedCategoryId(next.categoryId)
        else setSelectedTaskId(next.id)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (overviewNavIdx === -1) {
          setOverviewSelectedProjectId(null)
          focusCommandBar()
          return
        }
        if (overviewNavIdx === 0) {
          clearSelection()
          return
        }
        const prev = overviewNavItems[overviewNavIdx - 1]
        if (prev.kind === 'header') setSelectedCategoryId(prev.categoryId)
        else setSelectedTaskId(prev.id)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        if (overviewNavIdx !== -1) {
          clearSelection()
          return
        }
        setOverviewSelectedProjectId(null)
        focusCommandBar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    focusProjectId,
    overviewSelectedProjectId,
    overviewSelectedProject,
    overviewNavItems,
    overviewNavIdx,
    overviewSortedCategoryIds,
    projects,
    selectedTaskId,
    selectedCategoryId,
    setOverviewSelectedProjectId,
    setSelectedTaskId,
    setSelectedCategoryId,
    clearSelection,
    setFocusProject,
    setEditingTaskId,
    setEditingCategoryId,
    toggleTaskDone,
    toggleCategoryCollapsed,
    expandCategory,
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

  const noTagsHint = tags.length === 0
  const noProjects = projects.length === 0

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1440px] flex-col px-4',
        focusProject ? 'gap-3 pt-3 pb-3 lg:h-[calc(100vh-3rem)]' : 'gap-4 pt-4 pb-24',
      )}
    >
      {(noTagsHint || noProjects) && (
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          {noTagsHint && projects.length > 0 && (
            <span>
              nessun tag definito · usa{' '}
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                Tag
              </kbd>{' '}
              in alto per crearne
            </span>
          )}
          {noProjects && (
            <span className="text-muted-foreground">
              digita un nome qui sopra per creare il primo progetto · prova{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">ircnews</code>,{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">landing</code>
            </span>
          )}
        </div>
      )}

      {focusProject ? (
        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
          <div className="min-w-0 flex-1 lg:min-h-0">
            <ProjectCard
              project={focusProject}
              allTags={sortedTags}
              focused
              taskFilter={taskFilter}
              selectedTaskId={selectedTaskId}
              selectedCategoryId={selectedCategoryId}
              onOpenLog={onOpenLog}
            />
          </div>
          {notepadExpanded && (
            <div className="lg:min-h-0 lg:basis-1/3 lg:shrink-0">
              <Notepad projectId={focusProject.id} notes={focusProject.notes} />
            </div>
          )}
          <NotepadTab
            expanded={notepadExpanded}
            onToggle={() => {
              if (notepadExpanded) setNotepadExpanded(false)
              else requestOpenNotepad()
            }}
          />
        </div>
      ) : (
        <BoardGrid count={projects.length}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              allTags={sortedTags}
              taskFilter={taskFilter}
              selectedTaskId={overviewSelectedProjectId === p.id ? selectedTaskId : null}
              selectedCategoryId={overviewSelectedProjectId === p.id ? selectedCategoryId : null}
              onOpenLog={onOpenLog}
            />
          ))}
        </BoardGrid>
      )}
    </div>
  )
}

function BoardGrid({ count, children }: { count: number; children: React.ReactNode }) {
  if (count === 0) return null
  const cols =
    count === 1
      ? 'grid-cols-1'
      : count === 2
        ? 'grid-cols-1 lg:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  return <div className={`grid gap-4 ${cols}`}>{children}</div>
}
