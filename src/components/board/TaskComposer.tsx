import { IconChevronRight, IconHome, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef } from 'react'

import { Pill } from '@/components/ui/pill'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { COMPOSER_ROOT_ATTR } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, ProjectId } from '@/types/domain'
import { ProjectPicker } from './ProjectPicker'
import { QuickAddBar } from './QuickAddBar'

interface TaskComposerProps {
  /** Progetto selezionato (controlled): app = focusProjectId; widget = stato locale. */
  selectedProjectId: ProjectId | null
  onSelectProject: (id: ProjectId | null) => void
  /** Categoria pre-bloccata al mount (memoria lastQuickAdd nel widget). */
  initialCategory?: { id: CategoryId; name: string } | null
  /** Titolo catturato dal picker DOM del widget: pre-popola il campo titolo (seq cresce per ri-scattare). */
  capturedTitle?: { text: string; seq: number } | null
  onTaskCreated?: (projectId: ProjectId, categoryId: CategoryId, taskId: string) => void
  /** Esc sull'input progetto vuoto: app = no-op; widget = chiudi overlay. */
  onEscapeAtProjectRoot?: () => void
  /** ArrowDown sullo step progetto senza suggerimenti: app overview = seleziona prima card. */
  onArrowDownExit?: () => void
  /** Mostra il bottone Home/reset (solo app). */
  showResetButton?: boolean
  onReset?: () => void
  autoFocus?: boolean
}

export function TaskComposer({
  selectedProjectId,
  onSelectProject,
  initialCategory,
  capturedTitle,
  onTaskCreated,
  onEscapeAtProjectRoot,
  onArrowDownExit,
  showResetButton,
  onReset,
  autoFocus = true,
}: TaskComposerProps) {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)

  const rootRef = useRef<HTMLDivElement>(null)

  const selectedProject = useMemo(
    () => (selectedProjectId ? (projects.find((p) => p.id === selectedProjectId) ?? null) : null),
    [selectedProjectId, projects],
  )

  // Focus del primo campo della quick-add quando un progetto è selezionato. Lo step di
  // scelta progetto gestisce il proprio focus dentro ProjectPicker.
  useEffect(() => {
    if (!autoFocus || !selectedProjectId) return
    const id = requestAnimationFrame(() => rootRef.current?.querySelector('input')?.focus())
    return () => cancelAnimationFrame(id)
  }, [selectedProjectId, autoFocus])

  const resetButton = showResetButton && (
    <button
      type="button"
      onClick={onReset}
      aria-label="Reset vista"
      className="-ml-0.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <IconHome className="size-4" />
    </button>
  )

  if (selectedProject) {
    const leading = (
      <>
        {resetButton}
        <Pill>
          {selectedProject.name}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelectProject(null)}
                className="opacity-50 hover:opacity-100"
                aria-label="Cambia progetto"
              >
                <IconX className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cambia progetto</TooltipContent>
          </Tooltip>
        </Pill>
        <IconChevronRight className="size-3 text-muted-foreground" />
      </>
    )

    return (
      <div ref={rootRef} {...{ [COMPOSER_ROOT_ATTR]: '' }}>
        <QuickAddBar
          key={selectedProject.id}
          project={selectedProject}
          allTags={tags}
          active
          initialCategory={initialCategory}
          capturedTitle={capturedTitle}
          leading={leading}
          onExitTop={() => onSelectProject(null)}
          onTaskCreated={(categoryId, taskId) =>
            onTaskCreated?.(selectedProject.id, categoryId, taskId)
          }
        />
      </div>
    )
  }

  return (
    <ProjectPicker
      leading={resetButton}
      onSelectProject={onSelectProject}
      onEscapeAtRoot={onEscapeAtProjectRoot}
      onArrowDownExit={onArrowDownExit}
      autoFocus={autoFocus}
    />
  )
}
