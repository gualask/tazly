import { IconLayoutKanban } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { useBoardStore } from '@/store/useBoardStore'

export function NewTab() {
  const projectCount = useBoardStore((s) => s.board.projects.length)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3">
        <IconLayoutKanban className="size-8 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">Recap</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Progetti aperti: <span className="font-mono">{projectCount}</span>
      </p>
      <Button>Inizia</Button>
    </main>
  )
}
