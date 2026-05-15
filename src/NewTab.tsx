import { IconRefresh, IconTag } from '@tabler/icons-react'
import { useState } from 'react'

import { BoardView } from '@/components/board/BoardView'
import { CommandBar } from '@/components/board/CommandBar'
import { TagsView } from '@/components/tags/TagsView'
import { Button } from '@/components/ui/button'
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'

type View = 'board' | 'tags'

export function NewTab() {
  const [view, setView] = useState<View>('board')
  const [showHelp, setShowHelp] = useState(false)
  const resetBoard = useBoardStore((s) => s.resetBoard)

  useGlobalHotkeys({ onToggleHelp: () => setShowHelp((v) => !v) })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-6 py-2">
          <div className="flex-1">{view === 'board' && <CommandBar />}</div>
          <Button
            size="icon"
            variant={view === 'tags' ? 'secondary' : 'ghost'}
            onClick={() => setView(view === 'tags' ? 'board' : 'tags')}
            title="Gestione tag"
            className="size-7"
          >
            <IconTag />
          </Button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="rounded border border-transparent px-1.5 py-0.5 font-mono text-muted-foreground text-xs hover:border-border"
            title="Shortcut (?)"
          >
            ?
          </button>
          {import.meta.env.DEV && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground"
              title="Reset board (dev)"
              onClick={() => {
                if (confirm('Reset completo della board e dello storage. Procedere?')) {
                  useBoardStore.persist.clearStorage()
                  resetBoard()
                }
              }}
            >
              <IconRefresh />
            </Button>
          )}
        </div>
      </header>

      {view === 'board' ? <BoardView /> : <TagsView onClose={() => setView('board')} />}

      <Cheatsheet open={showHelp} onClose={() => setShowHelp(false)} />
    </main>
  )
}

function Cheatsheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-2 text-muted-foreground text-xs">
        <Hint k="↵" label="conferma / edit" />
        <Hint k="↑↓" label="naviga elementi" />
        <Hint k="⇧↑↓" label="salta categoria" />
        <Hint k="→" label="note" />
        <Hint k="esc" label="annulla" />
        <Hint k="tab" label="inserisci task" />
        <Hint k="/" label="focus bar" />
        <Hint k="?" label="aiuto" />
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
      <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
        {k}
      </kbd>
      {label}
    </span>
  )
}
