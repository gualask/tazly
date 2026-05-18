import { Badge } from '@/components/ui/badge'
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
    <Badge
      variant="outline"
      className={cn('rounded-md border px-1.5 py-0 leading-5', c.bg, c.fg, c.border, className)}
    >
      {tag.name}
    </Badge>
  )
}
