import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { TooltipProvider } from '@/components/ui/tooltip'
import '@/index.css'
import { OmniAdd } from './OmniAdd'

// Allinea il tema a quello scelto nell'app: la chiave localStorage è condivisa tra
// le pagine dell'estensione (stessa origine chrome-extension://).
const stored = localStorage.getItem('tazly:theme')
const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', dark)
document.documentElement.style.colorScheme = dark ? 'dark' : 'light'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root non trovato')

createRoot(rootElement).render(
  <StrictMode>
    <TooltipProvider>
      <OmniAdd />
    </TooltipProvider>
  </StrictMode>,
)
