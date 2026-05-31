import type { Board } from '@/types/domain'

const EXPORT_VERSION = 1

/** Scarica la board corrente come file JSON di backup. */
export function exportBoard(board: Board): void {
  const payload = JSON.stringify({ app: 'tazly', version: EXPORT_VERSION, board }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tazly-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Estrae una Board da un file di backup. Accetta sia il formato di export
 * ({ board }) sia un dump grezzo dello storage persistito ({ state: { board } }).
 * Lancia se la struttura non è valida.
 */
export function parseBoardBackup(raw: string): Board {
  const parsed = JSON.parse(raw)
  const board = parsed?.board ?? parsed?.state?.board ?? parsed
  if (!board || !Array.isArray(board.projects) || !Array.isArray(board.tags)) {
    throw new Error('File non valido: manca una board con projects e tags.')
  }
  return board as Board
}
