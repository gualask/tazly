import type { Category, Tag, TagId } from '@/types/domain'

export const RAPID_REGEX = /^([^:]+):\s*(.+?)(?:\s+(#\S+(?:\s+#\S+)*))?$/

export interface ParsedRapidInput {
  categoryName: string
  title: string
  tagIds: TagId[]
}

/**
 * Interpreta la sintassi rapida `Categoria: testo #tag #tag`.
 * Pura: risolve i nomi tag in id sui `tags` forniti, ma non crea nulla.
 * Ritorna null se l'input non combacia o se nessun tag è risolvibile.
 */
export function parseRapidInput(
  input: string,
  ctx: { categories: Category[]; tags: Tag[] },
): ParsedRapidInput | null {
  const m = RAPID_REGEX.exec(input.trim())
  if (!m) return null
  const [, catRaw, titleRaw, tagsRaw] = m
  const categoryName = catRaw.trim()
  const title = titleRaw.trim()
  if (!categoryName || !title) return null

  const tagNames = (tagsRaw ?? '')
    .split(/\s+/)
    .map((s) => s.replace(/^#/, '').trim())
    .filter(Boolean)

  const tagIds: TagId[] = []
  for (const name of tagNames) {
    const t = ctx.tags.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (t) tagIds.push(t.id)
  }
  if (tagIds.length === 0) return null

  return { categoryName, title, tagIds }
}
