import type { StateStorage } from 'zustand/middleware'

import { chromeStorage } from './storage'

const BACKUP_SUFFIX = '-backup'

/**
 * Indica se un valore persistito contiene una board con dati reali.
 * Una stringa mancante, illeggibile o con board vuota torna false.
 */
function hasData(raw: string | null): boolean {
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    const board = parsed?.state?.board
    return Boolean(board && ((board.projects?.length ?? 0) > 0 || (board.tags?.length ?? 0) > 0))
  } catch {
    return false
  }
}

/**
 * Storage resistente alla perdita dati:
 * - in scrittura tiene un backup separato aggiornato solo quando c'è contenuto,
 *   così una scrittura vuota (es. reidratazione fallita) non cancella l'ultimo stato buono;
 * - in lettura, se il principale è vuoto o corrotto, ripristina dal backup.
 */
export const safeBoardStorage: StateStorage = {
  async getItem(name) {
    const raw = await chromeStorage.getItem(name)
    if (hasData(raw)) return raw
    const backup = await chromeStorage.getItem(name + BACKUP_SUFFIX)
    if (hasData(backup)) {
      // Ripristina il backup nel principale: torna a essere la fonte di verità.
      await chromeStorage.setItem(name, backup as string)
      return backup
    }
    return raw
  },
  async setItem(name, value) {
    await chromeStorage.setItem(name, value)
    if (hasData(value)) {
      await chromeStorage.setItem(name + BACKUP_SUFFIX, value)
    }
  },
  async removeItem(name) {
    // Rimozione esplicita (reset/import): azzera anche il backup, altrimenti verrebbe ripristinato.
    await chromeStorage.removeItem(name)
    await chromeStorage.removeItem(name + BACKUP_SUFFIX)
  },
}
