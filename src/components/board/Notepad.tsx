import { useEffect, useRef } from 'react'

import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'

interface NotepadProps {
  projectId: ProjectId
  notes: string
  onBlurEmpty?: () => void
}

function focusQuickAdd() {
  const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
  const input = root?.querySelector<HTMLInputElement>('input')
  input?.focus()
}

export function Notepad({ projectId, notes, onBlurEmpty }: NotepadProps) {
  const updateProjectNotes = useBoardStore((s) => s.updateProjectNotes)
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (notepadOpenTick === 0) return
    textareaRef.current?.focus()
  }, [notepadOpenTick])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
      focusQuickAdd()
      return
    }
    if (e.key === 'ArrowLeft') {
      const el = e.currentTarget
      const atStart = (el.selectionStart ?? 0) === 0 && (el.selectionEnd ?? 0) === 0
      if (atStart) {
        e.preventDefault()
        el.blur()
        focusQuickAdd()
      }
    }
  }

  function handleBlur() {
    if (notes.length === 0) onBlurEmpty?.()
  }

  return (
    <div data-tazly-notepad-root className="flex min-h-[60vh] flex-col">
      <div className="mb-1 px-1 text-muted-foreground text-xs">Note</div>
      <textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => updateProjectNotes(projectId, e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Note del progetto…"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        className="h-full min-h-[40vh] flex-1 resize-none rounded-md border border-border bg-card p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}
