import { IconArrowBackUp } from '@tabler/icons-react'
import { useMemo } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { useBoardStore } from '@/store/useBoardStore'
import type { Project, Tag, Task } from '@/types/domain'

interface Entry {
  task: Task
  project: Project
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return key
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(today.getTime()) === key) return 'Oggi'
  if (dayKey(yesterday.getTime()) === key) return 'Ieri'
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: today.getFullYear() === y ? undefined : 'numeric',
  })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export function LogView() {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const toggleTaskDone = useBoardStore((s) => s.toggleTaskDone)

  const tagById = useMemo(() => new Map<string, Tag>(tags.map((t) => [t.id, t])), [tags])

  const grouped = useMemo(() => {
    const entries: Entry[] = []
    for (const p of projects) {
      for (const t of p.tasks) {
        if (!t.done || !t.completedAt) continue
        entries.push({ task: t, project: p })
      }
    }
    entries.sort((a, b) => (b.task.completedAt ?? 0) - (a.task.completedAt ?? 0))
    const groups = new Map<string, Entry[]>()
    for (const e of entries) {
      const k = dayKey(e.task.completedAt ?? 0)
      const arr = groups.get(k) ?? []
      arr.push(e)
      groups.set(k, arr)
    }
    return Array.from(groups.entries())
  }, [projects])

  if (grouped.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-10 text-center text-muted-foreground text-sm">
        Nessun task completato ancora.
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pt-4 pb-24">
      {grouped.map(([key, items]) => (
        <section key={key} className="flex flex-col gap-1">
          <h2 className="sticky top-12 z-10 bg-background py-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {formatDayLabel(key)}
          </h2>
          <ul className="flex flex-col">
            {items.map(({ task, project }) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggleTaskDone(project.id, task.id)}
                  aria-label="Riapri task"
                  className="group flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="w-12 shrink-0 text-right font-mono text-muted-foreground text-xs tabular-nums">
                    {formatTime(task.completedAt ?? 0)}
                  </span>
                  <span className="flex-1 truncate text-muted-foreground line-through">
                    {task.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {task.tagIds.map((id) => {
                      const t = tagById.get(id)
                      if (!t) return null
                      return <TagBadge key={id} tag={t} />
                    })}
                  </span>
                  <span className="w-32 shrink-0 truncate text-muted-foreground text-xs">
                    {project.name}
                  </span>
                  <IconArrowBackUp className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
