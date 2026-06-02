import { IconFilter, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { FILTER_BAR_ROOT_ATTR } from '@/lib/focus'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'

interface FilterBarProps {
  /** Esc sulla barra: chiude la barra e riporta il focus alla navbar (filtri intatti). */
  onClose: () => void
}

/**
 * Barra filtri a scomparsa sotto la navbar. Filtra per tag la vista corrente
 * (progetto in focus → quel progetto; overview → tutti i progetti). I chip sono
 * cliccabili e navigabili da tastiera: ⌥F porta il focus sul primo badge, ←/→
 * scorrono (roving-tabindex), Spazio/Invio attivano il filtro, Backspace azzera tutti
 * i filtri, Esc chiude la barra (i filtri restano applicati: lo stato è indipendente
 * dalla visibilità).
 */
export function FilterBar({ onClose }: FilterBarProps) {
  const tags = useBoardStore((s) => s.board.tags)
  const filterTagIds = useBoardStore((s) => s.filterTagIds)
  const toggleFilterTag = useBoardStore((s) => s.toggleFilterTag)
  const clearFilters = useBoardStore((s) => s.clearFilters)

  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags])

  const [focusIndex, setFocusIndex] = useState(0)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

  // Espone l'altezza reale della barra come --filters-h, così la modalità focus può
  // sottrarla all'altezza viewport ed evitare lo scroll del documento. Reagisce anche
  // al wrap dei badge (altezza variabile). Azzera la variabile in smontaggio.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () =>
      document.documentElement.style.setProperty('--filters-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.setProperty('--filters-h', '0px')
    }
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    // Tasti gestiti dalla barra: stopPropagation per isolarli dai listener window
    // di useBoardKeyboard (←/→ card progetto, Spazio = completa task).
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      const next =
        e.key === 'ArrowRight'
          ? Math.min(focusIndex + 1, sortedTags.length - 1)
          : Math.max(focusIndex - 1, 0)
      setFocusIndex(next)
      btnRefs.current[next]?.focus()
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const tag = sortedTags[focusIndex]
      if (tag) toggleFilterTag(tag.id)
    } else if (e.key === 'Backspace') {
      // azzera tutti i filtri restando nella barra
      e.preventDefault()
      e.stopPropagation()
      clearFilters()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  return (
    <div
      ref={rootRef}
      className="glass-bar border-border border-b"
      {...{ [FILTER_BAR_ROOT_ATTR]: '' }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2">
        <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <IconFilter className="size-3.5" />
          Filtri
          {filterTagIds.length > 0 && (
            <>
              <span className="text-foreground">· {filterTagIds.length}</span>
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Azzera tutti i filtri"
                title="Azzera tutti i filtri"
                className="inline-flex size-4 items-center justify-center rounded hover:bg-muted hover:text-foreground"
              >
                <IconX className="size-3" />
              </button>
            </>
          )}
        </span>

        {tags.length === 0 ? (
          <span className="text-muted-foreground text-xs">Nessun tag definito.</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {sortedTags.map((t, i) => {
              const active = filterTagIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    btnRefs.current[i] = el
                  }}
                  type="button"
                  tabIndex={i === focusIndex ? 0 : -1}
                  onFocus={() => setFocusIndex(i)}
                  onKeyDown={handleKeyDown}
                  onClick={() => toggleFilterTag(t.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md transition-opacity',
                    active ? 'opacity-100 ring-1 ring-ring' : 'opacity-45 hover:opacity-90',
                  )}
                >
                  <TagBadge tag={t} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
