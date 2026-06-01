import { IconChevronRight, IconCornerDownLeft, IconHome, IconX } from '@tabler/icons-react'
import { Command as CommandPrimitive } from 'cmdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { FieldShell } from '@/components/ui/field-shell'
import { Pill } from '@/components/ui/pill'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildSuggestions, type Suggestion, suggestionKey } from '@/lib/commandSuggestions'
import { COMPOSER_ROOT_ATTR } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, ProjectId } from '@/types/domain'
import { SuggestionContent } from './CommandSuggestionItem'
import { QuickAddBar } from './QuickAddBar'

interface TaskComposerProps {
  /** Progetto selezionato (controlled): app = focusProjectId; widget = stato locale. */
  selectedProjectId: ProjectId | null
  onSelectProject: (id: ProjectId | null) => void
  /** Categoria pre-bloccata al mount (memoria lastQuickAdd nel widget). */
  initialCategory?: { id: CategoryId; name: string } | null
  onTaskCreated?: (projectId: ProjectId, categoryId: CategoryId, taskId: string) => void
  /** Esc sull'input progetto vuoto: app = no-op; widget = chiudi overlay. */
  onEscapeAtProjectRoot?: () => void
  /** ArrowDown sullo step progetto senza suggerimenti: app overview = seleziona prima card. */
  onArrowDownExit?: () => void
  /** Mostra il bottone Home/reset (solo app). */
  showResetButton?: boolean
  onReset?: () => void
  autoFocus?: boolean
}

export function TaskComposer({
  selectedProjectId,
  onSelectProject,
  initialCategory,
  onTaskCreated,
  onEscapeAtProjectRoot,
  onArrowDownExit,
  showResetButton,
  onReset,
  autoFocus = true,
}: TaskComposerProps) {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const addProject = useBoardStore((s) => s.addProject)
  const isProjectNameTaken = useBoardStore((s) => s.isProjectNameTaken)

  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedProject = useMemo(
    () => (selectedProjectId ? (projects.find((p) => p.id === selectedProjectId) ?? null) : null),
    [selectedProjectId, projects],
  )

  const suggestions: Suggestion[] = useMemo(
    () => buildSuggestions({ draft, projects }),
    [draft, projects],
  )
  const showSuggestions = isFocused && draft.trim().length > 0

  // Focus: input progetto, oppure primo campo della quick-add quando un progetto è selezionato.
  useEffect(() => {
    if (!autoFocus) return
    const id = requestAnimationFrame(() => {
      if (selectedProjectId) rootRef.current?.querySelector('input')?.focus()
      else inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [selectedProjectId, autoFocus])

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

  function handleProjectKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
      onEscapeAtProjectRoot?.()
    }
  }

  const resetButton = showResetButton && (
    <button
      type="button"
      onClick={onReset}
      aria-label="Reset vista"
      className="-ml-0.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <IconHome className="size-4" />
    </button>
  )

  if (selectedProject) {
    const leading = (
      <>
        {resetButton}
        <Pill>
          {selectedProject.name}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelectProject(null)}
                className="opacity-50 hover:opacity-100"
                aria-label="Cambia progetto"
              >
                <IconX className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cambia progetto</TooltipContent>
          </Tooltip>
        </Pill>
        <IconChevronRight className="size-3 text-muted-foreground" />
      </>
    )

    return (
      <div ref={rootRef} {...{ [COMPOSER_ROOT_ATTR]: '' }}>
        <QuickAddBar
          key={selectedProject.id}
          project={selectedProject}
          allTags={tags}
          active
          initialCategory={initialCategory}
          leading={leading}
          onExitTop={() => onSelectProject(null)}
          onTaskCreated={(categoryId, taskId) =>
            onTaskCreated?.(selectedProject.id, categoryId, taskId)
          }
        />
      </div>
    )
  }

  return (
    <div ref={rootRef} {...{ [COMPOSER_ROOT_ATTR]: '' }}>
      <Command shouldFilter={false} loop className="relative overflow-visible bg-transparent">
        <FieldShell className="py-1">
          {resetButton}
          <CommandPrimitive.Input
            ref={inputRef}
            value={draft}
            onValueChange={(v) => {
              setDraft(v)
              setError(null)
            }}
            onKeyDown={handleProjectKeyDown}
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
