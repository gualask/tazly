import { useEffect, useMemo, useState } from 'react'

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

  // Esc globale: chiude quando non c'è una bozza da svuotare (gli input gestiscono
  // da soli lo svuotamento / il passo indietro quando hanno testo).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      const el = document.activeElement
      const value = el instanceof HTMLInputElement ? el.value : ''
      if (value) return
      e.preventDefault()
      closeWidget()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop modale; la chiusura da tastiera è coperta da Esc
    <div
      className="fixed inset-0 flex items-start justify-center bg-foreground/10 p-4 pt-[14vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeWidget()
      }}
    >
      <div className="w-full max-w-xl">
        <div className="popover-surface rounded-xl border border-border p-3 shadow-2xl">
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
            onTaskCreated={(projectId, categoryId) => {
              setLastQuickAdd(projectId, categoryId)
              closeWidget()
            }}
            onEscapeAtProjectRoot={closeWidget}
          />
        </div>
      </div>
    </div>
  )
}
