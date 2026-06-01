import type { Project } from '@/types/domain'

export type Suggestion =
  | { kind: 'project'; id: string; name: string; openCount: number }
  | { kind: 'create-project'; name: string }

export function suggestionKey(s: Suggestion): string {
  if (s.kind === 'project') return `p:${s.id}`
  return `cp:${s.name}`
}

/**
 * Suggerimenti del composer per lo step progetto: elenca i progetti che combaciano
 * con la bozza e, se il nome non esiste, propone di crearne uno nuovo.
 */
export function buildSuggestions(ctx: { draft: string; projects: Project[] }): Suggestion[] {
  const { draft, projects } = ctx
  const q = draft.trim().toLowerCase()

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
