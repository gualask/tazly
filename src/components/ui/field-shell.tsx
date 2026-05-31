import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Guscio condiviso per i campi compositi (ricerca della command bar, quick-add).
 * Centralizza il look "campo" — superficie, bordo, raggio e stato di focus — così
 * i diversi input dell'app restano coerenti da un'unica fonte di verità.
 */
export function FieldShell({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-input px-2 py-1.5 transition-colors focus-within:border-ring',
        className,
      )}
      {...props}
    />
  )
}
