import type { StateStorage } from 'zustand/middleware'

/**
 * Avvolge uno StateStorage ritardandone le scritture: durante una raffica di
 * mutazioni (es. ogni battitura nel notepad) accumula solo l'ultimo valore e
 * scrive una volta sola a raffica conclusa, invece di serializzare e persistere
 * la board a ogni keystroke.
 *
 * Garanzie sulla coerenza dei dati:
 * - una scrittura pendente viene forzata (`flush`) quando la tab passa in
 *   background o viene chiusa, così non si perde l'ultimo stato;
 * - `removeItem` annulla la scrittura pendente prima di cancellare, evitando che
 *   un debounce in volo ripristini dati appena azzerati (reset/import).
 * Le letture non sono ritardate: l'idratazione iniziale resta immediata.
 */
export function debounceStorage(inner: StateStorage, delayMs = 400): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: { name: string; value: string } | null = null

  function flush() {
    if (!pending) return
    const { name, value } = pending
    pending = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    void inner.setItem(name, value)
  }

  if (typeof window !== 'undefined') {
    // visibilitychange copre il cambio tab (caso tipico di una new-tab page);
    // pagehide copre la chiusura. Entrambi scattano prima che la tab sparisca.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    window.addEventListener('pagehide', flush)
  }

  return {
    getItem: (name) => inner.getItem(name),
    setItem(name, value) {
      pending = { name, value }
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    removeItem(name) {
      pending = null
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      return inner.removeItem(name)
    },
  }
}
