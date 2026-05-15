import type { TagColor } from '@/lib/colors'

export type TagId = string
export type CategoryId = string
export type ProjectId = string
export type TaskId = string

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

export interface Project {
  id: ProjectId
  name: string
  categories: Category[]
  tasks: Task[]
  notes: string
}

export interface Board {
  projects: Project[]
  tags: Tag[]
}
