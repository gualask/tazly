import { useEffect, useMemo, useReducer, useRef } from 'react'

import { tryArrowRightToNotepad } from '@/lib/keyboard'
import { useBoardStore } from '@/store/useBoardStore'
import type { CategoryId, Project, Tag, TagId } from '@/types/domain'
import { initialQuickAddState, quickAddReducer } from './quickAddReducer'

export type { QuickAddStep } from './quickAddReducer'

export interface CategorySuggestion {
  kind: 'existing' | 'create'
  id?: CategoryId
  name: string
}

interface UseQuickAddArgs {
  project: Project
  allTags: Tag[]
  active?: boolean
  /** Categoria pre-bloccata al mount: la quick-add parte direttamente dallo step titolo. */
  initialCategory?: { id: CategoryId; name: string } | null
  /** Titolo catturato dal picker DOM del widget: pre-popola la bozza titolo (seq cresce per ri-scattare). */
  capturedTitle?: { text: string; seq: number } | null
  /** Risalita "in cima" dallo step categoria: il composer riporta alla selezione progetto. */
  onExitTop?: () => void
  onTaskCreated?: (categoryId: CategoryId, taskId: string) => void
}

export function useQuickAdd({
  project,
  allTags,
  active,
  initialCategory,
  capturedTitle,
  onExitTop,
  onTaskCreated,
}: UseQuickAddArgs) {
  const addCategory = useBoardStore((s) => s.addCategory)
  const addTask = useBoardStore((s) => s.addTask)
  const projectsLatest = useBoardStore((s) => s.board.projects)
  const setSelectedCategoryId = useBoardStore((s) => s.setSelectedCategoryId)
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)

  const [state, dispatch] = useReducer(
    quickAddReducer,
    initialCategory
      ? {
          ...initialQuickAddState,
          lockedCategoryId: initialCategory.id,
          lockedCategoryName: initialCategory.name,
          step: 'title' as const,
        }
      : initialQuickAddState,
  )
  const {
    step,
    categoryDraft,
    lockedCategoryId,
    lockedCategoryName,
    titleDraft,
    lockedTitle,
    tagDraft,
    selectedTagIds,
    activeIdx,
  } = state

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

  const prevStepRef = useRef<typeof step | null>(null)
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

  // Testo catturato dal picker DOM (widget): lo scrive nella bozza titolo. Funziona
  // anche se la categoria non è ancora bloccata — CONFIRM_CATEGORY preserva titleDraft,
  // quindi il testo riemerge una volta raggiunto lo step titolo. `seq` evita di
  // re-iniettare lo stesso testo a ogni render.
  const lastCaptureSeq = useRef<number | null>(null)
  useEffect(() => {
    if (!capturedTitle) return
    if (lastCaptureSeq.current === capturedTitle.seq) return
    lastCaptureSeq.current = capturedTitle.seq
    dispatch({ type: 'SET_TITLE_DRAFT', value: capturedTitle.text })
    // Il click di cattura è avvenuto sulla pagina ospite: riporta il focus nel
    // campo titolo dell'iframe così l'utente può confermare subito con Invio.
    if (step === 'title') requestAnimationFrame(() => titleRef.current?.focus())
  }, [capturedTitle, step])

  function confirmCategorySuggestion(s: CategorySuggestion) {
    if (s.kind === 'create') {
      const id = addCategory(project.id, s.name)
      if (!id) return
      dispatch({ type: 'CONFIRM_CATEGORY', id, name: s.name })
    } else if (s.id) {
      dispatch({ type: 'CONFIRM_CATEGORY', id: s.id, name: s.name })
    }
  }

  function handleCategoryKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      onExitTop?.()
      return
    }
    const dropdownOpen = categorySuggestions.length > 0 && categoryDraft.length > 0
    if (e.key === 'Backspace' && !categoryDraft) {
      // campo vuoto in cima: risale alla selezione progetto
      e.preventDefault()
      onExitTop?.()
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
      if (categorySuggestions.length === 0) return
      e.preventDefault()
      confirmCategorySuggestion(categorySuggestions[activeIdx] ?? categorySuggestions[0])
    } else if (e.key === 'ArrowDown') {
      if (categorySuggestions.length === 0 || !categoryDraft) return
      e.preventDefault()
      dispatch({ type: 'MOVE_ACTIVE', delta: 1, length: categorySuggestions.length })
    } else if (e.key === 'ArrowUp') {
      if (categorySuggestions.length === 0 || !categoryDraft) return
      e.preventDefault()
      dispatch({ type: 'MOVE_ACTIVE', delta: -1, length: categorySuggestions.length })
    } else if (e.key === 'Escape') {
      // Esc = annulla, non naviga: Backspace a vuoto serve a risalire al progetto
      if (categoryDraft) {
        e.preventDefault()
        dispatch({ type: 'SET_CATEGORY_DRAFT', value: '' })
      }
    }
  }

  function handleTitleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      // su = step precedente nella stessa barra
      e.preventDefault()
      dispatch({ type: 'BACK_TO_CATEGORY' })
      return
    }
    if (tryArrowRightToNotepad(e, e.currentTarget, requestOpenNotepad)) return
    if (e.key === 'Tab' && !e.shiftKey) {
      if (!titleDraft.trim()) return
      e.preventDefault()
      dispatch({ type: 'COMMIT_TITLE' })
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      dispatch({ type: 'BACK_TO_CATEGORY' })
    } else if (e.key === 'Backspace' && !titleDraft) {
      e.preventDefault()
      dispatch({ type: 'BACK_TO_CATEGORY' })
    } else if (e.key === 'Enter') {
      // Invio sul titolo: crea subito il task senza tag (Tab apre lo step tag)
      const title = titleDraft.trim()
      if (!title || !lockedCategoryId) return
      e.preventDefault()
      createTask(title)
    } else if (e.key === 'Escape') {
      // Esc = annulla il testo del campo corrente; la risalita tra gli step è su Backspace.
      // Campo vuoto: non navighiamo e non blocchiamo l'evento, così nel widget il listener
      // di OmniAdd può chiudere l'overlay.
      if (titleDraft) {
        e.preventDefault()
        dispatch({ type: 'SET_TITLE_DRAFT', value: '' })
      }
    }
  }

  function addTagById(id: TagId) {
    dispatch({ type: 'ADD_TAG', id })
  }

  function createTask(title: string) {
    if (!lockedCategoryId) return
    const taskId = addTask(project.id, {
      title,
      categoryId: lockedCategoryId,
      tagIds: selectedTagIds,
    })
    if (taskId) onTaskCreated?.(lockedCategoryId, taskId)
    // tiene la categoria bloccata e riparte dal titolo per il task successivo
    dispatch({ type: 'RESET_FOR_NEXT_TASK' })
  }

  function submitTask() {
    if (!lockedTitle) return
    createTask(lockedTitle)
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const tagDropdownOpen = tagSuggestions.length > 0
    if (e.key === 'ArrowUp' && !tagDropdownOpen) {
      // su = step precedente nella stessa barra
      e.preventDefault()
      dispatch({ type: 'BACK_TO_TITLE' })
      return
    }
    if (tryArrowRightToNotepad(e, e.currentTarget, requestOpenNotepad)) return
    if (e.key === 'Tab' && !e.shiftKey) {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      addTagById(tagSuggestions[activeIdx]?.id ?? tagSuggestions[0].id)
    } else if (
      (e.key === 'Tab' && e.shiftKey) ||
      (e.key === 'Backspace' && !tagDraft && selectedTagIds.length === 0)
    ) {
      e.preventDefault()
      dispatch({ type: 'BACK_TO_TITLE' })
    } else if (e.key === 'Backspace' && !tagDraft && selectedTagIds.length > 0) {
      e.preventDefault()
      dispatch({ type: 'REMOVE_LAST_TAG' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (tagDraft.trim() && tagSuggestions.length > 0) {
        addTagById(tagSuggestions[activeIdx]?.id ?? tagSuggestions[0].id)
      } else if (lockedCategoryId && lockedTitle) {
        submitTask()
      }
    } else if (e.key === 'ArrowDown') {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      dispatch({ type: 'MOVE_ACTIVE', delta: 1, length: tagSuggestions.length })
    } else if (e.key === 'ArrowUp') {
      if (tagSuggestions.length === 0) return
      e.preventDefault()
      dispatch({ type: 'MOVE_ACTIVE', delta: -1, length: tagSuggestions.length })
    } else if (e.key === 'Escape') {
      // Esc = annulla il testo del campo corrente; la risalita tra gli step è su Backspace.
      // Campo vuoto: non navighiamo e non blocchiamo l'evento (nel widget chiude l'overlay).
      if (tagDraft) {
        e.preventDefault()
        dispatch({ type: 'SET_TAG_DRAFT', value: '' })
      }
    }
  }

  // re-check that locked category still exists (it could have been deleted)
  useEffect(() => {
    if (!lockedCategoryId) return
    const currentProject = projectsLatest.find((p) => p.id === project.id)
    const stillThere = currentProject?.categories.some((c) => c.id === lockedCategoryId)
    if (!stillThere) dispatch({ type: 'CATEGORY_LOST' })
  }, [projectsLatest, project.id, lockedCategoryId])

  const canSubmit = lockedCategoryId !== null && lockedTitle !== null

  return {
    step,
    categoryDraft,
    setCategoryDraft: (value: string) => dispatch({ type: 'SET_CATEGORY_DRAFT', value }),
    lockedCategoryName,
    titleDraft,
    setTitleDraft: (value: string) => dispatch({ type: 'SET_TITLE_DRAFT', value }),
    lockedTitle,
    tagDraft,
    setTagDraft: (value: string) => dispatch({ type: 'SET_TAG_DRAFT', value }),
    selectedTagIds,
    activeIdx,
    setActiveIdx: (index: number) => dispatch({ type: 'SET_ACTIVE_IDX', index }),
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
    // transizioni esposte ai chip cliccabili in QuickAddBar
    editCategory: () => dispatch({ type: 'EDIT_CATEGORY' }),
    editTitle: () => dispatch({ type: 'BACK_TO_TITLE' }),
    removeTag: (id: TagId) => dispatch({ type: 'REMOVE_TAG', id }),
  }
}
