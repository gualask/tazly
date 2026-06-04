import { useEffect, useMemo, useRef, useState } from 'react'

import { TaskComposer } from '@/components/board/TaskComposer'
import { Kbd } from '@/components/ui/kbd'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'

/** Chiede all'overlay (pagina ospite) di rimuovere l'iframe. */
function closeWidget() {
  window.parent.postMessage({ type: 'tazly:close' }, '*')
}

export function OmniAdd() {
  const projects = useBoardStore((s) => s.board.projects)
  const lastQuickAdd = useBoardStore((s) => s.lastQuickAdd)
  const setLastQuickAdd = useBoardStore((s) => s.setLastQuickAdd)

  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId | null>(null)
  // Testo catturato da un click sulla pagina ospite (vedi widgetOverlay.ts).
  // `seq` cresce a ogni cattura così l'effetto a valle ri-scatta anche su testo identico.
  const [captured, setCaptured] = useState<{ text: string; seq: number } | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)

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

  // Riporta l'altezza renderizzata all'overlay, così l'iframe resta alto quanto il
  // composer + gli eventuali dropdown (altrimenti l'iframe li taglierebbe). Misuro
  // il fondo reale di tutti i discendenti: i dropdown sono assoluti e sforano il
  // box, quindi scrollHeight non basterebbe. Rieseguito a ogni render (i cambi di
  // step/dropdown ri-renderizzano) e su resize asincroni (font, layout).
  useEffect(() => {
    function report() {
      const root = rootRef.current
      if (!root) return
      // Base: il box del root, che include il padding trasparente riservato all'ombra
      // spatial (altrimenti l'iframe la taglierebbe in un rettangolo netto).
      let bottom = root.getBoundingClientRect().bottom
      // I dropdown sono assoluti e sforano il root: includili nella misura.
      for (const el of root.querySelectorAll('*')) {
        const b = el.getBoundingClientRect().bottom
        if (b > bottom) bottom = b
      }
      window.parent.postMessage({ type: 'tazly:resize', height: Math.ceil(bottom + 8) }, '*')
    }
    report()
    // ResizeObserver coglie i reflow (font/testo); MutationObserver coglie i
    // dropdown che entrano/escono dal DOM — cambi che avvengono dentro componenti
    // figli e non ri-renderizzano OmniAdd, quindi un effetto da solo non basta.
    const ro = new ResizeObserver(report)
    ro.observe(document.documentElement)
    const mo = new MutationObserver(report)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  // Riceve il testo catturato dal picker (postMessage dall'overlay). `seq` interno
  // cresce a ogni cattura così l'iniezione a valle ri-scatta anche su testo identico.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; text?: string } | null
      if (data?.type === 'tazly:capture' && data.text) {
        const text = data.text
        setCaptured((prev) => ({ text, seq: (prev?.seq ?? 0) + 1 }))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const selectedProject = useMemo(
    () => (selectedProjectId ? (projects.find((p) => p.id === selectedProjectId) ?? null) : null),
    [selectedProjectId, projects],
  )

  // Categoria da pre-bloccare: solo se memorizzata per QUESTO progetto ed esistente.
  const initialCategory = useMemo(() => {
    if (!selectedProject || !lastQuickAdd || lastQuickAdd.projectId !== selectedProject.id) {
      return null
    }
    const cat = selectedProject.categories.find((c) => c.id === lastQuickAdd.categoryId)
    return cat ? { id: cat.id, name: cat.name } : null
  }, [selectedProject, lastQuickAdd])

  // Esc globale: chiude il widget. Gli input chiamano `preventDefault()` solo quando
  // c'è del testo da svuotare; in quel caso `defaultPrevented` è già true quando l'evento
  // risale fino a window, e noi non chiudiamo. A campo vuoto nessuno previene il default,
  // quindi chiudiamo. (Si usa `defaultPrevented` e non `activeElement.value`: React fa
  // flush sincrono dello svuotamento prima del bubble, falsando una lettura del valore.)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      closeWidget()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // Padding trasparente attorno alla card: dà spazio all'ombra spatial perché
    // sfumi sulla pagina (l'iframe è trasparente) invece di essere tagliata.
    <div ref={rootRef} className="px-11 pt-4 pb-16">
      <div className="glass-strong rounded-2xl border border-border p-3">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <span className="font-medium text-muted-foreground text-xs">Tazly · aggiungi task</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
            <Kbd>esc</Kbd>
            chiudi
          </span>
        </div>

        <TaskComposer
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          initialCategory={initialCategory}
          capturedTitle={captured}
          onTaskCreated={(projectId, categoryId) => {
            // Resta aperto: il composer riparte dal titolo (RESET_FOR_NEXT_TASK),
            // pronto a catturare un'altra frase. Si chiude con Esc.
            setLastQuickAdd(projectId, categoryId)
          }}
          onEscapeAtProjectRoot={closeWidget}
        />
      </div>
    </div>
  )
}
