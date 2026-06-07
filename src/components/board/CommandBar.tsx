import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, ProjectId } from '@/types/domain'
import { TaskComposer } from './TaskComposer'

interface CommandBarProps {
  /** Inoltrato dal composer alla creazione di un task (per espansione categoria + highlight). */
  onTaskCreated?: (projectId: ProjectId, categoryId: CategoryId, taskId: string) => void
}

/**
 * Barra di comando dell'app: thin wrapper attorno al composer condiviso `TaskComposer`,
 * collegato allo stato di focus globale dello store. I filtri vivono ora nella FilterBar.
 */
export function CommandBar({ onTaskCreated }: CommandBarProps) {
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const projects = useBoardStore((s) => s.board.projects)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)
  const clearFocus = useBoardStore((s) => s.clearFocus)
  const setOverviewSelectedProjectId = useBoardStore((s) => s.setOverviewSelectedProjectId)
  const resetView = useBoardStore((s) => s.resetView)
  const composerCapture = useBoardStore((s) => s.composerCapture)

  return (
    <TaskComposer
      selectedProjectId={focusProjectId}
      onSelectProject={(id) => (id ? setFocusProject(id) : clearFocus())}
      capturedTitle={composerCapture}
      onArrowDownExit={() => {
        if (projects.length > 0) setOverviewSelectedProjectId(projects[0].id)
      }}
      showResetButton
      onReset={resetView}
      onTaskCreated={onTaskCreated}
    />
  )
}
