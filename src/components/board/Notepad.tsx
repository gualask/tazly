import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/common/IconButton'
import { Textarea } from '@/components/ui/textarea'
import { focusComposer } from '@/lib/focus'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'

interface NotepadProps {
  projectId: ProjectId
  notes: string
}

export function Notepad({ projectId, notes }: NotepadProps) {
  const updateProjectNotes = useBoardStore((s) => s.updateProjectNotes)
  const notepadOpenTick = useBoardStore((s) => s.notepadOpenTick)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  async function copyAll() {
    if (!notes) return
    try {
      await navigator.clipboard.writeText(notes)
      setCopied(true)
    } catch {
      // clipboard non disponibile: nessun feedback
    }
  }

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
      focusComposer()
      return
    }
    if (e.key === 'ArrowLeft') {
      const el = e.currentTarget
      const atStart = (el.selectionStart ?? 0) === 0 && (el.selectionEnd ?? 0) === 0
      if (atStart) {
        e.preventDefault()
        el.blur()
        focusComposer()
      }
    }
  }

  return (
    <div data-tazly-notepad-root className="relative flex h-[60vh] flex-col lg:h-full">
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
        className="glass h-full min-h-0 flex-1 resize-none overflow-auto rounded-xl p-3 leading-relaxed [field-sizing:fixed]"
      />
      <IconButton
        className="absolute right-2 top-2 size-7"
        onClick={copyAll}
        disabled={!notes}
        tooltip={copied ? 'Copiato' : 'Copia tutto'}
      >
        {copied ? <IconCheck /> : <IconCopy />}
      </IconButton>
    </div>
  )
}
