import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/index.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { chromeStorage } from '@/lib/storage'
import type { WidgetToOverlay } from './messages'
import { PromemoriaCapture } from './PromemoriaCapture'

// Allinea il tema a quello scelto nell'app. Lo leggiamo da chrome.storage, non da
// localStorage: quando il widget gira in un iframe su un sito terzo la localStorage
// è partizionata per sito (e quindi vuota), mentre chrome.storage è storage
// dell'estensione e resta accessibile. L'await blocca il primo paint finché il tema
// non è applicato (l'iframe resta a opacity 0 fino al load) → niente flash di tema.
const stored = await chromeStorage.getItem('tazly:theme')
const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', dark)
// Il color-scheme NON è il tema visivo (quello lo dà la classe `.dark` qui sopra):
// serve a far combaciare il widget con la pagina ospite. Un iframe cross-origin con
// color-scheme diverso dall'host riceve da Chrome un backdrop OPACO dietro il
// documento (il "rettangolo bianco" su GitHub). L'overlay passa lo schema dell'host
// via hash (#cs=...); allineandoci, il backdrop resta trasparente.
const hostScheme = new URLSearchParams(location.hash.slice(1)).get('cs')
document.documentElement.style.colorScheme = hostScheme || 'normal'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root non trovato')

createRoot(rootElement).render(
  <StrictMode>
    <TooltipProvider>
      <PromemoriaCapture />
    </TooltipProvider>
  </StrictMode>,
)

// Segnala all'overlay che color-scheme è applicato e il widget è montato: solo ora
// l'overlay rivela l'iframe, evitando il flash del backdrop opaco (in dev il modulo
// carica async e l'evento `load` scatterebbe prima che il color-scheme combaci).
window.parent.postMessage({ type: 'tazly:ready' } satisfies WidgetToOverlay, '*')
