import type { TagColor } from '@/lib/colors'
import type { Board, CategoryId, ProjectId, Tag, TagId, Task, TaskId } from '@/types/domain'

export interface ActiveFilters {
  tagIds: TagId[]
  categoryIds: CategoryId[]
}

export interface UiSlice {
  editingTaskId: TaskId | null
  editingCategoryId: CategoryId | null
  selectedTaskId: TaskId | null
  selectedCategoryId: CategoryId | null
  overviewSelectedProjectId: ProjectId | null
  notepadOpenTick: number
  viewResetTick: number
  copiedTaskId: TaskId | null
  copyTick: number

  setEditingTaskId: (id: TaskId | null) => void
  setEditingCategoryId: (id: CategoryId | null) => void
  setSelectedTaskId: (id: TaskId | null) => void
  setSelectedCategoryId: (id: CategoryId | null) => void
  setOverviewSelectedProjectId: (id: ProjectId | null) => void
  clearSelection: () => void
  markTaskCopied: (id: TaskId) => void
  copyTaskById: (id: TaskId) => Promise<void>
  requestOpenNotepad: () => void
  resetView: () => void
}

export interface ProjectSlice {
  addProject: (name: string) => ProjectId | null
  renameProject: (id: ProjectId, name: string) => void
  updateProjectNotes: (id: ProjectId, notes: string) => void
  removeProject: (id: ProjectId) => void
  isProjectNameTaken: (name: string) => boolean
}

export interface CategorySlice {
  addCategory: (projectId: ProjectId, name: string) => CategoryId | null
  renameCategory: (projectId: ProjectId, id: CategoryId, name: string) => void
  toggleCategoryCollapsed: (projectId: ProjectId, id: CategoryId) => void
  expandCategory: (projectId: ProjectId, id: CategoryId) => void
  removeCategory: (projectId: ProjectId, id: CategoryId) => void
}

export interface TaskSlice {
  lastClosedTask: { projectId: ProjectId; taskId: TaskId } | null

  addTask: (
    projectId: ProjectId,
    input: { title: string; categoryId: CategoryId; tagIds: TagId[] },
  ) => TaskId | null
  updateTask: (
    projectId: ProjectId,
    id: TaskId,
    patch: Partial<Pick<Task, 'title' | 'categoryId' | 'tagIds' | 'done'>>,
  ) => void
  toggleTaskDone: (projectId: ProjectId, id: TaskId) => void
  undoLastClose: () => void
  removeTask: (projectId: ProjectId, id: TaskId) => void
}

export interface TagSlice {
  addTag: (input: { name: string; color: TagColor; description?: string }) => void
  updateTag: (id: TagId, patch: Partial<Pick<Tag, 'name' | 'color' | 'description'>>) => void
  removeTag: (id: TagId) => void
}

export interface FocusSlice {
  focusProjectId: ProjectId | null
  activeFilters: ActiveFilters

  setFocusProject: (id: ProjectId | null) => void
  clearFocus: () => void
  toggleFilterTag: (id: TagId) => void
  toggleFilterCategory: (id: CategoryId) => void
  clearFilters: () => void
}

export interface BoardState
  extends UiSlice,
    ProjectSlice,
    CategorySlice,
    TaskSlice,
    TagSlice,
    FocusSlice {
  board: Board
  resetBoard: () => void
}
