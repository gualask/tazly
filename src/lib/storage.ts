import type { StateStorage } from 'zustand/middleware'

const hasChromeStorage = typeof chrome !== 'undefined' && chrome?.storage?.local !== undefined

export const chromeStorage: StateStorage = {
  async getItem(name) {
    if (!hasChromeStorage) return localStorage.getItem(name)
    const result = await chrome.storage.local.get(name)
    return (result[name] as string | undefined) ?? null
  },
  async setItem(name, value) {
    if (!hasChromeStorage) {
      localStorage.setItem(name, value)
      return
    }
    await chrome.storage.local.set({ [name]: value })
  },
  async removeItem(name) {
    if (!hasChromeStorage) {
      localStorage.removeItem(name)
      return
    }
    await chrome.storage.local.remove(name)
  },
}
