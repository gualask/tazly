import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Chip contestuale "secondary" (es. progetto in focus, voce nella quick-add).
 * Centralizza il look condiviso; il comportamento lo mette il chiamante nei figli.
 */
export function Pill({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs',
        className,
      )}
      {...props}
    />
  )
}
