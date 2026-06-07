import { IconChevronRight, IconCrosshair, IconDeviceFloppy, IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

import { ProjectPicker } from '@/components/board/ProjectPicker'
import { IconButton } from '@/components/common/IconButton'
import { SafeHtml } from '@/components/common/SafeHtml'
import { Kbd } from '@/components/ui/kbd'
import { Pill } from '@/components/ui/pill'
import { Textarea } from '@/components/ui/textarea'
import { cleanCapturedHtml } from '@/lib/html'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'
import type { OverlayToWidget, WidgetToOverlay } from './messages'

/** Invia un messaggio tipizzato all'overlay (pagina ospite). */
function postToOverlay(msg: WidgetToOverlay) {
  window.parent.postMessage(msg, '*')
}

/** Chiede all'overlay di rimuovere l'iframe. */
function closeWidget() {
  postToOverlay({ type: 'tazly:close' })
}

interface Source {
  url?: string
  title?: string
}

/**
 * Widget di cattura: ritaglia uno spunto (testo selezionato dalla pagina o digitato)
 * e lo salva come promemoria nell'inbox del progetto scelto. Il triage (→task/→note)
 * avviene poi nell'app.
 */
export function PromemoriaCapture() {
  const projects = useBoardStore((s) => s.board.projects)
  const addPromemoria = useBoardStore((s) => s.addPromemoria)

  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId | null>(null)
  const [text, setText] = useState('')
  // HTML sanitizzato del frammento catturato dalla pagina: forma canonica per la
  // copia fedele. Vuoto quando lo spunto è digitato a mano (solo plain text).
  const [html, setHtml] = useState('')
  const [source, setSource] = useState<Source>({})
  const [saved, setSaved] = useState(false)
  // Modalità selezione: l'overlay collassa l'iframe a icona e libera la pagina per la
  // selezione nativa; il widget mostra solo un'icona finché non torna la cattura.
  const [selecting, setSelecting] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Pre-seleziona l'ultimo progetto usato, una volta che lo store è idratato.
  useEffect(() => {
    function init() {
      const st = useBoardStore.getState()
      const last = st.lastQuickAdd
      if (last && st.board.projects.some((p) => p.id === last.projectId)) {
        setSelectedProjectId(last.projectId)
      }
    }
    if (useBoardStore.persist.hasHydrated()) init()
    return useBoardStore.persist.onFinishHydration(init)
  }, [])

  // Dà il focus al testo appena un progetto è selezionato (pronti a digitare/incollare).
  useEffect(() => {
    if (selectedProjectId) textareaRef.current?.focus()
  }, [selectedProjectId])

  // Riporta l'altezza renderizzata all'overlay, così l'iframe resta alto quanto il
  // contenuto (incluso il dropdown del picker, che è assoluto e sfora il box).
  useEffect(() => {
    function report() {
      const root = rootRef.current
      if (!root) return
      let bottom = root.getBoundingClientRect().bottom
      for (const el of root.querySelectorAll('*')) {
        const b = el.getBoundingClientRect().bottom
        if (b > bottom) bottom = b
      }
      postToOverlay({ type: 'tazly:resize', height: Math.ceil(bottom + 8) })
    }
    report()
    const ro = new ResizeObserver(report)
    ro.observe(document.documentElement)
    const mo = new MutationObserver(report)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  // Cattura dal picker DOM dell'overlay: il testo cliccato diventa lo spunto, con
  // l'URL/titolo della pagina come provenienza (li vede solo l'overlay, iframe a parte).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as OverlayToWidget | null
      if (data?.type === 'tazly:capture' && data.text) {
        setText(data.text)
        // Sanitizza + pulisci i link qui (il widget può importare e conosce la
        // pagina d'origine; l'overlay no): storage e anteprima partono già puliti.
        setHtml(data.html ? cleanCapturedHtml(data.html, data.sourceUrl) : '')
        setSource({ url: data.sourceUrl, title: data.sourceTitle })
        setSaved(false)
        setSelecting(false) // l'overlay è già tornato a dimensione piena
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Esc globale: chiude il widget, a meno che un campo non abbia già consumato l'evento
  // (es. textarea con del testo lo svuota e fa preventDefault).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      closeWidget()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function save() {
    if (!selectedProjectId || !text.trim()) return
    addPromemoria(selectedProjectId, {
      text,
      html: html || undefined,
      sourceUrl: source.url,
      sourceTitle: source.title,
    })
    // Resta aperto, pronto a un'altra cattura: svuota e conferma.
    setText('')
    setHtml('')
    setSource({})
    setSaved(true)
    textareaRef.current?.focus()
  }

  function startSelect() {
    setSelecting(true)
    postToOverlay({ type: 'tazly:select-mode', on: true })
  }
  function cancelSelect() {
    setSelecting(false)
    postToOverlay({ type: 'tazly:select-mode', on: false })
  }

  function handleTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
      return
    }
    if (e.key === 'Escape' && text) {
      e.preventDefault()
      setText('')
      setHtml('')
      setSource({})
    }
  }

  // Scarta la cattura corrente e torna all'inserimento manuale (textarea).
  function clearCapture() {
    setText('')
    setHtml('')
    setSource({})
    setSaved(false)
    textareaRef.current?.focus()
  }

  // Modalità selezione: l'iframe è collassato a 44px dall'overlay → mostra solo
  // l'icona (click = annulla). La selezione vera avviene sulla pagina.
  if (selecting) {
    return (
      <div ref={rootRef} className="flex size-11 items-center justify-center">
        <button
          type="button"
          onClick={cancelSelect}
          title="Seleziona del testo nella pagina · clicca per annullare"
          className="glass-strong flex size-11 items-center justify-center rounded-xl border border-border text-foreground"
        >
          <IconCrosshair className="size-5" />
        </button>
      </div>
    )
  }

  return (
    // Padding trasparente attorno alla card per l'ombra spatial (l'iframe è trasparente).
    <div ref={rootRef} className="px-11 pt-4 pb-16">
      <div className="glass-strong rounded-2xl border border-border p-3">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <span className="font-medium text-muted-foreground text-xs">Tazly · promemoria</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
            <Kbd>esc</Kbd>
            chiudi
          </span>
        </div>

        {selectedProjectId ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-0.5">
              <Pill>
                {projects.find((p) => p.id === selectedProjectId)?.name ?? '—'}
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="opacity-50 hover:opacity-100"
                  aria-label="Cambia progetto"
                >
                  <IconX className="size-3" />
                </button>
              </Pill>
              <IconChevronRight className="size-3 text-muted-foreground" />
              <button
                type="button"
                onClick={startSelect}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
              >
                <IconCrosshair className="size-3.5" />
                seleziona dalla pagina
              </button>
            </div>

            {html ? (
              // Cattura dalla pagina: anteprima fedele (read-only). La formattazione
              // è quella che verrà copiata in Confluence & co. ⌫ per scartare.
              <div className="glass relative max-h-60 overflow-auto rounded-xl p-3">
                <SafeHtml html={html} />
                <IconButton
                  className="absolute top-1.5 right-1.5 size-6"
                  onClick={clearCapture}
                  tooltip="Scarta e scrivi a mano"
                >
                  <IconX />
                </IconButton>
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setSaved(false)
                }}
                onKeyDown={handleTextareaKey}
                placeholder="Spunto da ricordare…"
                spellCheck={false}
                className="glass max-h-60 min-h-20 resize-none rounded-xl p-3 leading-relaxed [field-sizing:content]"
              />
            )}

            <div className="flex items-center justify-between px-0.5">
              <span className="truncate text-muted-foreground text-xs">
                {saved ? 'Salvato ✓' : source.title ? `da: ${source.title}` : ''}
              </span>
              <IconButton
                onClick={save}
                disabled={!text.trim()}
                tooltip="Salva promemoria · ⌘↵"
                className="size-7"
              >
                <IconDeviceFloppy />
              </IconButton>
            </div>
          </div>
        ) : (
          <ProjectPicker onSelectProject={setSelectedProjectId} onEscapeAtRoot={closeWidget} />
        )}
      </div>
    </div>
  )
}
