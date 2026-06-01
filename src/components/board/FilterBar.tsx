import { IconFilter, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'

/**
 * Barra filtri a scomparsa sotto la navbar. Filtra per tag la vista corrente
 * (progetto in focus → quel progetto; overview → tutti i progetti). I chip sono
 * cliccabili per attivare/disattivare il filtro; il campo cerca restringe l'elenco.
 */
export function FilterBar() {
  const tags = useBoardStore((s) => s.board.tags)
  const projects = useBoardStore((s) => s.board.projects)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const filterTagIds = useBoardStore((s) => s.filterTagIds)
  const toggleFilterTag = useBoardStore((s) => s.toggleFilterTag)
  const clearFilters = useBoardStore((s) => s.clearFilters)

  const [query, setQuery] = useState('')

  const scopeLabel = useMemo(() => {
    const p = focusProjectId ? projects.find((x) => x.id === focusProjectId) : null
    return p ? p.name : 'tutti i progetti'
  }, [focusProjectId, projects])

  const visibleTags = useMemo(() => {
    const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name))
    const q = query.trim().toLowerCase()
    return q ? sorted.filter((t) => t.name.toLowerCase().includes(q)) : sorted
  }, [tags, query])

  return (
    <div className="glass-bar border-border border-b">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2">
        <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <IconFilter className="size-3.5" />
          Filtri · {scopeLabel}
        </span>

        {tags.length === 0 ? (
          <span className="text-muted-foreground text-xs">Nessun tag definito.</span>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) {
                  e.preventDefault()
                  e.stopPropagation()
                  setQuery('')
                }
              }}
              placeholder="cerca tag…"
              className="h-7 w-32 rounded-md border border-border bg-input px-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/50"
              aria-label="Cerca tag"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((t) => {
                const active = filterTagIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
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

            {filterTagIds.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex shrink-0 items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
              >
                <IconX className="size-3" />
                pulisci
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
