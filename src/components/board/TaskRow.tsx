import { IconCheck, IconTrash, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId, Tag, Task } from '@/types/domain'

interface TaskRowProps {
  projectId: ProjectId
  task: Task
  allTags: Tag[]
  highlighted?: boolean
  selected?: boolean
}

export function TaskRow({ projectId, task, allTags, highlighted, selected }: TaskRowProps) {
  const toggleTaskDone = useBoardStore((s) => s.toggleTaskDone)
  const updateTask = useBoardStore((s) => s.updateTask)
  const removeTask = useBoardStore((s) => s.removeTask)
  const editingTaskId = useBoardStore((s) => s.editingTaskId)
  const setEditingTaskId = useBoardStore((s) => s.setEditingTaskId)

  const editing = editingTaskId === task.id
  const [title, setTitle] = useState(task.title)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(task.tagIds)

  const tagById = new Map(allTags.map((t) => [t.id, t]))
  const taskTags = task.tagIds.map((id) => tagById.get(id)).filter((x): x is Tag => Boolean(x))

  function openEdit() {
    setTitle(task.title)
    setSelectedTagIds(task.tagIds)
    setEditingTaskId(task.id)
  }

  function cancel() {
    setTitle(task.title)
    setSelectedTagIds(task.tagIds)
    setEditingTaskId(null)
  }

  function save() {
    updateTask(projectId, task.id, { title, tagIds: selectedTagIds })
    setEditingTaskId(null)
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function onContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    cancel()
  }

  if (editing) {
    return (
      <div
        className="flex flex-col gap-2 rounded-md border bg-card p-2"
        onBlur={onContainerBlur}
      >
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
            }}
            autoFocus
            className="flex-1"
          />
          <Button size="icon" variant="ghost" onClick={save} title="Salva (Invio)">
            <IconCheck />
          </Button>
          <Button size="icon" variant="ghost" onClick={cancel} title="Annulla (Esc)">
            <IconX />
          </Button>
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((t) => {
              const isSelected = selectedTagIds.includes(t.id)
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={cn('transition', !isSelected && 'opacity-40 hover:opacity-100')}
                >
                  <TagBadge tag={t} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-task-id={task.id}
      className={cn(
        'group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/40',
        highlighted && 'animate-task-highlight',
        selected && 'bg-accent/60 ring-1 ring-foreground/20',
      )}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => toggleTaskDone(projectId, task.id)}
        className="mt-1 size-4 cursor-pointer rounded border-input"
      />
      <button
        type="button"
        data-task-edit
        onClick={openEdit}
        className={cn(
          'flex flex-1 flex-wrap items-center gap-1.5 text-left text-sm',
          task.done && 'text-muted-foreground line-through',
        )}
      >
        <span>{task.title}</span>
        {taskTags.map((t) => (
          <TagBadge key={t.id} tag={t} />
        ))}
      </button>
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100"
        onClick={() => removeTask(projectId, task.id)}
        title="Elimina task"
      >
        <IconTrash />
      </Button>
    </div>
  )
}
