import { IconArrowsMaximize, IconLayoutGrid } from '@tabler/icons-react'

import { IconButton } from '@/components/common/IconButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Project, ProjectId } from '@/types/domain'

interface ProjectSidebarProps {
  projects: Project[]
  focusedId: ProjectId
  onFocus: (id: ProjectId) => void
  onExitFocus: () => void
}

export function ProjectSidebar({ projects, focusedId, onFocus, onExitFocus }: ProjectSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r bg-muted/20 p-3">
      <Button size="sm" variant="ghost" className="justify-start" onClick={onExitFocus}>
        <IconLayoutGrid />
        Tutti i progetti
      </Button>
      <div className="my-2 h-px bg-border" />
      {projects.map((p) => {
        const openCount = p.tasks.filter((t) => !t.done).length
        const isActive = p.id === focusedId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onFocus(p.id)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition',
              isActive ? 'bg-accent font-medium' : 'hover:bg-accent/50',
            )}
          >
            <span className="truncate">{p.name}</span>
            <span className="shrink-0 text-muted-foreground text-xs">{openCount}</span>
          </button>
        )
      })}
    </aside>
  )
}

interface FocusButtonProps {
  onClick: () => void
}

export function FocusButton({ onClick }: FocusButtonProps) {
  return (
    <IconButton onClick={onClick} tooltip="Modalità focus">
      <IconArrowsMaximize />
    </IconButton>
  )
}
