// Stub minimale di chrome.storage.local per i test del persist dello store.
// Deve essere definito prima che lib/storage.ts venga importato (setupFiles).
const store = new Map<string, string>()

const local = {
  async get(name: string) {
    return name in Object.fromEntries(store) ? { [name]: store.get(name) } : {}
  },
  async set(items: Record<string, string>) {
    for (const [k, v] of Object.entries(items)) store.set(k, v)
  },
  async remove(name: string) {
    store.delete(name)
  },
}

;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } }
