import { IconFilterOff } from '@tabler/icons-react'

import { TagBadge } from '@/components/tags/TagBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tag, TagId } from '@/types/domain'

export type StatusFilter = 'all' | 'open' | 'done'

interface FilterBarProps {
  tags: Tag[]
  selectedTagIds: TagId[]
  onToggleTag: (id: TagId) => void
  status: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  onClear: () => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'open', label: 'Aperti' },
  { value: 'done', label: 'Fatti' },
]

export function FilterBar({
  tags,
  selectedTagIds,
  onToggleTag,
  status,
  onStatusChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = selectedTagIds.length > 0 || status !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            type="button"
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              'rounded px-2 py-0.5 text-xs transition',
              status === s.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => {
              const selected = selectedTagIds.includes(t.id)
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => onToggleTag(t.id)}
                  className={cn('transition', !selected && 'opacity-40 hover:opacity-100')}
                >
                  <TagBadge tag={t} />
                </button>
              )
            })}
          </div>
        </>
      )}
      {hasFilters && (
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
          <IconFilterOff /> Reset
        </Button>
      )}
    </div>
  )
}
