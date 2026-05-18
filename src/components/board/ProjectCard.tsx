import { IconCheck, IconDotsVertical, IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CategoryBlock } from '@/components/board/CategoryBlock'
import { QuickAddBar } from '@/components/board/QuickAddBar'
import { IconButton } from '@/components/common/IconButton'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const isFocusedHere = focusProjectId === project.id
  const isOverviewSelected = !focusProjectId && overviewSelectedProjectId === project.id

  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(project.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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

  const Wrapper = focused ? 'div' : Card

  return (
    <Wrapper
      data-project-id={project.id}
      className={cn(
        'flex flex-col gap-3',
        focused
          ? 'min-h-[60vh]'
          : 'rounded-md border-border bg-card p-4 py-4 shadow-none',
        isOverviewSelected && 'ring-1 ring-foreground/30',
      )}
    >
      <div
        className={cn(
          focused && 'sticky top-11 z-10 -mx-4 flex flex-col gap-3 bg-background px-4 pt-2 pb-2',
        )}
      >
      {renaming ? (
        <div className="flex items-center gap-2">
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
          <IconButton onClick={saveRename} tooltip="Salva (Invio)">
            <IconCheck />
          </IconButton>
          <IconButton onClick={() => setRenaming(false)} tooltip="Annulla (Esc)">
            <IconX />
          </IconButton>
        </div>
      ) : (
        <div
          role={focused ? undefined : 'button'}
          tabIndex={focused ? undefined : -1}
          onClick={focused ? undefined : () => setFocusProject(project.id)}
          className={cn(
            'flex items-center gap-2',
            !focused &&
              '-mx-2 cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-accent/40',
          )}
        >
          <span
            className={cn(
              'flex-1 truncate font-semibold',
              focused ? 'text-xl tracking-tight' : 'text-base',
            )}
          >
            {project.name}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {openCount} apert{openCount === 1 ? 'o' : 'i'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <IconButton tooltip="Opzioni progetto" className="size-7">
                <IconDotsVertical />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <IconPencil />
                Rinomina
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmingDelete(true)}
              >
                <IconTrash />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare il progetto?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{project.name}" verrà eliminato insieme a tutto il suo contenuto.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => removeProject(project.id)}
                >
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isFocusedHere && (
        <div data-tazly-quickadd-root="">
          <QuickAddBar
            project={project}
            allTags={allTags}
            active
            onTaskCreated={handleTaskCreated}
          />
        </div>
      )}
      </div>

      <div className="flex flex-col gap-2">
        {sortedCategories.length === 0 ? (
          isFocusedHere ? (
            <p className="text-muted-foreground text-xs">
              Aggiungi una categoria o digita una nuova nella barra qui sopra.
            </p>
          ) : null
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
    </Wrapper>
  )
}
