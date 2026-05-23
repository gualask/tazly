import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { IconButton } from '@/components/common/IconButton'
import { TagBadge } from '@/components/tags/TagBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TAG_COLOR_CLASSES, TAG_COLORS, type TagColor } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/store/useBoardStore'
import type { Tag, TagId } from '@/types/domain'

function ColorPicker({ value, onChange }: { value: TagColor; onChange: (c: TagColor) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {TAG_COLORS.map((c) => {
        const classes = TAG_COLOR_CLASSES[c]
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'inline-flex h-6 min-w-8 items-center justify-center rounded-md border px-1.5 font-medium text-xs transition',
              classes.bg,
              classes.fg,
              classes.border,
              value === c && 'ring-2 ring-foreground/60 ring-offset-1 ring-offset-background',
            )}
            aria-label={c}
            title={c}
          >
            Aa
          </button>
        )
      })}
    </div>
  )
}

function TagRow({ tag }: { tag: Tag }) {
  const updateTag = useBoardStore((s) => s.updateTag)
  const removeTag = useBoardStore((s) => s.removeTag)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState<TagColor>(tag.color)
  const [description, setDescription] = useState(tag.description ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function save() {
    updateTag(tag.id, { name, color, description: description.trim() || undefined })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border bg-card p-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome tag" />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione (opzionale)"
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <IconButton onClick={save} tooltip="Salva">
            <IconCheck />
          </IconButton>
          <IconButton onClick={() => setEditing(false)} tooltip="Annulla">
            <IconX />
          </IconButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
      <TagBadge tag={tag} />
      {tag.description ? (
        <span className="text-muted-foreground text-xs truncate flex-1">{tag.description}</span>
      ) : (
        <span className="flex-1" />
      )}
      <div className="flex items-center gap-1">
        <IconButton onClick={() => setEditing(true)} tooltip="Modifica">
          <IconPencil />
        </IconButton>
        <IconButton onClick={() => setConfirmingDelete(true)} tooltip="Elimina">
          <IconTrash />
        </IconButton>
      </div>
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il tag?</AlertDialogTitle>
            <AlertDialogDescription>
              "{tag.name}" verrà rimosso da tutti i task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => removeTag(tag.id)}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NewTagForm({ onClose }: { onClose: () => void }) {
  const addTag = useBoardStore((s) => s.addTag)
  const [name, setName] = useState('')
  const [color, setColor] = useState<TagColor>('blue')
  const [description, setDescription] = useState('')

  function submit() {
    if (!name.trim()) return
    addTag({ name, color, description: description.trim() || undefined })
    onClose()
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Nuovo tag</h3>
        <IconButton onClick={onClose} tooltip="Chiudi">
          <IconX />
        </IconButton>
      </div>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome (es. bug)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrizione (opzionale)"
      />
      <div>
        <p className="mb-1 text-muted-foreground text-xs">Colore</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          Crea
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Annulla
        </Button>
      </div>
    </div>
  )
}

interface TagsViewProps {
  onClose?: () => void
}

export function TagsView(_props: TagsViewProps = {}) {
  const tags = useBoardStore((s) => s.board.tags)
  const [creating, setCreating] = useState(false)

  const sorted = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags])

  const projects = useBoardStore((s) => s.board.projects)
  const usageById = useMemo(() => {
    const map: Record<TagId, number> = {}
    for (const p of projects) {
      for (const t of p.tasks) {
        for (const tid of t.tagIds) map[tid] = (map[tid] ?? 0) + 1
      }
    }
    return map
  }, [projects])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xl tracking-tight">Gestione tag</h2>
          <p className="text-muted-foreground text-sm">
            Definisci il vocabolario controllato per i task.
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <IconPlus />
            Nuovo tag
          </Button>
        )}
      </header>

      {creating && <NewTagForm onClose={() => setCreating(false)} />}

      {sorted.length === 0 && !creating ? (
        <EmptyState
          title="Nessun tag definito"
          description="Crea i tag che userai per classificare i task (bug, feature, doubt, ...)."
          action={
            <Button onClick={() => setCreating(true)}>
              <IconPlus />
              Crea il primo tag
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <div className="flex-1">
                <TagRow tag={t} />
              </div>
              <span className="w-12 text-right text-muted-foreground text-xs tabular-nums">
                {usageById[t.id] ?? 0} task
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
