import type { CategoryId, TagId } from '@/types/domain'

export type QuickAddStep = 'category' | 'title' | 'tags'

/**
 * Stato puro della quick-add (category → title → tags). Nessun riferimento a DOM,
 * store o ref: gli effetti (creare categoria/task, focus, blur) restano nell'hook
 * `useQuickAdd`, che risolve gli id e poi dispatcha qui le transizioni di stato.
 */
export interface QuickAddState {
  step: QuickAddStep
  categoryDraft: string
  lockedCategoryId: CategoryId | null
  lockedCategoryName: string | null
  titleDraft: string
  lockedTitle: string | null
  tagDraft: string
  selectedTagIds: TagId[]
  activeIdx: number
}

export const initialQuickAddState: QuickAddState = {
  step: 'category',
  categoryDraft: '',
  lockedCategoryId: null,
  lockedCategoryName: null,
  titleDraft: '',
  lockedTitle: null,
  tagDraft: '',
  selectedTagIds: [],
  activeIdx: 0,
}

export type QuickAddAction =
  | { type: 'SET_CATEGORY_DRAFT'; value: string }
  | { type: 'SET_TITLE_DRAFT'; value: string }
  | { type: 'SET_TAG_DRAFT'; value: string }
  | { type: 'SET_ACTIVE_IDX'; index: number }
  /** ↑/↓ nel dropdown: sposta l'highlight di `delta` clampando su [0, length-1]. */
  | { type: 'MOVE_ACTIVE'; delta: number; length: number }
  /** Categoria confermata (id già risolto dall'hook, creandola se serviva). */
  | { type: 'CONFIRM_CATEGORY'; id: CategoryId; name: string }
  /** Tab/Invio sul titolo: blocca il titolo e passa ai tag (no-op se vuoto). */
  | { type: 'COMMIT_TITLE' }
  | { type: 'ADD_TAG'; id: TagId }
  /** Click sul chip di un tag già selezionato. */
  | { type: 'REMOVE_TAG'; id: TagId }
  /** Backspace a campo tag vuoto: rimuove l'ultimo tag selezionato. */
  | { type: 'REMOVE_LAST_TAG' }
  /** Indietro da titolo a categoria (tastiera): ripristina la bozza categoria. */
  | { type: 'BACK_TO_CATEGORY' }
  /** Indietro da tag a titolo: ripristina la bozza titolo, i tag restano. */
  | { type: 'BACK_TO_TITLE' }
  /** Click sul chip categoria: torna a categoria azzerando titolo e tag a valle. */
  | { type: 'EDIT_CATEGORY' }
  /** Dopo aver creato un task: stessa categoria, riparte dal titolo. */
  | { type: 'RESET_FOR_NEXT_TASK' }
  /** La categoria bloccata è stata eliminata altrove. */
  | { type: 'CATEGORY_LOST' }

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(value, max))
}

export function quickAddReducer(state: QuickAddState, action: QuickAddAction): QuickAddState {
  switch (action.type) {
    case 'SET_CATEGORY_DRAFT':
      // il cambio bozza azzera l'highlight del dropdown
      return { ...state, categoryDraft: action.value, activeIdx: 0 }
    case 'SET_TITLE_DRAFT':
      // lo step titolo non ha dropdown: l'highlight resta invariato
      return { ...state, titleDraft: action.value }
    case 'SET_TAG_DRAFT':
      return { ...state, tagDraft: action.value, activeIdx: 0 }
    case 'SET_ACTIVE_IDX':
      return { ...state, activeIdx: action.index }
    case 'MOVE_ACTIVE':
      return { ...state, activeIdx: clamp(state.activeIdx + action.delta, action.length - 1) }
    case 'CONFIRM_CATEGORY':
      return {
        ...state,
        lockedCategoryId: action.id,
        lockedCategoryName: action.name,
        categoryDraft: '',
        step: 'title',
        activeIdx: 0,
      }
    case 'COMMIT_TITLE': {
      const title = state.titleDraft.trim()
      if (!title) return state
      return { ...state, lockedTitle: title, step: 'tags', activeIdx: 0 }
    }
    case 'ADD_TAG':
      return {
        ...state,
        selectedTagIds: state.selectedTagIds.includes(action.id)
          ? state.selectedTagIds
          : [...state.selectedTagIds, action.id],
        tagDraft: '',
        activeIdx: 0,
      }
    case 'REMOVE_TAG':
      return { ...state, selectedTagIds: state.selectedTagIds.filter((id) => id !== action.id) }
    case 'REMOVE_LAST_TAG':
      return { ...state, selectedTagIds: state.selectedTagIds.slice(0, -1) }
    case 'BACK_TO_CATEGORY':
      // tastiera: il titolo eventualmente digitato resta nella bozza
      return {
        ...state,
        categoryDraft: state.lockedCategoryName ?? '',
        lockedCategoryId: null,
        lockedCategoryName: null,
        step: 'category',
        activeIdx: 0,
      }
    case 'BACK_TO_TITLE':
      return {
        ...state,
        titleDraft: state.lockedTitle ?? '',
        lockedTitle: null,
        step: 'title',
        activeIdx: 0,
      }
    case 'EDIT_CATEGORY':
      return {
        ...state,
        lockedCategoryId: null,
        lockedCategoryName: null,
        categoryDraft: state.lockedCategoryName ?? '',
        lockedTitle: null,
        titleDraft: state.lockedTitle ?? '',
        selectedTagIds: [],
        step: 'category',
        activeIdx: 0,
      }
    case 'RESET_FOR_NEXT_TASK':
      return {
        ...state,
        step: 'title',
        titleDraft: '',
        lockedTitle: null,
        tagDraft: '',
        selectedTagIds: [],
        activeIdx: 0,
      }
    case 'CATEGORY_LOST':
      return {
        ...state,
        lockedCategoryId: null,
        lockedCategoryName: null,
        step: 'category',
        activeIdx: 0,
      }
  }
}
