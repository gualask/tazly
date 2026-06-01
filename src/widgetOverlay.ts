/**
 * Funzione iniettata nella pagina visitata (via chrome.scripting.executeScript)
 * quando l'utente preme la scorciatoia. Deve essere autosufficiente: viene
 * serializzata con toString(), quindi non può riferire import o scope esterni —
 * solo i suoi argomenti e le global del documento (document, window, chrome).
 *
 * Crea un iframe a tutto schermo, trasparente, che ospita la pagina-estensione
 * `widget.html`. Il backdrop, la chiusura su click-fuori e l'Esc vivono dentro
 * il widget, che comunica "chiudimi" via postMessage. Qui gestiamo solo il ciclo
 * di vita dell'iframe (crea / toggle / rimuovi).
 */
export function injectQuickAddOverlay(widgetUrl: string): void {
  const ID = 'tazly-quick-add-overlay'
  const w = window as unknown as { __tazlyOverlayClose?: () => void }

  // seconda pressione della scorciatoia mentre è aperto → chiudi (toggle)
  if (document.getElementById(ID)) {
    w.__tazlyOverlayClose?.()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.id = ID
  iframe.src = widgetUrl
  const s = iframe.style
  s.position = 'fixed'
  s.inset = '0'
  s.width = '100%'
  s.height = '100%'
  s.border = 'none'
  s.margin = '0'
  s.background = 'transparent'
  s.colorScheme = 'normal'
  s.zIndex = '2147483647'
  // Resta invisibile finché il contenuto non è montato: evita il lampo bianco
  // dell'iframe vuoto che coprirebbe la pagina per un istante.
  s.opacity = '0'
  s.transition = 'opacity 80ms ease-out'
  document.documentElement.appendChild(iframe)

  function close() {
    window.removeEventListener('message', onMessage)
    iframe.remove()
    w.__tazlyOverlayClose = undefined
  }

  function onMessage(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return
    const data = e.data as { type?: string } | null
    if (data?.type === 'tazly:close') close()
  }

  w.__tazlyOverlayClose = close
  window.addEventListener('message', onMessage)
  iframe.addEventListener('load', () => {
    iframe.style.opacity = '1'
    try {
      iframe.contentWindow?.focus()
    } catch {
      /* cross-origin focus può fallire silenziosamente: ignora */
    }
  })
}
