import { TAG_COLOR_CLASSES } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/domain'

interface TagBadgeProps {
  tag: Tag
  className?: string
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const c = TAG_COLOR_CLASSES[tag.color]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0 text-xs font-medium leading-5',
        c.bg,
        c.fg,
        c.border,
        className,
      )}
    >
      {tag.name}
    </span>
  )
}
