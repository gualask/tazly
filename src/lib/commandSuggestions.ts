import type { ActiveFilters } from '@/store/useBoardStore'
import type { Category, Project, Tag } from '@/types/domain'

export type Suggestion =
  | { kind: 'project'; id: string; name: string; openCount: number }
  | { kind: 'create-project'; name: string }
  | { kind: 'tag'; tag: Tag }
  | { kind: 'category'; category: Category }

export function suggestionKey(s: Suggestion): string {
  if (s.kind === 'project') return `p:${s.id}`
  if (s.kind === 'create-project') return `cp:${s.name}`
  if (s.kind === 'tag') return `t:${s.tag.id}`
  return `c:${s.category.id}`
}

/**
 * Costruisce i suggerimenti della command bar.
 * Senza progetto in focus: lista/crea progetti. Con focus: filtri per tag e categoria.
 */
export function buildSuggestions(ctx: {
  draft: string
  focusProject: Project | null
  projects: Project[]
  tags: Tag[]
  activeFilters: ActiveFilters
}): Suggestion[] {
  const { draft, focusProject, projects, tags, activeFilters } = ctx
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
}
