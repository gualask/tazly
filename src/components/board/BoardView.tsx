import { useCallback, useEffect, useMemo, useState } from 'react'

import { Notepad } from '@/components/board/Notepad'
import { NotepadTab } from '@/components/board/NotepadTab'
import { ProjectCard } from '@/components/board/ProjectCard'
import { useBoardKeyboard } from '@/hooks/useBoardKeyboard'
import { useNavModel } from '@/hooks/useBoardNav'
import { focusCommandBar, focusQuickAdd as focusQuickAddInput } from '@/lib/focus'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId, Task, TaskId } from '@/types/domain'

interface BoardViewProps {
  onOpenLog?: (projectId: ProjectId) => void
}

export function BoardView({ onOpenLog }: BoardViewProps = {}) {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const activeFilters = useBoardStore((s) => s.activeFilters)
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

  const focusQuickAdd = useCallback(() => {
    clearSelection()
    focusQuickAddInput()
  }, [clearSelection])

  const overviewSelectedProject = useMemo(
    () =>
      overviewSelectedProjectId
        ? (projects.find((p) => p.id === overviewSelectedProjectId) ?? null)
        : null,
    [projects, overviewSelectedProjectId],
  )

  const focusNav = useNavModel(focusProject, taskFilter, selectedTaskId, selectedCategoryId)
  const overviewNav = useNavModel(
    overviewSelectedProject,
    taskFilter,
    selectedTaskId,
    selectedCategoryId,
  )

  // --- Navigazione da tastiera: modalità focus ---
  const focusEscape = useCallback(
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

  const focusArrowRight = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      requestOpenNotepad()
    },
    [requestOpenNotepad],
  )

  useBoardKeyboard({
    active: !!focusProjectId,
    projectId: focusProjectId,
    project: focusProject,
    navModel: focusNav,
    selectedTaskId,
    selectedCategoryId,
    onArrowRight: focusArrowRight,
    onArrowUpAtUnselected: focusQuickAdd,
    onArrowUpAtFirst: focusQuickAdd,
    onJumpExitTop: focusQuickAdd,
    onEscape: focusEscape,
  })

  // --- Navigazione da tastiera: modalità overview ---
  const overviewHorizontal = useCallback(
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

  const overviewExitToCommandBar = useCallback(() => {
    setOverviewSelectedProjectId(null)
    focusCommandBar()
  }, [setOverviewSelectedProjectId])

  const overviewEnterUnselected = useCallback(() => {
    if (!overviewSelectedProjectId) return false
    setFocusProject(overviewSelectedProjectId)
    return true
  }, [overviewSelectedProjectId, setFocusProject])

  const clearSelectedCategory = useCallback(
    () => setSelectedCategoryId(null),
    [setSelectedCategoryId],
  )

  const overviewEscape = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      if (overviewNav.navIdx !== -1) {
        clearSelection()
        return
      }
      overviewExitToCommandBar()
    },
    [overviewNav.navIdx, clearSelection, overviewExitToCommandBar],
  )

  useBoardKeyboard({
    active: !focusProjectId && !!overviewSelectedProjectId,
    projectId: overviewSelectedProjectId,
    project: overviewSelectedProject,
    navModel: overviewNav,
    selectedTaskId,
    selectedCategoryId,
    onArrowLeft: overviewHorizontal,
    onArrowRight: overviewHorizontal,
    onArrowUpAtUnselected: overviewExitToCommandBar,
    onArrowUpAtFirst: clearSelection,
    onJumpExitTop: clearSelectedCategory,
    onEnterUnselected: overviewEnterUnselected,
    onEscape: overviewEscape,
  })

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
