import { useEffect } from 'react'

import { getLastWrittenRaw } from '@/lib/safeBoardStorage'
import { useBoardStore } from '@/store/useBoardStore'

const STORAGE_KEY = 'tazly-board'

// Ultimo valore già applicato: evita di re-idratare due volte sullo stesso cambiamento.
let lastSeen: string | null = null

/**
 * Tiene allineata la board tra i diversi contesti dell'estensione che condividono
 * `chrome.storage.local`: quando il widget quick-add (in un'altra pagina) scrive un
 * task, la tab principale eventualmente aperta si re-idrata e lo mostra subito.
 */
export function useCrossContextSync() {
  useEffect(() => {
    const onChanged = chrome?.storage?.onChanged
    if (!onChanged) return

    function listener(changes: Record<string, chrome.storage.StorageChange>, area: string) {
      if (area !== 'local') return
      const change = changes[STORAGE_KEY]
      if (!change) return
      const next = change.newValue as string | undefined
      if (!next || next === lastSeen) return
      // Eco della nostra stessa scrittura: lo stato è già allineato, non re-idratare.
      if (next === getLastWrittenRaw()) return
      lastSeen = next
      void useBoardStore.persist.rehydrate()
    }

    onChanged.addListener(listener)
    return () => onChanged.removeListener(listener)
  }, [])
}
