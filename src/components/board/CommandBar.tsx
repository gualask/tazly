import { IconArrowRight, IconCornerDownLeft, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { Category, CategoryId, Project, Tag, TagId } from '@/types/domain'

type Suggestion =
  | { kind: 'project'; id: string; name: string; openCount: number }
  | { kind: 'create-project'; name: string }
  | { kind: 'tag'; tag: Tag }
  | { kind: 'category'; category: Category }

export const COMMAND_BAR_INPUT_ID = 'tazly-command-bar-input'

function focusActiveQuickAdd() {
  requestAnimationFrame(() => {
    const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
    const input = root?.querySelector<HTMLInputElement>('input')
    input?.focus()
  })
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

  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const focusProject = useMemo(
    () => (focusProjectId ? (projects.find((p) => p.id === focusProjectId) ?? null) : null),
    [focusProjectId, projects],
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setDraft('')
    setActiveIdx(0)
    setError(null)
  }, [focusProjectId])

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

  useEffect(() => {
    setActiveIdx((idx) => (idx >= suggestions.length ? 0 : idx))
  }, [suggestions])

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
    const hasDropdown = isFocused && draft.trim().length > 0 && suggestions.length > 0
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (hasDropdown) {
        e.preventDefault()
        if (e.key === 'ArrowDown') {
          setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
        } else {
          setActiveIdx((i) => Math.max(i - 1, 0))
        }
        return
      }
      if (e.key === 'ArrowDown' && focusProject) {
        e.preventDefault()
        focusActiveQuickAdd()
        return
      }
      return
    }
    if (e.key === 'Enter') {
      if (suggestions.length === 0) return
      e.preventDefault()
      applySuggestion(suggestions[activeIdx] ?? suggestions[0])
      return
    }
    if (e.key === 'Tab' && !e.shiftKey && focusProject) {
      e.preventDefault()
      focusActiveQuickAdd()
      return
    }
    if (e.key === 'ArrowRight' && focusProject) {
      const el = inputRef.current
      const atEnd =
        (el?.selectionStart ?? draft.length) === draft.length &&
        (el?.selectionEnd ?? draft.length) === draft.length
      if (atEnd) {
        e.preventDefault()
        el?.blur()
        requestOpenNotepad()
      }
      return
    }
    if (
      e.key === 'Backspace' &&
      !draft &&
      focusProject &&
      (activeFilters.tagIds.length > 0 || activeFilters.categoryIds.length > 0)
    ) {
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

  const showSuggestions = isFocused && draft.trim().length > 0

  return (
    <div className="relative">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border border-transparent bg-background px-2 py-1',
          'focus-within:border-border focus-within:bg-muted/40',
        )}
      >
        <span className="select-none font-mono text-base text-muted-foreground">›</span>

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
                title="Rimuovi filtro"
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
                title="Rimuovi filtro"
              >
                <span className="text-muted-foreground">›</span>
                {c.name}
              </button>
            )
          })}

        <input
          ref={inputRef}
          id={COMMAND_BAR_INPUT_ID}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
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

      {showSuggestions && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute z-30 mt-0 max-h-72 w-full overflow-auto border-x border-b border-border bg-popover py-1 shadow-md"
        >
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={suggestionKey(s)}
              suggestion={s}
              active={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => applySuggestion(s)}
            />
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && (
        <div className="absolute z-30 w-full border-x border-b border-border bg-popover px-4 py-2 text-muted-foreground text-xs">
          {focusProject
            ? 'Nessun tag o categoria corrisponde'
            : 'Nessun progetto corrisponde'}
        </div>
      )}
    </div>
  )
}

function suggestionKey(s: Suggestion): string {
  if (s.kind === 'project') return `p:${s.id}`
  if (s.kind === 'create-project') return `cp:${s.name}`
  if (s.kind === 'tag') return `t:${s.tag.id}`
  return `c:${s.category.id}`
}

interface RowProps {
  suggestion: Suggestion
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
}

function SuggestionRow({ suggestion, active, onClick, onMouseEnter }: RowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      <SuggestionContent suggestion={suggestion} />
      {active && (
        <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground text-xs">
          <IconCornerDownLeft className="size-3" />
        </span>
      )}
    </button>
  )
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

export type { Project }
