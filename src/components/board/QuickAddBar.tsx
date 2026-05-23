import { IconChevronRight, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { COMMAND_BAR_INPUT_ID } from '@/components/board/CommandBar'
import { TagBadge } from '@/components/tags/TagBadge'
import { tryArrowRightToNotepad } from '@/lib/keyboard'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { Category, CategoryId, Project, Tag, TagId } from '@/types/domain'

function focusCommandBar() {
  const el = document.getElementById(COMMAND_BAR_INPUT_ID) as HTMLInputElement | null
  el?.focus()
}

type Step = 'category' | 'title' | 'tags'

interface QuickAddBarProps {
  project: Project
  allTags: Tag[]
  active?: boolean
  onTaskCreated?: (categoryId: CategoryId, taskId: string) => void
}

interface CategorySuggestion {
  kind: 'existing' | 'create'
  id?: CategoryId
  name: string
}

const RAPID_REGEX = /^([^:]+):\s*(.+?)(?:\s+(#\S+(?:\s+#\S+)*))?$/

export function QuickAddBar({ project, allTags, active, onTaskCreated }: QuickAddBarProps) {
  const addCategory = useBoardStore((s) => s.addCategory)
  const addTask = useBoardStore((s) => s.addTask)
  const projectsLatest = useBoardStore((s) => s.board.projects)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [step, setStep] = useState<Step>('category')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [lockedCategoryId, setLockedCategoryId] = useState<CategoryId | null>(null)
  const [lockedCategoryName, setLockedCategoryName] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [lockedTitle, setLockedTitle] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<TagId[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  const categoryRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const tagRef = useRef<HTMLInputElement>(null)

  const sortedCategories = useMemo(
    () => [...project.categories].sort((a, b) => a.order - b.order),
    [project.categories],
  )

  const activeTags = allTags

  const categorySuggestions: CategorySuggestion[] = useMemo(() => {
    const q = categoryDraft.trim().toLowerCase()
    const matches = sortedCategories.filter((c) => c.name.toLowerCase().includes(q))
    const list: CategorySuggestion[] = matches.map((c) => ({
      kind: 'existing',
      id: c.id,
      name: c.name,
    }))
    if (q.length > 0 && !sortedCategories.some((c) => c.name.toLowerCase() === q)) {
      list.push({ kind: 'create', name: categoryDraft.trim() })
    }
    return list
  }, [categoryDraft, sortedCategories])

  const tagSuggestions = useMemo(() => {
    const q = tagDraft.trim().toLowerCase().replace(/^#/, '')
    return activeTags
      .filter((t) => !selectedTagIds.includes(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
  }, [tagDraft, activeTags, selectedTagIds])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight whenever step/input changes
  useEffect(() => {
    setActiveIdx(0)
  }, [step, categoryDraft, tagDraft])

  const prevStepRef = useRef<Step | null>(null)
  useEffect(() => {
    if (!active) {
      prevStepRef.current = null
      return
    }
    const stepChanged = prevStepRef.current !== null && prevStepRef.current !== step
    prevStepRef.current = step
    if (!stepChanged) return
    if (step === 'category') categoryRef.current?.focus()
    if (step === 'title') titleRef.current?.focus()
    if (step === 'tags') tagRef.current?.focus()
  }, [step, active])

  function reset(keepCategory: boolean) {
    if (!keepCategory) {
      setLockedCategoryId(null)
      setLockedCategoryName(null)
      setCategoryDraft('')
      setStep('category')
    } else {
      setStep('title')
    }
    setTitleDraft('')
    setLockedTitle(null)
    setTagDraft('')
    setSelectedTagIds([])
  }

  function tryRapidParse(input: string): boolean {
    const m = RAPID_REGEX.exec(input.trim())
    if (!m) return false
    const [, catRaw, titleRaw, tagsRaw] = m
    const catName = catRaw.trim()
    const title = titleRaw.trim()
    if (!catName || !title) return false

    const tagNames = (tagsRaw ?? '')
      .split(/\s+/)
      .map((s) => s.replace(/^#/, '').trim())
      .filter(Boolean)

    const resolvedTags: TagId[] = []
    for (const name of tagNames) {
      const t = activeTags.find((x) => x.name.toLowerCase() === name.toLowerCase())
      if (t) resolvedTags.push(t.id)
    }
    if (resolvedTags.length === 0) return false

    let catId =
      sortedCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase())?.id ?? null
    if (!catId) {
      catId = addCategory(project.id, catName)
    }
    if (!catId) return false

    const newTaskId = addTask(project.id, { title, categoryId: catId, tagIds: resolvedTags })
    if (newTaskId) onTaskCreated?.(catId, newTaskId)
    setLockedCategoryId(catId)
    setLockedCategoryName(catName)
    reset(true)
    return true
  }

  function confirmCategorySuggestion(s: CategorySuggestion) {
    if (s.kind === 'create') {
      const id = addCategory(project.id, s.name)
      if (!id) return
      setLockedCategoryId(id)
      setLockedCategoryName(s.name)
    } else if (s.id) {
      setLockedCategoryId(s.id)
      setLockedCategoryName(s.name)
    }
    setCategoryDraft('')
    setStep('title')
  }

  function handleCategoryKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      focusCommandBar()
      return
    }
    const dropdownOpen = categorySuggestions.length > 0 && categoryDraft.length > 0
    if (e.key === 'ArrowUp' && !dropdownOpen) {
      e.preventDefault()
      focusCommandBar()
      return
    }
    if (e.key === 'ArrowDown' && !dropdownOpen) {
      if (sortedCategories.length > 0) {
        e.preventDefault()
        e.currentTarget.blur()
        setSelectedCategoryId(sortedCategories[0].id)
      }
      return
    }
    if (tryArrowRightToNotepad(e, e.currentTarget, requestOpenNotepad)) return
    if (e.key === 'Tab' || e.key === 'Enter') {
      if (e.key === 'Enter' && categoryDraft.includes(':')) {
        if (tryRapidParse(categoryDraft)) {
          e.preventDefault()
          return
        }
      }
      if (categorySuggestions.length === 0) return
      e.preventDefault()
      confirmCategorySuggestion(categorySuggestions[activeIdx] ?? categorySuggestions[0])
    } else if (e.key === 'ArrowDown') {
      if (categorySuggestions.length === 0 || !categoryDraft) return
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, categorySuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      if (categorySuggestions.length === 0 || !categoryDraft) return
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (!categoryDraft) {
        focusCommandBar()
        return
      }
      reset(false)
    }
  }

  function handleTitleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusCommandBar()
      return
    }
    if (tryArrowRightToNotepad(e, e.currentTarget, requestOpenNotepad)) return
    if (e.key === 'Tab' && !e.shiftKey) {
      if (!titleDraft.trim()) return
      e.preventDefault()
      setLockedTitle(titleDraft.trim())
      setStep('tags')
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      setCategoryDraft(lockedCategoryName ?? '')
      setLockedCategoryId(null)
      setLockedCategoryName(null)
      setStep('category')
    } else if (e.key === 'Backspace' && !titleDraft) {
      e.preventDefault()
      setCategoryDraft('')
      setLockedCategoryId(null)
      setLockedCategoryName(null)
      setStep('category')
    } else if (e.key === 'Enter') {
      if (!titleDraft.trim()) return
      e.preventDefault()
      setLockedTitle(titleDraft.trim())
      setStep('tags')
    } else if (e.key === 'Escape') {
      reset(false)
    }
  }

  function addTagById(id: TagId) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setTagDraft('')
  }

  function submitTask() {
    if (!lockedCategoryId || !lockedTitle || selectedTagIds.length === 0) return
    const taskId = addTask(project.id, {
      title: lockedTitle,
      categoryId: lockedCategoryId,
      tagIds: selectedTagIds,
    })
    if (taskId) onTaskCreated?.(lockedCategoryId, taskId)
    reset(true)
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const tagDropdownOpen = tagSuggestions.length > 0
    if (e.key === 'ArrowUp' && !tagDropdownOpen) {
      e.preventDefault()
      focusCommandBar()
      return
    }
    if (e.key === 'ArrowRight') {
      const el = e.currentTarget
      const atEnd =
        (el.selectionStart ?? 0) === el.value.length && (el.selectionEnd ?? 0) === el.value.length
      if (atEnd) {
        e.preventDefault()
        el.blur()
        requestOpenNotepad()
        return
      }
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      addTagById(tagSuggestions[activeIdx]?.id ?? tagSuggestions[0].id)
    } else if (
      (e.key === 'Tab' && e.shiftKey) ||
      (e.key === 'Backspace' && !tagDraft && selectedTagIds.length === 0)
    ) {
      e.preventDefault()
      setTitleDraft(lockedTitle ?? '')
      setLockedTitle(null)
      setStep('title')
    } else if (e.key === 'Backspace' && !tagDraft && selectedTagIds.length > 0) {
      e.preventDefault()
      setSelectedTagIds((prev) => prev.slice(0, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (tagDraft.trim() && tagSuggestions.length > 0) {
        addTagById(tagSuggestions[activeIdx]?.id ?? tagSuggestions[0].id)
      } else if (selectedTagIds.length > 0 && lockedCategoryId && lockedTitle) {
        submitTask()
      }
    } else if (e.key === 'ArrowDown') {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, tagSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      reset(false)
    }
  }

  // re-check that locked category still exists (it could have been deleted)
  useEffect(() => {
    if (!lockedCategoryId) return
    const currentProject = projectsLatest.find((p) => p.id === project.id)
    const stillThere = currentProject?.categories.some((c) => c.id === lockedCategoryId)
    if (!stillThere) {
      setLockedCategoryId(null)
      setLockedCategoryName(null)
      setStep('category')
    }
  }, [projectsLatest, project.id, lockedCategoryId])

  const tagById = new Map(allTags.map((t) => [t.id, t]))
  const canSubmit = lockedCategoryId !== null && lockedTitle !== null && selectedTagIds.length > 0

  return (
    <div className="relative">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 transition',
          'focus-within:ring-1 focus-within:ring-ring',
        )}
      >
        {/* Category */}
        {lockedCategoryName ? (
          <BadgeChip
            label={lockedCategoryName}
            onClear={() => {
              setLockedCategoryId(null)
              setLockedCategoryName(null)
              setCategoryDraft(lockedCategoryName)
              setLockedTitle(null)
              setTitleDraft(lockedTitle ?? '')
              setSelectedTagIds([])
              setStep('category')
            }}
          />
        ) : (
          <input
            ref={categoryRef}
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            onKeyDown={handleCategoryKey}
            placeholder="Categoria…"
            className="h-7 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}

        {lockedCategoryName && <IconChevronRight className="size-3 text-muted-foreground" />}

        {/* Title */}
        {lockedCategoryName &&
          (lockedTitle ? (
            <BadgeChip
              label={lockedTitle}
              onClear={() => {
                setLockedTitle(null)
                setTitleDraft(lockedTitle)
                setStep('title')
              }}
            />
          ) : step !== 'category' ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={handleTitleKey}
              placeholder="Testo del task…"
              className="h-7 min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          ) : null)}

        {lockedTitle && <IconChevronRight className="size-3 text-muted-foreground" />}

        {/* Tags */}
        {lockedTitle && (
          <>
            {selectedTagIds.map((id) => {
              const t = tagById.get(id)
              if (!t) return null
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSelectedTagIds((prev) => prev.filter((x) => x !== id))}
                  className="group/tag"
                  aria-label="Rimuovi tag"
                >
                  <TagBadge tag={t} className="pr-1 group-hover/tag:opacity-70" />
                </button>
              )
            })}
            {step === 'tags' && (
              <input
                ref={tagRef}
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={handleTagKey}
                placeholder={selectedTagIds.length === 0 ? 'Tag…' : '+ tag'}
                className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            )}
          </>
        )}

        {canSubmit && (
          <button
            type="button"
            onClick={submitTask}
            className="ml-auto rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs"
          >
            Invio ↵
          </button>
        )}
      </div>

      {step === 'category' && categorySuggestions.length > 0 && categoryDraft && (
        <Dropdown>
          {categorySuggestions.map((s, i) => (
            <DropdownItem
              key={`${s.kind}:${s.id ?? s.name}`}
              active={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => confirmCategorySuggestion(s)}
            >
              {s.kind === 'create' ? (
                <span>
                  <span className="text-muted-foreground">Crea categoria </span>
                  <span className="font-medium">"{s.name}"</span>
                </span>
              ) : (
                <span>{s.name}</span>
              )}
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {step === 'tags' && tagSuggestions.length > 0 && (
        <Dropdown>
          {tagSuggestions.map((t, i) => (
            <DropdownItem
              key={t.id}
              active={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => addTagById(t.id)}
            >
              <TagBadge tag={t} />
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {step === 'category' && !categoryDraft && sortedCategories.length === 0 && (
        <p className="mt-1 text-muted-foreground text-xs">
          Inizia a digitare per creare la prima categoria. Suggerimento: scrivi{' '}
          <code className="rounded bg-muted px-1">Cat: testo #tag</code> per la sintassi rapida.
        </p>
      )}
      {step === 'tags' && activeTags.length === 0 && (
        <p className="mt-1 text-muted-foreground text-xs">
          Nessun tag disponibile. Definiscine prima qualcuno in Gestione tag.
        </p>
      )}
    </div>
  )
}

function BadgeChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="opacity-50 hover:opacity-100"
        aria-label="Modifica"
      >
        <IconX className="size-3" />
      </button>
    </span>
  )
}

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
      {children}
    </div>
  )
}

function DropdownItem({
  active,
  onClick,
  onMouseEnter,
  children,
}: {
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </button>
  )
}

// Avoid unused-warning when type-only references remain
export type { Category }
