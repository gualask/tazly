import { IconCheck, IconTrash, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CategoryBlock } from '@/components/board/CategoryBlock'
import { QuickAddBar } from '@/components/board/QuickAddBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, Project, Tag, Task, TaskId } from '@/types/domain'

interface ProjectCardProps {
  project: Project
  allTags: Tag[]
  focused?: boolean
  taskFilter?: (task: Task) => boolean
  selectedTaskId?: TaskId | null
  selectedCategoryId?: CategoryId | null
}

export function ProjectCard({
  project,
  allTags,
  focused,
  taskFilter,
  selectedTaskId,
  selectedCategoryId,
}: ProjectCardProps) {
  const renameProject = useBoardStore((s) => s.renameProject)
  const removeProject = useBoardStore((s) => s.removeProject)
  const expandCategory = useBoardStore((s) => s.expandCategory)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const isFocusedHere = focusProjectId === project.id

  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(project.name)
  const [highlightedTaskId, setHighlightedTaskId] = useState<TaskId | null>(null)
  const highlightTimer = useRef<number | null>(null)

  const sortedCategories = useMemo(
    () => [...project.categories].sort((a, b) => a.order - b.order),
    [project.categories],
  )

  const openCount = project.tasks.filter((t) => !t.done).length

  function saveRename() {
    renameProject(project.id, name)
    setRenaming(false)
  }

  function handleTaskCreated(categoryId: CategoryId, taskId: TaskId) {
    expandCategory(project.id, categoryId)
    setHighlightedTaskId(taskId)
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    highlightTimer.current = window.setTimeout(() => setHighlightedTaskId(null), 1800)
  }

  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    }
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        focused ? 'min-h-[60vh]' : 'rounded-md border border-border bg-card p-4',
      )}
    >
      <div className="group flex items-center gap-2">
        {renaming ? (
          <>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="h-8 flex-1"
            />
            <Button size="icon" variant="ghost" onClick={saveRename}>
              <IconCheck />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setRenaming(false)}>
              <IconX />
            </Button>
          </>
        ) : (
          <>
            {focused ? (
              <button
                type="button"
                onClick={() => setRenaming(true)}
                className="flex-1 text-left font-semibold text-xl tracking-tight"
                title="Rinomina"
              >
                {project.name}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFocusProject(project.id)}
                className="flex-1 text-left font-semibold text-base hover:text-muted-foreground"
                title="Apri in focus"
              >
                {project.name}
              </button>
            )}
            <span className="text-muted-foreground text-xs tabular-nums">
              {openCount} apert{openCount === 1 ? 'o' : 'i'}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => {
                  if (confirm(`Eliminare il progetto "${project.name}" e tutto il suo contenuto?`))
                    removeProject(project.id)
                }}
                title="Elimina progetto"
              >
                <IconTrash />
              </Button>
            </div>
          </>
        )}
      </div>

      <div data-tazly-quickadd-root={isFocusedHere ? '' : undefined}>
        <QuickAddBar project={project} allTags={allTags} onTaskCreated={handleTaskCreated} />
      </div>

      <div className="flex flex-col gap-2">
        {sortedCategories.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Aggiungi una categoria o digita una nuova nella barra qui sopra.
          </p>
        ) : (
          sortedCategories.map((c) => {
            const tasks = project.tasks
              .filter((t) => t.categoryId === c.id)
              .filter((t) => (taskFilter ? taskFilter(t) : true))
            return (
              <CategoryBlock
                key={c.id}
                projectId={project.id}
                category={c}
                tasks={tasks}
                allTags={allTags}
                highlightedTaskId={highlightedTaskId}
                selectedTaskId={selectedTaskId}
                selected={selectedCategoryId === c.id}
              />
            )
          })
        )}
      </div>

    </div>
  )
}
