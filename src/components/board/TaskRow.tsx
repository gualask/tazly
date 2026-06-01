import { IconCheck, IconCopy, IconTrash, IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/common/IconButton'
import { TagBadge } from '@/components/tags/TagBadge'
import { Checkbox } from '@/components/ui/checkbox'
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
  const copyTaskById = useBoardStore((s) => s.copyTaskById)
  const copiedTaskId = useBoardStore((s) => s.copiedTaskId)
  const copyTick = useBoardStore((s) => s.copyTick)

  const editing = editingTaskId === task.id
  const [title, setTitle] = useState(task.title)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(task.tagIds)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flash + spunta quando il task viene copiato, da mouse o da tastiera
  // biome-ignore lint/correctness/useExhaustiveDependencies: copyTick ri-attiva l'effetto a ogni copia
  useEffect(() => {
    if (copiedTaskId !== task.id) return
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 1200)
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }
  }, [copyTick, copiedTaskId, task.id])

  function copy() {
    void copyTaskById(task.id)
  }

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

  function onContainerBlur(e: React.FocusEvent<HTMLLIElement>) {
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    cancel()
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 px-2 py-0.5" onBlur={onContainerBlur}>
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
          <IconButton onClick={save} tooltip="Salva (Invio)">
            <IconCheck />
          </IconButton>
          <IconButton onClick={cancel} tooltip="Annulla (Esc)">
            <IconX />
          </IconButton>
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
                  aria-pressed={isSelected}
                  className={cn(
                    'rounded-md transition',
                    isSelected ? 'ring-2 ring-foreground/40' : 'opacity-40 hover:opacity-100',
                  )}
                >
                  <TagBadge tag={t} />
                </button>
              )
            })}
          </div>
        )}
      </li>
    )
  }

  return (
    <li
      data-task-id={task.id}
      className={cn(
        'group flex items-start gap-2 rounded-md px-2 py-0.5 transition-colors hover:bg-accent/40',
        highlighted && 'animate-task-highlight',
        copied && 'animate-task-copied',
        selected && 'bg-accent/60 ring-1 ring-foreground/20',
      )}
    >
      <Checkbox
        checked={task.done}
        onCheckedChange={() => toggleTaskDone(projectId, task.id)}
        className="mt-1 size-3.5 cursor-pointer"
      />
      <button
        type="button"
        data-task-edit
        onClick={openEdit}
        className={cn(
          'min-w-0 text-left text-sm leading-6',
          task.done && 'text-muted-foreground line-through',
        )}
      >
        <span>{task.title}</span>
        {taskTags.map((t) => (
          <TagBadge key={t.id} tag={t} className="ml-1.5 px-1 align-[1px] text-[10px] leading-4" />
        ))}
      </button>
      <IconButton
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={copy}
        tooltip="Copia testo"
      >
        <IconCopy />
      </IconButton>
      <div className="flex-1" />
      <IconButton
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={() => removeTask(projectId, task.id)}
        tooltip="Elimina task"
      >
        <IconTrash />
      </IconButton>
    </li>
  )
}
