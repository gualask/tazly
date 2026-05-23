import { useEffect, useRef } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'

interface NotepadProps {
  projectId: ProjectId
  notes: string
}

function focusQuickAdd() {
  const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
  const input = root?.querySelector<HTMLInputElement>('input')
  input?.focus()
}

export function Notepad({ projectId, notes }: NotepadProps) {
  const updateProjectNotes = useBoardStore((s) => s.updateProjectNotes)
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prevTickRef = useRef(notepadOpenTick)
  useEffect(() => {
    if (notepadOpenTick === prevTickRef.current) return
    prevTickRef.current = notepadOpenTick
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

  return (
    <div data-tazly-notepad-root className="flex h-[60vh] flex-col lg:h-full">
      <Textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => updateProjectNotes(projectId, e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Note del progetto…"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        className="h-full min-h-0 flex-1 resize-none overflow-auto rounded-xl bg-card p-3 leading-relaxed [field-sizing:fixed]"
      />
    </div>
  )
}
