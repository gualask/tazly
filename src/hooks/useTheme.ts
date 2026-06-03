import { useCallback, useEffect, useState } from 'react'

import { chromeStorage } from '@/lib/storage'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'tazly:theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    // localStorage: lettura sincrona per l'init dell'app (niente flash).
    localStorage.setItem(STORAGE_KEY, theme)
    // chrome.storage: canale non partizionato, leggibile dal widget anche quando
    // gira in un iframe su un sito terzo (dove la localStorage è isolata per sito).
    void chromeStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
