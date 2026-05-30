import { IconChevronRight } from '@tabler/icons-react'
import { useMemo } from 'react'

import { TagBadge } from '@/components/tags/TagBadge'
import { cn } from '@/lib/utils'
import type { CategoryId, Project, Tag } from '@/types/domain'
import { BadgeChip, Dropdown, DropdownItem } from './QuickAddDropdown'
import { useQuickAdd } from './useQuickAdd'

interface QuickAddBarProps {
  project: Project
  allTags: Tag[]
  active?: boolean
  onTaskCreated?: (categoryId: CategoryId, taskId: string) => void
}

export function QuickAddBar({ project, allTags, active, onTaskCreated }: QuickAddBarProps) {
  const qa = useQuickAdd({ project, allTags, active, onTaskCreated })
  const tagById = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags])

  return (
    <div className="relative">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 transition',
          'focus-within:ring-1 focus-within:ring-ring',
        )}
      >
        {/* Category */}
        {qa.lockedCategoryName ? (
          <BadgeChip label={qa.lockedCategoryName} onClear={qa.editCategory} />
        ) : (
          <input
            ref={qa.categoryRef}
            value={qa.categoryDraft}
            onChange={(e) => qa.setCategoryDraft(e.target.value)}
            onKeyDown={qa.handleCategoryKey}
            placeholder="Categoria…"
            className="h-7 min-w-32 flex-1 rounded bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground focus:bg-foreground/5"
          />
        )}

        {qa.lockedCategoryName && <IconChevronRight className="size-3 text-muted-foreground" />}

        {/* Title */}
        {qa.lockedCategoryName &&
          (qa.lockedTitle ? (
            <BadgeChip label={qa.lockedTitle} onClear={qa.editTitle} />
          ) : qa.step !== 'category' ? (
            <input
              ref={qa.titleRef}
              value={qa.titleDraft}
              onChange={(e) => qa.setTitleDraft(e.target.value)}
              onKeyDown={qa.handleTitleKey}
              placeholder="Testo del task…"
              className="h-7 min-w-40 flex-1 rounded bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground focus:bg-foreground/5"
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
              <input
                ref={qa.tagRef}
                value={qa.tagDraft}
                onChange={(e) => qa.setTagDraft(e.target.value)}
                onKeyDown={qa.handleTagKey}
                placeholder={qa.selectedTagIds.length === 0 ? 'Tag…' : '+ tag'}
                className="h-7 min-w-24 flex-1 rounded bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground focus:bg-foreground/5"
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
      </div>

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
