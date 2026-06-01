import { IconChevronRight } from '@tabler/icons-react'
import { type ComponentProps, forwardRef, type ReactNode, useMemo } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { FieldShell } from '@/components/ui/field-shell'
import { cn } from '@/lib/utils'
import type { CategoryId, Project, Tag } from '@/types/domain'
import { BadgeChip, Dropdown, DropdownItem } from './QuickAddDropdown'
import { useQuickAdd } from './useQuickAdd'

interface QuickAddBarProps {
  project: Project
  allTags: Tag[]
  active?: boolean
  /** Categoria pre-bloccata al mount: parte dallo step titolo (usata dal widget quick-add). */
  initialCategory?: { id: CategoryId; name: string } | null
  /** Contenuto reso in testa alla FieldShell (es. il chip del progetto nel composer). */
  leading?: ReactNode
  /** Risalita "in cima" dallo step categoria (il composer torna alla selezione progetto). */
  onExitTop?: () => void
  onTaskCreated?: (categoryId: CategoryId, taskId: string) => void
}

/** Input "segmento" della quick-add: trasparente, dentro la FieldShell. */
const QuickAddInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-7 flex-1 rounded bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
)
QuickAddInput.displayName = 'QuickAddInput'

export function QuickAddBar({
  project,
  allTags,
  active,
  initialCategory,
  leading,
  onExitTop,
  onTaskCreated,
}: QuickAddBarProps) {
  const qa = useQuickAdd({ project, allTags, active, initialCategory, onExitTop, onTaskCreated })
  const tagById = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags])

  return (
    <div className="relative">
      <FieldShell>
        {leading}
        {/* Category */}
        {qa.lockedCategoryName ? (
          <BadgeChip label={qa.lockedCategoryName} onClear={qa.editCategory} />
        ) : (
          <QuickAddInput
            ref={qa.categoryRef}
            value={qa.categoryDraft}
            onChange={(e) => qa.setCategoryDraft(e.target.value)}
            onKeyDown={qa.handleCategoryKey}
            placeholder="Categoria…"
            className="min-w-32"
          />
        )}

        {qa.lockedCategoryName && <IconChevronRight className="size-3 text-muted-foreground" />}

        {/* Title */}
        {qa.lockedCategoryName &&
          (qa.lockedTitle ? (
            <BadgeChip label={qa.lockedTitle} onClear={qa.editTitle} />
          ) : qa.step !== 'category' ? (
            <QuickAddInput
              ref={qa.titleRef}
              value={qa.titleDraft}
              onChange={(e) => qa.setTitleDraft(e.target.value)}
              onKeyDown={qa.handleTitleKey}
              placeholder="Testo del task…"
              className="min-w-40"
            />
          ) : null)}

        {qa.lockedTitle && <IconChevronRight className="size-3 text-muted-foreground" />}

        {/* Tags */}
        {qa.lockedTitle && (
          <>
            {qa.selectedTagIds.map((id) => {
              const t = tagById.get(id)
              if (!t) return null
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => qa.removeTag(id)}
                  className="group/tag"
                  aria-label="Rimuovi tag"
                >
                  <TagBadge tag={t} className="pr-1 group-hover/tag:opacity-70" />
                </button>
              )
            })}
            {qa.step === 'tags' && (
              <QuickAddInput
                ref={qa.tagRef}
                value={qa.tagDraft}
                onChange={(e) => qa.setTagDraft(e.target.value)}
                onKeyDown={qa.handleTagKey}
                placeholder={qa.selectedTagIds.length === 0 ? 'Tag…' : '+ tag'}
                className="min-w-24"
              />
            )}
          </>
        )}

        {qa.canSubmit && (
          <button
            type="button"
            onClick={qa.submitTask}
            className="ml-auto rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs"
          >
            Invio ↵
          </button>
        )}
      </FieldShell>

      {qa.step === 'category' && qa.categorySuggestions.length > 0 && qa.categoryDraft && (
        <Dropdown>
          {qa.categorySuggestions.map((s, i) => (
            <DropdownItem
              key={`${s.kind}:${s.id ?? s.name}`}
              active={i === qa.activeIdx}
              onMouseEnter={() => qa.setActiveIdx(i)}
              onClick={() => qa.confirmCategorySuggestion(s)}
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

      {qa.step === 'tags' && qa.tagSuggestions.length > 0 && (
        <Dropdown>
          {qa.tagSuggestions.map((t, i) => (
            <DropdownItem
              key={t.id}
              active={i === qa.activeIdx}
              onMouseEnter={() => qa.setActiveIdx(i)}
              onClick={() => qa.addTagById(t.id)}
            >
              <TagBadge tag={t} />
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {qa.step === 'category' && !qa.categoryDraft && qa.sortedCategories.length === 0 && (
        <p className="mt-1 text-muted-foreground text-xs">
          Inizia a digitare per creare la prima categoria.
        </p>
      )}
      {qa.step === 'tags' && allTags.length === 0 && (
        <p className="mt-1 text-muted-foreground text-xs">
          Nessun tag disponibile. Definiscine prima qualcuno in Gestione tag.
        </p>
      )}
    </div>
  )
}
