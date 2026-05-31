import type * as React from 'react'

import { cn } from '@/lib/utils'

/** Tasto/scorciatoia: stile uniforme per i `<kbd>` sparsi nell'app. */
export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]',
        className,
      )}
      {...props}
    />
  )
}
