import type { TagColor } from '@/lib/colors'

export type TagId = string
export type CategoryId = string
export type ProjectId = string
export type TaskId = string
export type PromemoriaId = string

export interface Tag {
  id: TagId
  name: string
  color: TagColor
  description?: string
}

export interface Task {
  id: TaskId
  title: string
  categoryId: CategoryId
  tagIds: TagId[]
  done: boolean
  createdAt: number
  completedAt?: number
}

export interface Category {
  id: CategoryId
  name: string
  collapsed: boolean
  order: number
}

/** Spunto grezzo catturato dal widget: inbox transitorio del progetto, da smaltire in task/note. */
export interface Promemoria {
  id: PromemoriaId
  /** Derivazione plain-text: triage (titolo task / note) e fallback clipboard. */
  text: string
  /** HTML sanitizzato catturato dalla pagina (forma canonica per la copia fedele). */
  html?: string
  /** Pagina di provenienza (solo contesto: può essere privata/effimera). */
  sourceUrl?: string
  sourceTitle?: string
  createdAt: number
}

export interface Project {
  id: ProjectId
  name: string
  categories: Category[]
  tasks: Task[]
  notes: string
  promemoria: Promemoria[]
}

export interface Board {
  projects: Project[]
  tags: Tag[]
}
