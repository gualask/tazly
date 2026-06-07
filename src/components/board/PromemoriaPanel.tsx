import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconInbox,
  IconNotes,
  IconTrash,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/common/IconButton'
import { SafeHtml } from '@/components/common/SafeHtml'
import { focusComposer } from '@/lib/focus'
import { copyRichText, escapeHtml } from '@/lib/html'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId, Promemoria } from '@/types/domain'

interface PromemoriaPanelProps {
  projectId: ProjectId
  promemoria: Promemoria[]
}

/** Posizione + testo del chip "→ titolo" mostrato sulla selezione corrente. */
interface Chip {
  text: string
  x: number
  y: number
}

/**
 * Inbox del progetto: lista degli spunti catturati dal widget. Triage:
 * evidenziare del testo → chip "→ titolo" che semina il composer (→ task);
 * azioni per card: → note (append con divisorio) e scarta.
 */
export function PromemoriaPanel({ projectId, promemoria }: PromemoriaPanelProps) {
  const sendToComposer = useBoardStore((s) => s.sendToComposer)
  const convertPromemoriaToNote = useBoardStore((s) => s.convertPromemoriaToNote)
  const removePromemoria = useBoardStore((s) => s.removePromemoria)

  const [chip, setChip] = useState<Chip | null>(null)
  const chipRef = useRef<HTMLButtonElement>(null)
  // Id del promemoria appena copiato → spunta transitoria sul bottone.
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Copia fedele: text/html (renderizzato, per Confluence/Docs) + text/plain.
  async function copyPromemoria(m: Promemoria) {
    try {
      const html = m.html ?? `<p>${escapeHtml(m.text)}</p>`
      await copyRichText(html, m.text)
      setCopiedId(m.id)
      setTimeout(() => setCopiedId((id) => (id === m.id ? null : id)), 2000)
    } catch {
      // clipboard non disponibile: nessun feedback
    }
  }

  // Dopo una selezione, mostra il chip vicino al testo evidenziato.
  function handleMouseUp() {
    const sel = window.getSelection()
    const text = sel?.toString().trim() ?? ''
    if (!text || !sel || sel.rangeCount === 0) {
      setChip(null)
      return
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    setChip({ text, x: rect.left, y: rect.top })
  }

  // → task: semina il titolo nel composer in header. Il testo viaggia via store
  // (composerCapture) perché PromemoriaPanel e il composer (CommandBar) sono rami
  // fratelli: CommandBar lo legge e lo passa come capturedTitle a TaskComposer.
  function sendChipToComposer() {
    if (!chip) return
    sendToComposer(chip.text)
    focusComposer()
    window.getSelection()?.removeAllRanges()
    setChip(null)
  }

  // Il chip si chiude se si clicca altrove o si scorre (la posizione non è più valida).
  useEffect(() => {
    if (!chip) return
    function onDown(e: MouseEvent) {
      if (!chipRef.current?.contains(e.target as Node)) setChip(null)
    }
    function onScroll() {
      setChip(null)
    }
    document.addEventListener('mousedown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [chip])

  return (
    <div className="flex h-[60vh] flex-col lg:h-full">
      <div className="glass flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-border p-3">
        <div className="px-0.5">
          <div className="font-medium text-muted-foreground text-xs">
            Promemoria · {promemoria.length}
          </div>
          {promemoria.length > 0 && (
            <div className="text-[11px] text-muted-foreground/70">
              evidenzia il testo per creare un task
            </div>
          )}
        </div>

        {promemoria.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <IconInbox className="size-6 opacity-60" />
            <p className="text-xs">Nessuno spunto. Cattura del testo dal widget mentre navighi.</p>
          </div>
        ) : (
          <ul
            onMouseUp={handleMouseUp}
            className="-mr-1 flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1"
          >
            {promemoria.map((m) => (
              <li key={m.id} className="rounded-lg border border-border/60 bg-muted p-3">
                {m.html ? (
                  <SafeHtml html={m.html} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground text-xs">
                    {m.sourceTitle ? `da: ${m.sourceTitle}` : ''}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton
                      onClick={() => copyPromemoria(m)}
                      tooltip={copiedId === m.id ? 'Copiato' : 'Copia (formattato)'}
                      className="size-7"
                    >
                      {copiedId === m.id ? <IconCheck /> : <IconCopy />}
                    </IconButton>
                    <IconButton
                      onClick={() => convertPromemoriaToNote(projectId, m.id)}
                      tooltip="Aggiungi alle note"
                      className="size-7"
                    >
                      <IconNotes />
                    </IconButton>
                    <IconButton
                      onClick={() => removePromemoria(projectId, m.id)}
                      tooltip="Scarta"
                      className="size-7"
                    >
                      <IconTrash />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chip && (
        <button
          ref={chipRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={sendChipToComposer}
          style={{ position: 'fixed', top: chip.y - 36, left: chip.x, zIndex: 50 }}
          className="popover-surface inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs shadow-md hover:bg-accent"
        >
          <IconArrowRight className="size-3" /> titolo
        </button>
      )}
    </div>
  )
}
