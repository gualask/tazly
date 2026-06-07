// `import type` → cancellato in compilazione: NON entra nella funzione serializzata
// con toString() (che non può riferire scope esterni). Vedi widget/messages.ts.
import type { CaptureMessage, WidgetToOverlay } from './widget/messages'

/**
 * Funzione iniettata nella pagina visitata (via chrome.scripting.executeScript)
 * quando l'utente preme la scorciatoia. Deve essere autosufficiente: viene
 * serializzata con toString(), quindi non può riferire import o scope esterni —
 * solo i suoi argomenti e le global del documento (document, window, chrome).
 *
 * Crea un iframe col widget (`widget.html`), in alto al centro. La cattura NON è
 * sempre attiva: il widget chiede `tazly:select-mode` e allora l'overlay rimpicciolisce
 * l'iframe a un'icona in alto a destra ed entra in "modalità picker": l'elemento sotto
 * al cursore viene evidenziato e un click ne cattura il testo (inviato al widget via
 * postMessage). Il filtro è volutamente largo — qualsiasi elemento con del testo, anche
 * un contenitore — così si può prendere un intero blocco (es. un messaggio multi-span),
 * non solo le foglie testuali.
 */
export function injectCaptureOverlay(widgetUrl: string): void {
  const ID = 'tazly-capture-overlay'
  const HIGHLIGHT_ID = 'tazly-capture-highlight'
  const ACCENT = '#6366f1'
  const w = window as unknown as { __tazlyOverlayClose?: () => void }

  // seconda pressione della scorciatoia mentre è aperto → chiudi (toggle)
  if (document.getElementById(ID)) {
    w.__tazlyOverlayClose?.()
    return
  }

  // Applica gli stili con priorità `important`: l'iframe vive nel DOM del sito ospite,
  // che potrebbe avere regole globali sugli iframe capaci di scavalcare gli inline
  // normali e spostare/deformare l'overlay. L'inline `important` è il più alto nel
  // cascade e nessuna regola del sito lo supera.
  function setImportant(el: HTMLElement, decls: Record<string, string>) {
    for (const [prop, value] of Object.entries(decls))
      el.style.setProperty(prop, value, 'important')
  }

  const iframe = document.createElement('iframe')
  iframe.id = ID
  // Risolvi uno schema CONCRETO ('dark'/'light'): `getComputedStyle` spesso torna
  // 'light dark' (la pagina supporta entrambi) e in quel caso host e widget potrebbero
  // risolvere schemi diversi → un iframe cross-origin riceve da Chrome un backdrop
  // OPACO (il "rettangolo bianco"). Con un valore concreto, identico sui due lati
  // (elemento iframe + documento widget via hash), il backdrop resta trasparente.
  const declared = getComputedStyle(document.documentElement).colorScheme
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  const hostScheme =
    declared === 'dark' || declared === 'light' ? declared : prefersDark ? 'dark' : 'light'
  iframe.src = `${widgetUrl}#cs=${encodeURIComponent(hostScheme)}`
  setImportant(iframe, {
    position: 'fixed',
    border: 'none',
    margin: '0',
    background: 'transparent',
    'color-scheme': hostScheme,
    'z-index': '2147483647',
    // Resta invisibile finché il widget non è pronto (vedi reveal): evita il lampo
    // dell'iframe vuoto/backdrop che coprirebbe un istante la pagina.
    opacity: '0',
    transition: 'opacity 80ms ease-out',
  })
  document.documentElement.appendChild(iframe)

  // Riquadro di evidenziazione che segue l'elemento sotto al cursore (mostrato solo in
  // modalità picker).
  const highlight = document.createElement('div')
  highlight.id = HIGHLIGHT_ID
  setImportant(highlight, {
    position: 'fixed',
    'pointer-events': 'none',
    'z-index': '2147483646',
    border: `2px solid ${ACCENT}`,
    'border-radius': '4px',
    background: `${ACCENT}1a`, // ~10% alpha
    display: 'none',
    transition: 'all 40ms ease-out',
  })
  document.documentElement.appendChild(highlight)

  // Geometria. Espansa: card in alto al centro, altezza guidata dal widget
  // (`tazly:resize`). Collassata (modalità picker): icona in alto a destra.
  let lastHeight = 140
  let selecting = false
  const prevCursor = document.documentElement.style.cursor

  function applyExpanded() {
    setImportant(iframe, {
      top: '12vh',
      left: '50%',
      right: 'auto',
      transform: 'translateX(-50%)',
      width: 'min(640px, calc(100vw - 32px))',
      height: `${lastHeight}px`,
    })
  }
  function applyCollapsed() {
    setImportant(iframe, {
      top: '12px',
      right: '12px',
      left: 'auto',
      transform: 'none',
      width: '44px',
      height: '44px',
    })
  }
  applyExpanded()

  // Bersaglio valido: un elemento (non il nostro overlay, non html/body) con del testo.
  // Filtro volutamente largo: include anche i CONTENITORI (un div con più span), così
  // si può catturare un blocco intero, non solo le foglie con testo diretto.
  function isCapturable(el: EventTarget | null): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false
    if (el === iframe || el === highlight) return false
    if (el === document.body || el === document.documentElement) return false
    return (el.textContent ?? '').trim().length > 0
  }

  function onMouseOver(e: MouseEvent) {
    const el = e.target
    if (!isCapturable(el)) {
      highlight.style.setProperty('display', 'none', 'important')
      return
    }
    const r = el.getBoundingClientRect()
    setImportant(highlight, {
      display: 'block',
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    })
  }

  // Neutralizza l'intera sequenza di puntatore sugli elementi catturabili: senza
  // questo, comportamenti legati a mousedown/up (focus, selezione, dropdown, submit,
  // middle-click) scatterebbero comunque. Il testo viene catturato solo sul `click`.
  const SUPPRESSED = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'auxclick']
  function suppress(e: Event) {
    if (!isCapturable(e.target)) return
    e.preventDefault()
    e.stopPropagation()
  }

  function onClick(e: MouseEvent) {
    if (!isCapturable(e.target)) return
    // Cattura il testo invece di seguire link / attivare handler della pagina.
    e.preventDefault()
    e.stopPropagation()
    // `innerText` (non `textContent`): rispetta le interruzioni di riga COME RESE a
    // video → elementi su righe diverse (es. due span impilati, o più paragrafi)
    // diventano `\n`, mentre il testo inline sulla stessa riga resta unito.
    const raw = (e.target as HTMLElement).innerText ?? ''
    const text = raw
      .replace(/[ \t]+/g, ' ') // spazi/tab multipli → uno (gli \n restano)
      .replace(/ *\n */g, '\n') // via gli spazi attorno agli a-capo
      .replace(/\n{3,}/g, '\n\n') // al massimo una riga vuota tra blocchi
      .trim()
      .slice(0, 4000)
    if (!text) return
    // La provenienza (URL+titolo dell'host) la vede solo l'overlay: l'iframe è
    // cross-origin. Viaggia col testo per diventare il contesto del promemoria.
    const msg: CaptureMessage = {
      type: 'tazly:capture',
      text,
      sourceUrl: location.href,
      sourceTitle: document.title,
    }
    iframe.contentWindow?.postMessage(msg, '*')
    exitSelect()
  }

  function enterSelect() {
    if (selecting) return
    selecting = true
    applyCollapsed()
    document.documentElement.style.cursor = 'crosshair'
    document.addEventListener('mouseover', onMouseOver, true)
    document.addEventListener('click', onClick, true)
    for (const type of SUPPRESSED) document.addEventListener(type, suppress, true)
  }
  function exitSelect() {
    if (!selecting) return
    selecting = false
    highlight.style.setProperty('display', 'none', 'important')
    document.documentElement.style.cursor = prevCursor
    document.removeEventListener('mouseover', onMouseOver, true)
    document.removeEventListener('click', onClick, true)
    for (const type of SUPPRESSED) document.removeEventListener(type, suppress, true)
    applyExpanded()
    try {
      iframe.contentWindow?.focus()
    } catch {
      /* cross-origin focus può fallire: ignora */
    }
  }

  // Esc a livello pagina: in picker il focus è sulla pagina (non nell'iframe), quindi
  // l'Esc interno al widget non scatterebbe. Qui chiudiamo comunque.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  function close() {
    window.removeEventListener('message', onMessage)
    document.removeEventListener('keydown', onKeyDown, true)
    document.removeEventListener('mouseover', onMouseOver, true)
    document.removeEventListener('click', onClick, true)
    for (const type of SUPPRESSED) document.removeEventListener(type, suppress, true)
    document.documentElement.style.cursor = prevCursor
    highlight.remove()
    iframe.remove()
    w.__tazlyOverlayClose = undefined
  }

  // Rivela l'iframe solo quando il widget ha applicato il color-scheme ed è montato
  // (`tazly:ready`): rivelarlo sul `load` mostrerebbe un istante il backdrop opaco
  // prima che lo schema combaci (flash). Idempotente; un timeout di sicurezza lo
  // rivela comunque se il segnale non arriva (es. widget vecchio in cache).
  let revealed = false
  function reveal() {
    if (revealed) return
    revealed = true
    iframe.style.setProperty('opacity', '1', 'important')
    try {
      iframe.contentWindow?.focus()
    } catch {
      /* cross-origin focus può fallire: ignora */
    }
  }

  function onMessage(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return
    const data = e.data as WidgetToOverlay | null
    if (data?.type === 'tazly:close') close()
    else if (data?.type === 'tazly:ready') reveal()
    else if (data?.type === 'tazly:resize') {
      // In picker l'iframe è bloccato a icona: ignora i resize del contenuto compatto,
      // così l'altezza piena memorizzata resta valida al ritorno.
      if (selecting) return
      lastHeight = Math.ceil(data.height)
      iframe.style.setProperty('height', `${lastHeight}px`, 'important')
    } else if (data?.type === 'tazly:select-mode') {
      if (data.on) enterSelect()
      else exitSelect()
    }
  }

  w.__tazlyOverlayClose = close
  window.addEventListener('message', onMessage)
  document.addEventListener('keydown', onKeyDown, true)
  // Fallback: se `tazly:ready` non arriva, rivela comunque per non lasciare l'overlay invisibile.
  setTimeout(reveal, 1500)
}
