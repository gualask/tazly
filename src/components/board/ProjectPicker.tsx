import { IconCornerDownLeft } from '@tabler/icons-react'
import { Command as CommandPrimitive } from 'cmdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { FieldShell } from '@/components/ui/field-shell'
import { buildSuggestions, type Suggestion, suggestionKey } from '@/lib/commandSuggestions'
import { COMPOSER_ROOT_ATTR } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'
import { SuggestionContent } from './CommandSuggestionItem'

interface ProjectPickerProps {
  onSelectProject: (id: ProjectId) => void
  /** Elemento opzionale prima dell'input (es. bottone reset). */
  leading?: React.ReactNode
  /** Esc sull'input vuoto: app = no-op; widget = chiudi overlay. */
  onEscapeAtRoot?: () => void
  /** ArrowDown senza suggerimenti: app overview = seleziona prima card. */
  onArrowDownExit?: () => void
  autoFocus?: boolean
}

/**
 * Step "scegli o crea progetto": l'input filtra i progetti e propone la creazione di
 * uno nuovo. Estratto da TaskComposer per riuso nel widget (task e promemoria).
 */
export function ProjectPicker({
  onSelectProject,
  leading,
  onEscapeAtRoot,
  onArrowDownExit,
  autoFocus = true,
}: ProjectPickerProps) {
  const projects = useBoardStore((s) => s.board.projects)
  const addProject = useBoardStore((s) => s.addProject)
  const isProjectNameTaken = useBoardStore((s) => s.isProjectNameTaken)

  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions: Suggestion[] = useMemo(
    () => buildSuggestions({ draft, projects }),
    [draft, projects],
  )
  const showSuggestions = isFocused && draft.trim().length > 0

  useEffect(() => {
    if (!autoFocus) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [autoFocus])

  const applyProjectSuggestion = useCallback(
    (s: Suggestion) => {
      if (s.kind === 'project') {
        onSelectProject(s.id as ProjectId)
        setDraft('')
        return
      }
      if (isProjectNameTaken(s.name)) {
        setError('progetto già esistente')
        return
      }
      const id = addProject(s.name)
      if (id) {
        onSelectProject(id)
        setDraft('')
      }
    },
    [addProject, isProjectNameTaken, onSelectProject],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && !e.shiftKey && suggestions.length > 0) {
      e.preventDefault()
      applyProjectSuggestion(suggestions[0])
      return
    }
    if (e.key === 'ArrowDown' && !showSuggestions && onArrowDownExit) {
      e.preventDefault()
      inputRef.current?.blur()
      onArrowDownExit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (draft) {
        setDraft('')
        return
      }
      onEscapeAtRoot?.()
    }
  }

  return (
    <div {...{ [COMPOSER_ROOT_ATTR]: '' }}>
      <Command shouldFilter={false} loop className="relative overflow-visible bg-transparent">
        <FieldShell className="py-1">
          {leading}
          <CommandPrimitive.Input
            ref={inputRef}
            value={draft}
            onValueChange={(v) => {
              setDraft(v)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            placeholder={
              projects.length === 0
                ? 'Crea il primo progetto…'
                : 'Vai a un progetto, o creane uno nuovo…'
            }
            className="h-7 min-w-48 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Progetto"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <span className="text-destructive text-xs">{error}</span>}
        </FieldShell>

        {showSuggestions && (
          <div className="popover-surface absolute top-full left-0 z-30 w-full overflow-hidden border-x border-b border-border shadow-md">
            <CommandList className="max-h-72">
              <CommandEmpty className="px-4 py-2 text-left text-muted-foreground text-xs">
                Nessun progetto corrisponde
              </CommandEmpty>
              {suggestions.map((s) => (
                <CommandItem
                  key={suggestionKey(s)}
                  value={suggestionKey(s)}
                  onSelect={() => applyProjectSuggestion(s)}
                  className="group/item gap-2 rounded-none px-4 py-1.5"
                >
                  <SuggestionContent suggestion={s} />
                  <IconCornerDownLeft className="ml-auto size-3 opacity-0 group-data-[selected=true]/item:opacity-100" />
                </CommandItem>
              ))}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
