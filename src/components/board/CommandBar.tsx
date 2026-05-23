import {
  IconArrowRight,
  IconChevronRight,
  IconCornerDownLeft,
  IconHome,
  IconX,
} from '@tabler/icons-react'
import { Command as CommandPrimitive } from 'cmdk'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isMac } from '@/lib/dom'
import { COMMAND_BAR_INPUT_ID, focusQuickAdd } from '@/lib/focus'
import { tryArrowRightToNotepad } from '@/lib/keyboard'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { Category, CategoryId, Tag } from '@/types/domain'

type Suggestion =
  | { kind: 'project'; id: string; name: string; openCount: number }
  | { kind: 'create-project'; name: string }
  | { kind: 'tag'; tag: Tag }
  | { kind: 'category'; category: Category }

function focusActiveQuickAdd() {
  requestAnimationFrame(focusQuickAdd)
}

export function CommandBar() {
  const projects = useBoardStore((s) => s.board.projects)
  const tags = useBoardStore((s) => s.board.tags)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const activeFilters = useBoardStore((s) => s.activeFilters)
  const addProject = useBoardStore((s) => s.addProject)
  const setFocusProject = useBoardStore((s) => s.setFocusProject)
  const clearFocus = useBoardStore((s) => s.clearFocus)
  const toggleFilterTag = useBoardStore((s) => s.toggleFilterTag)
  const toggleFilterCategory = useBoardStore((s) => s.toggleFilterCategory)
  const clearFilters = useBoardStore((s) => s.clearFilters)
  const isProjectNameTaken = useBoardStore((s) => s.isProjectNameTaken)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)
  const resetView = useBoardStore((s) => s.resetView)
  const viewResetTick = useBoardStore((s) => s.viewResetTick)
  const setOverviewSelectedProjectId = useBoardStore((s) => s.setOverviewSelectedProjectId)

  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const focusProject = useMemo(
    () => (focusProjectId ? (projects.find((p) => p.id === focusProjectId) ?? null) : null),
    [focusProjectId, projects],
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: focusProjectId è un trigger per resettare la bozza al cambio progetto, non un valore letto nel corpo
  useEffect(() => {
    setDraft('')
    setError(null)
    inputRef.current?.focus()
  }, [focusProjectId])

  useEffect(() => {
    if (viewResetTick === 0) return
    setDraft('')
    setError(null)
    inputRef.current?.focus()
  }, [viewResetTick])

  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])
  const categoryById = useMemo(() => {
    const m = new Map<CategoryId, Category>()
    if (focusProject) for (const c of focusProject.categories) m.set(c.id, c)
    return m
  }, [focusProject])

  const suggestions: Suggestion[] = useMemo(() => {
    const q = draft.trim().toLowerCase()

    if (!focusProject) {
      const items: Suggestion[] = projects
        .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
        .map((p) => ({
          kind: 'project',
          id: p.id,
          name: p.name,
          openCount: p.tasks.filter((t) => !t.done).length,
        }))
      if (q && !projects.some((p) => p.name.toLowerCase() === q)) {
        items.push({ kind: 'create-project', name: draft.trim() })
      }
      return items
    }

    const tagItems: Suggestion[] = tags
      .filter((t) => !activeFilters.tagIds.includes(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .map((t) => ({ kind: 'tag' as const, tag: t }))

    const catItems: Suggestion[] = focusProject.categories
      .filter((c) => !activeFilters.categoryIds.includes(c.id))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ kind: 'category' as const, category: c }))

    return [...tagItems, ...catItems]
  }, [draft, focusProject, projects, tags, activeFilters])

  const showSuggestions = isFocused && draft.trim().length > 0

  function applySuggestion(s: Suggestion) {
    if (s.kind === 'project') {
      setFocusProject(s.id)
      return
    }
    if (s.kind === 'create-project') {
      if (isProjectNameTaken(s.name)) {
        setError('progetto già esistente')
        return
      }
      const id = addProject(s.name)
      if (id) setFocusProject(id)
      return
    }
    if (s.kind === 'tag') {
      toggleFilterTag(s.tag.id)
      setDraft('')
      return
    }
    if (s.kind === 'category') {
      toggleFilterCategory(s.category.id)
      setDraft('')
      return
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && !showSuggestions) {
      if (focusProject) {
        e.preventDefault()
        focusActiveQuickAdd()
        return
      }
      if (projects.length > 0) {
        e.preventDefault()
        setOverviewSelectedProjectId(projects[0].id)
        inputRef.current?.blur()
        return
      }
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      if (focusProject) {
        e.preventDefault()
        focusActiveQuickAdd()
        return
      }
      // when no project is focused, let cmdk's Enter logic handle it — Tab fallback selects first
      if (suggestions.length > 0) {
        e.preventDefault()
        applySuggestion(suggestions[0])
        return
      }
    }
    if (e.key === 'ArrowRight' && focusProject) {
      tryArrowRightToNotepad(e, inputRef.current, requestOpenNotepad)
      return
    }
    if (e.key === 'Backspace' && !draft && focusProject) {
      if (activeFilters.tagIds.length > 0 || activeFilters.categoryIds.length > 0) {
        e.preventDefault()
        const lastTag = activeFilters.tagIds[activeFilters.tagIds.length - 1]
        if (lastTag) {
          toggleFilterTag(lastTag)
          return
        }
        const lastCat = activeFilters.categoryIds[activeFilters.categoryIds.length - 1]
        if (lastCat) toggleFilterCategory(lastCat)
        return
      }
      e.preventDefault()
      clearFocus()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (draft) {
        setDraft('')
        return
      }
      if (focusProject) {
        if (activeFilters.tagIds.length > 0 || activeFilters.categoryIds.length > 0) {
          clearFilters()
          return
        }
        clearFocus()
      }
    }
  }

  const placeholder = !focusProject
    ? projects.length === 0
      ? 'Crea il primo progetto…'
      : 'Vai a un progetto, o creane uno nuovo…'
    : 'Filtra · tag o categoria'

  return (
    <Command shouldFilter={false} loop className="relative overflow-visible bg-transparent">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border border-transparent bg-background px-2 py-1',
          'focus-within:border-border focus-within:bg-muted/40',
        )}
      >
        <button
          type="button"
          onClick={resetView}
          title={`Reset (${isMac() ? '⌘' : 'Ctrl'})`}
          aria-label="Reset vista"
          className="-ml-0.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconHome className="size-4" />
        </button>

        {focusProject && (
          <>
            <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs">
              {focusProject.name}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => clearFocus()}
                    className="opacity-50 hover:opacity-100"
                  >
                    <IconX className="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Esci dal progetto</TooltipContent>
              </Tooltip>
            </span>
            <IconChevronRight className="size-3 text-muted-foreground" />
          </>
        )}

        {focusProject &&
          activeFilters.tagIds.map((id) => {
            const t = tagById.get(id)
            if (!t) return null
            return (
              <button
                type="button"
                key={`tag-${id}`}
                onClick={() => toggleFilterTag(id)}
                className="group/chip"
                aria-label="Rimuovi filtro"
              >
                <TagBadge tag={t} className="pr-1 group-hover/chip:opacity-70" />
              </button>
            )
          })}
        {focusProject &&
          activeFilters.categoryIds.map((id) => {
            const c = categoryById.get(id)
            if (!c) return null
            return (
              <button
                type="button"
                key={`cat-${id}`}
                onClick={() => toggleFilterCategory(id)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs hover:opacity-70"
                aria-label="Rimuovi filtro"
              >
                <span className="text-muted-foreground">›</span>
                {c.name}
              </button>
            )
          })}

        <CommandPrimitive.Input
          ref={inputRef}
          id={COMMAND_BAR_INPUT_ID}
          value={draft}
          onValueChange={(v) => {
            setDraft(v)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          placeholder={placeholder}
          className="h-7 min-w-48 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Command bar"
          autoComplete="off"
          spellCheck={false}
        />

        {error && <span className="text-destructive text-xs">{error}</span>}

        {focusProject && (
          <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground text-xs">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Tab
            </kbd>
            inserisci task
          </span>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 z-30 w-full overflow-hidden border-x border-b border-border bg-popover shadow-md">
          <CommandList className="max-h-72">
            <CommandEmpty className="px-4 py-2 text-left text-muted-foreground text-xs">
              {focusProject ? 'Nessun tag o categoria corrisponde' : 'Nessun progetto corrisponde'}
            </CommandEmpty>
            {suggestions.map((s) => (
              <CommandItem
                key={suggestionKey(s)}
                value={suggestionKey(s)}
                onSelect={() => applySuggestion(s)}
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
  )
}

function suggestionKey(s: Suggestion): string {
  if (s.kind === 'project') return `p:${s.id}`
  if (s.kind === 'create-project') return `cp:${s.name}`
  if (s.kind === 'tag') return `t:${s.tag.id}`
  return `c:${s.category.id}`
}

function SuggestionContent({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.kind === 'project') {
    return (
      <>
        <IconArrowRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{suggestion.name}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {suggestion.openCount} apert{suggestion.openCount === 1 ? 'o' : 'i'}
        </span>
      </>
    )
  }
  if (suggestion.kind === 'create-project') {
    return (
      <>
        <span className="font-mono text-muted-foreground">+</span>
        <span className="text-muted-foreground">crea progetto</span>
        <span className="font-medium">"{suggestion.name}"</span>
      </>
    )
  }
  if (suggestion.kind === 'tag') {
    return (
      <>
        <span className="font-mono text-muted-foreground">#</span>
        <TagBadge tag={suggestion.tag} />
      </>
    )
  }
  return (
    <>
      <span className="font-mono text-muted-foreground">›</span>
      <span>{suggestion.category.name}</span>
    </>
  )
}
