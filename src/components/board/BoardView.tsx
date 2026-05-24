import { useEffect, useMemo, useState } from 'react'

import { Notepad } from '@/components/board/Notepad'
import { NotepadTab } from '@/components/board/NotepadTab'
import { ProjectCard } from '@/components/board/ProjectCard'
import { useNavModel } from '@/hooks/useBoardNav'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'
import { useBoardSelectionSync } from './useBoardSelectionSync'
import { useFocusModeKeyboard } from './useFocusModeKeyboard'
import { useOverviewKeyboard } from './useOverviewKeyboard'

interface BoardViewProps {
  onOpenLog?: (projectId: ProjectId) => void
}

export function BoardView({ onOpenLog }: BoardViewProps = {}) {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const selectedTaskId = useBoardStore((s) => s.selectedTaskId)
  const selectedCategoryId = useBoardStore((s) => s.selectedCategoryId)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [notepadExpanded, setNotepadExpanded] = useState(false)

  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags])

  const focusProject = useMemo(
    () => (focusProjectId ? (projects.find((p) => p.id === focusProjectId) ?? null) : null),
    [focusProjectId, projects],
  )

  const overviewSelectedProject = useMemo(
    () =>
      overviewSelectedProjectId
        ? (projects.find((p) => p.id === overviewSelectedProjectId) ?? null)
        : null,
    [projects, overviewSelectedProjectId],
  )

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

  const { taskFilter } = useBoardSelectionSync({ focusProject })

  const focusNav = useNavModel(focusProject, taskFilter, selectedTaskId, selectedCategoryId)
  const overviewNav = useNavModel(
    overviewSelectedProject,
    taskFilter,
    selectedTaskId,
    selectedCategoryId,
  )

  useFocusModeKeyboard({ focusProjectId, focusProject, navModel: focusNav })
  useOverviewKeyboard({ focusProjectId, overviewSelectedProject, navModel: overviewNav })

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
