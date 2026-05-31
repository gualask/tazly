import { IconChevronsLeft, IconChevronsRight, IconNotes } from '@tabler/icons-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NotepadTabProps {
  expanded?: boolean
  onToggle: () => void
}

export function NotepadTab({ expanded, onToggle }: NotepadTabProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'glass flex h-[60vh] w-7 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground lg:h-full',
            expanded && 'bg-accent/50 text-foreground',
          )}
        >
          <IconNotes className="size-4" />
          {expanded ? (
            <IconChevronsRight className="size-3.5" />
          ) : (
            <IconChevronsLeft className="size-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{expanded ? 'Chiudi note' : 'Apri note'}</TooltipContent>
    </Tooltip>
  )
}
