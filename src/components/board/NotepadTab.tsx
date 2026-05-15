import { IconNotes } from '@tabler/icons-react'

import { useBoardStore } from '@/store/useBoardStore'

export function NotepadTab() {
  const requestOpenNotepad = useBoardStore((s) => s.requestOpenNotepad)
  return (
    <button
      type="button"
      onClick={requestOpenNotepad}
      title="Apri note"
      className="flex w-7 min-h-[60vh] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <IconNotes className="size-4" />
    </button>
  )
}
