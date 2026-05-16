import { useCallback, useEffect, useMemo, useState } from 'react'

import { Notepad } from '@/components/board/Notepad'
import { NotepadTab } from '@/components/board/NotepadTab'
import { ProjectCard } from '@/components/board/ProjectCard'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, Task, TaskId } from '@/types/domain'

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable
}

export function BoardView() {
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
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [notepadOpenSession, setNotepadOpenSession] = useState(false)

  useEffect(() => {
    if (notepadOpenTick === 0) return
    setNotepadOpenSession(true)
  }, [notepadOpenTick])

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
    if (!focusProjectId) {
      clearSelection()
      return
    }
    if (selectedTaskId && !visibleTaskIds.includes(selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [focusProjectId, visibleTaskIds, selectedTaskId, setSelectedTaskId, clearSelection])

  const sortedCategoryIds = useMemo(() => {
    if (!focusProject) return [] as CategoryId[]
    return [...focusProject.categories].sort((a, b) => a.order - b.order).map((c) => c.id)
  }, [focusProject])

  useEffect(() => {
    if (selectedCategoryId && !sortedCategoryIds.includes(selectedCategoryId)) {
      setSelectedCategoryId(null)
    }
  }, [sortedCategoryIds, selectedCategoryId, setSelectedCategoryId])

  function focusQuickAdd() {
    clearSelection()
    const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
    const input = root?.querySelector<HTMLInputElement>('input')
    input?.focus()
  }

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
    if (selectedTaskId) return navItems.findIndex((i) => i.kind === 'task' && i.id === selectedTaskId)
    if (selectedCategoryId)
      return navItems.findIndex(
        (i) => i.kind === 'header' && i.categoryId === selectedCategoryId,
      )
    return -1
  }, [navItems, selectedTaskId, selectedCategoryId])

  const applyNavItem = useCallback(
    (item: NavItem) => {
      if (item.kind === 'header') setSelectedCategoryId(item.categoryId)
      else setSelectedTaskId(item.id)
    },
    [setSelectedCategoryId, setSelectedTaskId],
  )


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
    setSelectedTaskId,
    setSelectedCategoryId,
    clearSelection,
    clearFocus,
    clearFilters,
    applyNavItem,
    requestOpenNotepad,
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

  const noTagsHint = tags.length === 0
  const noProjects = projects.length === 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pt-4 pb-24">
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1">
              <ProjectCard
                project={focusProject}
                allTags={sortedTags}
                focused
                taskFilter={taskFilter}
                selectedTaskId={selectedTaskId}
                selectedCategoryId={selectedCategoryId}
              />
            </div>
            {focusProject.notes.length > 0 || notepadOpenSession ? (
              <div className="lg:basis-1/3 lg:shrink-0">
                <Notepad
                  projectId={focusProject.id}
                  notes={focusProject.notes}
                  onBlurEmpty={() => setNotepadOpenSession(false)}
                />
              </div>
            ) : (
              <NotepadTab />
            )}
          </div>
        </div>
      ) : (
        <BoardGrid count={projects.length}>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} allTags={sortedTags} taskFilter={taskFilter} />
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

