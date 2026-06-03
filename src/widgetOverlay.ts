/**
 * Funzione iniettata nella pagina visitata (via chrome.scripting.executeScript)
 * quando l'utente preme la scorciatoia. Deve essere autosufficiente: viene
 * serializzata con toString(), quindi non può riferire import o scope esterni —
 * solo i suoi argomenti e le global del documento (document, window, chrome).
 *
 * Crea un iframe grande quanto il box del widget (`widget.html`), ancorato in
 * alto al centro: il resto della pagina resta visibile e interagibile. Mentre il
 * widget è aperto la pagina è in "modalità selezione": l'elemento sotto al
 * cursore viene evidenziato e un click ne cattura il testo, inviato al widget via
 * postMessage per pre-popolare il titolo del task. Il widget comunica a sua volta
 * "chiudimi" e la propria altezza renderizzata.
 */
export function injectQuickAddOverlay(widgetUrl: string): void {
  const ID = 'tazly-quick-add-overlay'
  const HIGHLIGHT_ID = 'tazly-quick-add-highlight'
  const ACCENT = '#6366f1'
  const w = window as unknown as { __tazlyOverlayClose?: () => void }

  // seconda pressione della scorciatoia mentre è aperto → chiudi (toggle)
  if (document.getElementById(ID)) {
    w.__tazlyOverlayClose?.()
    return
  }

  // Applica gli stili con priorità `important`: l'elemento iframe/overlay vive nel
  // DOM del sito ospite, che potrebbe avere regole globali sugli iframe in grado di
  // sovrascrivere gli stili inline normali e spostare/deformare l'overlay. Lo stile
  // inline `important` è il più alto nel cascade e nessuna regola del sito lo scavalca.
  function setImportant(el: HTMLElement, decls: Record<string, string>) {
    for (const [prop, value] of Object.entries(decls))
      el.style.setProperty(prop, value, 'important')
  }

  const iframe = document.createElement('iframe')
  iframe.id = ID
  // Allinea il color-scheme del widget a quello della pagina ospite. Un iframe
  // cross-origin (chrome-extension) con color-scheme DIVERSO dall'host riceve da
  // Chrome un backdrop OPACO dietro il documento (bianco quando l'host è scuro e il
  // widget chiaro) → il "rettangolo bianco" su GitHub. Passando lo schema dell'host
  // al widget (via hash) i due combaciano e il backdrop resta trasparente. Il tema
  // visivo della card resta indipendente (classe `.dark` + variabili CSS).
  const hostScheme = getComputedStyle(document.documentElement).colorScheme || 'normal'
  iframe.src = `${widgetUrl}#cs=${encodeURIComponent(hostScheme)}`
  setImportant(iframe, {
    position: 'fixed',
    top: '12vh',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(640px, calc(100vw - 32px))',
    height: '140px',
    border: 'none',
    margin: '0',
    background: 'transparent',
    'color-scheme': 'normal',
    'z-index': '2147483647',
    // Resta invisibile finché il widget non è pronto (vedi reveal): evita il lampo
    // dell'iframe vuoto/backdrop che coprirebbe un istante la pagina.
    opacity: '0',
    transition: 'opacity 80ms ease-out',
  })
  document.documentElement.appendChild(iframe)

  // Riquadro di evidenziazione che segue l'elemento sotto al cursore.
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

  const prevCursor = document.documentElement.style.cursor
  document.documentElement.style.cursor = 'crosshair'

  // Un elemento è un bersaglio valido se non fa parte del nostro overlay, non è
  // html/body, e ha *testo diretto* (un nodo di testo figlio immediato). Il test sul
  // testo diretto — non sul textContent complessivo — esclude i contenitori come
  // tabelle, liste e wrapper, che hanno testo solo nei discendenti: si catturano
  // così le foglie testuali (paragrafi, titoli, celle, link), non interi blocchi.
  function hasDirectText(el: HTMLElement): boolean {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim()) return true
    }
    return false
  }

  function isCapturable(el: EventTarget | null): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false
    if (el === iframe || el === highlight) return false
    if (el === document.body || el === document.documentElement) return false
    return hasDirectText(el)
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
  // middle-click) scatterebbero comunque. Bloccare il mousedown tiene anche il focus
  // dentro l'iframe. Il testo viene poi catturato solo sul `click` (vedi onClick).
  const SUPPRESSED = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'auxclick']
  function suppress(e: Event) {
    if (!isCapturable(e.target)) return
    e.preventDefault()
    e.stopPropagation()
  }

  function onClick(e: MouseEvent) {
    if (!isCapturable(e.target)) return
    // Cattura il testo invece di seguire link / attivare handler della pagina, e lo
    // invia al widget (iframe cross-origin) via postMessage.
    e.preventDefault()
    e.stopPropagation()
    const raw = (e.target as HTMLElement).textContent ?? ''
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, 500)
    if (text) iframe.contentWindow?.postMessage({ type: 'tazly:capture', text }, '*')
  }

  // Esc a livello pagina: dopo aver cliccato sul testo il focus è sulla pagina
  // (non nell'iframe), quindi l'Esc interno al widget non scatterebbe. Qui lo
  // intercettiamo per chiudere comunque.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  function close() {
    window.removeEventListener('message', onMessage)
    document.removeEventListener('mouseover', onMouseOver, true)
    document.removeEventListener('click', onClick, true)
    for (const type of SUPPRESSED) document.removeEventListener(type, suppress, true)
    document.removeEventListener('keydown', onKeyDown, true)
    document.documentElement.style.cursor = prevCursor
    highlight.remove()
    iframe.remove()
    w.__tazlyOverlayClose = undefined
  }

  // Rivela l'iframe solo quando il widget ha applicato il color-scheme e montato
  // (messaggio `tazly:ready`): rivelarlo sull'evento `load` mostrerebbe un istante il
  // backdrop opaco prima che il color-scheme combaci con l'host (flash, evidente in
  // dev dove il modulo carica async). Idempotente; un timeout di sicurezza lo rivela
  // comunque se il segnale non arriva (es. widget vecchio in cache).
  let revealed = false
  function reveal() {
    if (revealed) return
    revealed = true
    iframe.style.setProperty('opacity', '1', 'important')
    try {
      iframe.contentWindow?.focus()
    } catch {
      /* cross-origin focus può fallire silenziosamente: ignora */
    }
  }

  function onMessage(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return
    const data = e.data as { type?: string; height?: number } | null
    if (data?.type === 'tazly:close') close()
    else if (data?.type === 'tazly:ready') reveal()
    else if (data?.type === 'tazly:resize' && typeof data.height === 'number') {
      iframe.style.setProperty('height', `${Math.ceil(data.height)}px`, 'important')
    }
  }

  w.__tazlyOverlayClose = close
  window.addEventListener('message', onMessage)
  document.addEventListener('mouseover', onMouseOver, true)
  document.addEventListener('click', onClick, true)
  for (const type of SUPPRESSED) document.addEventListener(type, suppress, true)
  document.addEventListener('keydown', onKeyDown, true)
  // Fallback: se `tazly:ready` non arriva, rivela comunque per non lasciare l'overlay invisibile.
  setTimeout(reveal, 1500)
}
