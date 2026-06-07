import { useMemo } from 'react'

import { sanitizeHtml } from '@/lib/html'
import { cn } from '@/lib/utils'

interface SafeHtmlProps {
  html: string
  className?: string
}

/**
 * Renderizza HTML catturato da pagine esterne, ri-sanitizzato a ogni render
 * (difesa in profondità: i dati vivono in localStorage). Le classi `tazly-prose`
 * danno la formattazione di base ai tag semantici (vedi index.css).
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(() => sanitizeHtml(html), [html])
  return (
    <div
      className={cn('tazly-prose', className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: contenuto già sanitizzato da DOMPurify
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
