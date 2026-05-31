import {
  IconDownload,
  IconHistory,
  IconMoon,
  IconRefresh,
  IconSun,
  IconTag,
  IconUpload,
} from '@tabler/icons-react'
import { useRef, useState } from 'react'

import { BoardView } from '@/components/board/BoardView'
import { CommandBar } from '@/components/board/CommandBar'
import { IconButton } from '@/components/common/IconButton'
import { LogView } from '@/components/log/LogView'
import { TagsView } from '@/components/tags/TagsView'
import { Kbd } from '@/components/ui/kbd'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys'
import { useTheme } from '@/hooks/useTheme'
import { exportBoard, parseBoardBackup } from '@/lib/boardBackup'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { ProjectId } from '@/types/domain'

type View = 'board' | 'tags' | 'log'

export function App() {
  const [view, setView] = useState<View>('board')
  const [logFilterProjectId, setLogFilterProjectId] = useState<ProjectId | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const resetBoard = useBoardStore((s) => s.resetBoard)
  const importBoard = useBoardStore((s) => s.importBoard)
  const focusProjectId = useBoardStore((s) => s.focusProjectId)
  const overviewSelectedProjectId = useBoardStore((s) => s.overviewSelectedProjectId)
  const { theme, toggleTheme } = useTheme()
  const importInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    exportBoard(useBoardStore.getState().board)
  }

  async function handleImportFile(file: File) {
    try {
      const board = parseBoardBackup(await file.text())
      const current = useBoardStore.getState().board
      const hasCurrent = current.projects.length > 0 || current.tags.length > 0
      if (hasCurrent && !confirm('Importare il backup? La board attuale verrà sostituita.')) {
        return
      }
      importBoard(board)
    } catch (err) {
      alert(`Import non riuscito: ${err instanceof Error ? err.message : 'file illeggibile'}`)
    }
  }

  function openLogForProject(projectId: ProjectId) {
    setLogFilterProjectId(projectId)
    setView('log')
  }

  function leaveToBoard() {
    setLogFilterProjectId(null)
    setView('board')
  }

  useGlobalHotkeys({
    onToggleHelp: () => setShowHelp((v) => !v),
    onToggleLog: () => {
      if (view === 'log') {
        leaveToBoard()
        return
      }
      const activeProjectId = focusProjectId ?? overviewSelectedProjectId
      if (activeProjectId) openLogForProject(activeProjectId)
      else {
        setLogFilterProjectId(null)
        setView('log')
      }
    },
    onToggleTags: () => setView(view === 'tags' ? 'board' : 'tags'),
    onToggleTheme: toggleTheme,
    onLeaveOverlay: leaveToBoard,
    inOverlay: view !== 'board',
    resetEnabled: view === 'board',
  })

  return (
    <TooltipProvider>
      <main className="min-h-screen text-foreground">
        <header className="glass-bar sticky top-0 z-20 border-b border-border">
          <div className="mx-auto flex h-12 w-full max-w-[1440px] items-center gap-2 px-4">
            <div className="flex-1">{view === 'board' && <CommandBar />}</div>
            <IconButton
              variant={view === 'log' ? 'secondary' : 'ghost'}
              onClick={() => {
                if (view === 'log') {
                  leaveToBoard()
                } else {
                  setLogFilterProjectId(null)
                  setView('log')
                }
              }}
              tooltip="Storico completati (⌥L)"
              className="size-7"
            >
              <IconHistory />
            </IconButton>
            <IconButton
              variant={view === 'tags' ? 'secondary' : 'ghost'}
              onClick={() => setView(view === 'tags' ? 'board' : 'tags')}
              tooltip="Gestione tag (⌥T)"
              className="size-7"
            >
              <IconTag />
            </IconButton>
            <IconButton
              variant="ghost"
              onClick={handleExport}
              tooltip="Esporta backup"
              className="size-7"
            >
              <IconDownload />
            </IconButton>
            <IconButton
              variant="ghost"
              onClick={() => importInputRef.current?.click()}
              tooltip="Importa backup"
              className="size-7"
            >
              <IconUpload />
            </IconButton>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
            <IconButton
              variant="ghost"
              onClick={toggleTheme}
              tooltip={`${theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'} (⌥D)`}
              className="size-7"
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </IconButton>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="rounded border border-transparent px-1.5 py-0.5 font-mono text-muted-foreground text-xs hover:border-border"
              title="Aiuto (⌥H)"
            >
              ?
            </button>
            {import.meta.env.DEV && (
              <IconButton
                className="size-7 text-muted-foreground"
                tooltip="Reset board (dev)"
                onClick={() => {
                  if (confirm('Reset completo della board e dello storage. Procedere?')) {
                    useBoardStore.persist.clearStorage()
                    resetBoard()
                  }
                }}
              >
                <IconRefresh />
              </IconButton>
            )}
          </div>
        </header>

        {view === 'board' && <BoardView onOpenLog={openLogForProject} />}
        {view === 'tags' && <TagsView />}
        {view === 'log' && (
          <LogView
            filterProjectId={logFilterProjectId}
            onClearFilter={() => setLogFilterProjectId(null)}
          />
        )}

        <Cheatsheet open={showHelp} onClose={() => setShowHelp(false)} />
      </main>
    </TooltipProvider>
  )
}

function Cheatsheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className={cn('glass-bar fixed inset-x-0 bottom-0 z-30 border-t border-border')}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-muted-foreground text-xs">
        <Hint k="↵" label="conferma / edit" />
        <Hint k="↑↓" label="naviga elementi" />
        <Hint k="⇧↑↓" label="salta categoria" />
        <Hint k="␣" label="completa / comprimi" />
        <Hint k="→" label="note" />
        <Hint k="⌥L" label="apri / chiudi storico" />
        <Hint k="⌥T" label="apri / chiudi tag" />
        <Hint k="⌥D" label="tema chiaro / scuro" />
        <Hint k="⌥H" label="aiuto" />
        <Hint k="⌘C" label="copia task" />
        <Hint k="⌘Z" label="annulla chiusura" />
        <Hint k="esc" label="annulla" />
        <Hint k="tab" label="inserisci task" />
        <Hint k="⌘K" label="reset / focus bar" />
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          chiudi
        </button>
      </div>
    </div>
  )
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Kbd>{k}</Kbd>
      {label}
    </span>
  )
}
