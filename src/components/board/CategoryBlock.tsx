import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'

import { TaskRow } from '@/components/board/TaskRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { Category, ProjectId, Tag, Task, TaskId } from '@/types/domain'

interface CategoryBlockProps {
  projectId: ProjectId
  category: Category
  tasks: Task[]
  allTags: Tag[]
  highlightedTaskId?: TaskId | null
  selectedTaskId?: TaskId | null
  selected?: boolean
}

export function CategoryBlock({
  projectId,
  category,
  tasks,
  allTags,
  highlightedTaskId,
  selectedTaskId,
  selected,
}: CategoryBlockProps) {
  const toggleCollapsed = useBoardStore((s) => s.toggleCategoryCollapsed)
  const renameCategory = useBoardStore((s) => s.renameCategory)
  const removeCategory = useBoardStore((s) => s.removeCategory)
  const editingCategoryId = useBoardStore((s) => s.editingCategoryId)
  const setEditingCategoryId = useBoardStore((s) => s.setEditingCategoryId)

  const renaming = editingCategoryId === category.id
  const [name, setName] = useState(category.name)

  function openRename() {
    setName(category.name)
    setEditingCategoryId(category.id)
  }

  function cancelRename() {
    setName(category.name)
    setEditingCategoryId(null)
  }

  function saveRename() {
    renameCategory(projectId, category.id, name)
    setEditingCategoryId(null)
  }

  function onRenameBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    cancelRename()
  }

  return (
    <div
      data-category-id={category.id}
      className={cn(
        'flex flex-col gap-1 rounded-md',
        selected && !renaming && 'bg-accent/40 ring-1 ring-foreground/20',
      )}
    >
      <div
        className="group flex items-center gap-1"
        onBlur={renaming ? onRenameBlur : undefined}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => toggleCollapsed(projectId, category.id)}
          className="size-6"
        >
          {category.collapsed ? <IconChevronRight /> : <IconChevronDown />}
        </Button>
        {renaming ? (
          <>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveRename()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelRename()
                }
              }}
              className="h-7 flex-1"
            />
            <Button size="icon" variant="ghost" onClick={saveRename} title="Salva (Invio)">
              <IconCheck />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelRename} title="Annulla (Esc)">
              <IconX />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openRename}
              className="flex flex-1 items-center gap-2 text-left font-medium text-sm"
              title="Rinomina"
            >
              <span>{category.name}</span>
              <span className="text-muted-foreground text-xs">{tasks.length}</span>
            </button>
            <div className="opacity-0 group-hover:opacity-100 transition">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const msg =
                    tasks.length > 0
                      ? `Eliminare la categoria "${category.name}" e i suoi ${tasks.length} task?`
                      : `Eliminare la categoria "${category.name}"?`
                  if (confirm(msg)) removeCategory(projectId, category.id)
                }}
              >
                <IconTrash />
              </Button>
            </div>
          </>
        )}
      </div>
      {!category.collapsed && (
        <div className="ml-6 flex flex-col gap-1">
          {tasks.length === 0 && <p className="px-2 text-muted-foreground text-xs">Nessun task</p>}
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              projectId={projectId}
              task={t}
              allTags={allTags}
              highlighted={highlightedTaskId === t.id}
              selected={selectedTaskId === t.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
