import { IconCheck, IconDotsVertical, IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { CategoryBlock } from '@/components/board/CategoryBlock'
import { IconButton } from '@/components/common/IconButton'
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
  /** Task da evidenziare brevemente (appena creato dal composer in header). */
  highlightedTaskId?: TaskId | null
  onOpenLog?: (projectId: Project['id']) => void
}

export function ProjectCard({
  project,
  allTags,
  focused,
  taskFilter,
  selectedTaskId,
  selectedCategoryId,
  highlightedTaskId,
  onOpenLog,
}: ProjectCardProps) {
  const renameProject = useBoardStore((s) => s.renameProject)
  const removeProject = useBoardStore((s) => s.removeProject)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const isFocusedHere = focusProjectId === project.id
  const isOverviewSelected = !focusProjectId && overviewSelectedProjectId === project.id

  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(project.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const sortedCategories = useMemo(
    () => [...project.categories].sort((a, b) => a.order - b.order),
    [project.categories],
  )

  const totalCount = project.tasks.length
  const doneCount = project.tasks.filter((t) => t.done).length
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  function saveRename() {
    renameProject(project.id, name)
    setRenaming(false)
  }

  return (
    <div
      data-project-id={project.id}
      className={cn(
        'glass flex flex-col gap-3 rounded-xl border border-border p-4 text-card-foreground',
        focused ? 'min-h-[60vh] lg:h-full lg:overflow-hidden' : 'overflow-hidden',
        isOverviewSelected && 'ring-1 ring-foreground/30',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-2.5 border-border border-b',
          'bg-gradient-to-b from-white/50 to-white/10 dark:from-white/[0.06] dark:to-white/[0.02]',
          focused ? '-mx-4 -mt-4 rounded-t-xl px-4 pt-3 pb-3' : '-mx-4 -mt-4 px-4 pt-3.5 pb-3',
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
          // biome-ignore lint/a11y/noStaticElementInteractions: interattivo solo fuori focus, con role/tabIndex/onKeyDown impostati di conseguenza
          <div
            role={focused ? undefined : 'button'}
            tabIndex={focused ? undefined : -1}
            onClick={focused ? undefined : () => setFocusProject(project.id)}
            onKeyDown={
              focused
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setFocusProject(project.id)
                    }
                  }
            }
            className={cn(
              'flex items-center gap-2',
              !focused &&
                '-mx-2 cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-accent/40',
            )}
          >
            <h2
              className={cn(
                'flex-1 truncate font-bold tracking-tight',
                focused ? 'text-2xl' : 'text-lg',
              )}
            >
              {project.name}
            </h2>
            {totalCount > 0 && doneCount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenLog?.(project.id)
                }}
                className="rounded text-muted-foreground text-xs tabular-nums transition-colors hover:text-foreground"
                title="Vedi completati"
              >
                {doneCount}/{totalCount}
              </button>
            ) : (
              <span className="text-muted-foreground text-xs tabular-nums">
                {doneCount}/{totalCount}
              </span>
            )}
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
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingDelete(true)}>
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

        {totalCount > 0 &&
          !renaming &&
          (doneCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenLog?.(project.id)
              }}
              // padding verticale per allargare l'area cliccabile mantenendo la barra sottile;
              // il margine negativo riassorbe l'altezza extra nel layout
              className="group/progress -my-1 flex w-full items-center rounded-sm py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              title="Vedi completati (L)"
              aria-label={`${doneCount} di ${totalCount} completati — apri lo storico`}
            >
              <span className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="block h-full rounded-full bg-foreground/40 transition-[width,background-color] duration-300 group-hover/progress:bg-foreground/70"
                  style={{ width: `${progressPct}%` }}
                />
              </span>
            </button>
          ) : (
            <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-foreground/40 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ))}
      </div>

      <div
        role={sortedCategories.length > 0 ? 'list' : undefined}
        className={cn(
          'flex flex-col gap-2',
          focused && 'lg:-mr-2 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-2',
        )}
      >
        {sortedCategories.length === 0 ? (
          isFocusedHere ? (
            <p className="text-muted-foreground text-xs">
              Aggiungi un task dalla barra in alto: crea o scegli una categoria.
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
    </div>
  )
}
