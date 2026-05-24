import { useEffect, useMemo, useRef, useState } from 'react'

import { focusCommandBar } from '@/lib/focus'
import { tryArrowRightToNotepad } from '@/lib/keyboard'
import { parseRapidInput } from '@/lib/quickAddParse'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, Project, Tag, TagId } from '@/types/domain'

export type QuickAddStep = 'category' | 'title' | 'tags'

export interface CategorySuggestion {
  kind: 'existing' | 'create'
  id?: CategoryId
  name: string
}

interface UseQuickAddArgs {
  project: Project
  allTags: Tag[]
  active?: boolean
  onTaskCreated?: (categoryId: CategoryId, taskId: string) => void
}

export function useQuickAdd({ project, allTags, active, onTaskCreated }: UseQuickAddArgs) {
  const addCategory = useBoardStore((s) => s.addCategory)
  const addTask = useBoardStore((s) => s.addTask)
  const projectsLatest = useBoardStore((s) => s.board.projects)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [step, setStep] = useState<QuickAddStep>('category')
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
    return allTags
      .filter((t) => !selectedTagIds.includes(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
  }, [tagDraft, allTags, selectedTagIds])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight whenever step/input changes
  useEffect(() => {
    setActiveIdx(0)
  }, [step, categoryDraft, tagDraft])

  const prevStepRef = useRef<QuickAddStep | null>(null)
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
    const parsed = parseRapidInput(input, { categories: sortedCategories, tags: allTags })
    if (!parsed) return false

    let catId =
      sortedCategories.find((c) => c.name.toLowerCase() === parsed.categoryName.toLowerCase())
        ?.id ?? null
    if (!catId) {
      catId = addCategory(project.id, parsed.categoryName)
    }
    if (!catId) return false

    const newTaskId = addTask(project.id, {
      title: parsed.title,
      categoryId: catId,
      tagIds: parsed.tagIds,
    })
    if (newTaskId) onTaskCreated?.(catId, newTaskId)
    setLockedCategoryId(catId)
    setLockedCategoryName(parsed.categoryName)
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

  const canSubmit = lockedCategoryId !== null && lockedTitle !== null && selectedTagIds.length > 0

  return {
    step,
    categoryDraft,
    setCategoryDraft,
    lockedCategoryName,
    titleDraft,
    setTitleDraft,
    lockedTitle,
    tagDraft,
    setTagDraft,
    selectedTagIds,
    setSelectedTagIds,
    activeIdx,
    setActiveIdx,
    categoryRef,
    titleRef,
    tagRef,
    sortedCategories,
    categorySuggestions,
    tagSuggestions,
    canSubmit,
    handleCategoryKey,
    handleTitleKey,
    handleTagKey,
    confirmCategorySuggestion,
    addTagById,
    submitTask,
    setLockedCategoryId,
    setLockedCategoryName,
    setLockedTitle,
    setStep,
  }
}
