import DOMPurify from 'dompurify'

/**
 * Tag semantici tenuti dalla cattura: struttura + formattazione di base, niente
 * stili/classi inline (PRODUCT: il promemoria fa da ponte verso editor rich come
 * Confluence, che mappano questi tag sui propri componenti e scartano comunque
 * stili e classi). Le IMMAGINI sono escluse di proposito (non servono mai allo
 * spunto). Tutto il resto viene appiattito a testo da DOMPurify.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'sub',
  'sup',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'hr',
]

// Solo gli attributi necessari a struttura e link; nessuno `style`/`class`.
const ALLOWED_ATTR = ['href', 'title', 'colspan', 'rowspan', 'start', 'type']

// Tag inline di formattazione: salendo da un anchor attraverso questi cerchiamo
// ancora il "flusso di testo" (es. <strong><a>…</a></strong> dentro un <p>). NB:
// `a` è escluso di proposito: due link adiacenti senza testo intorno NON fanno
// "flusso" (eviterebbe di riconoscere un titolo come navigazionale).
const INLINE_TAGS = new Set([
  'SPAN',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'DEL',
  'INS',
  'MARK',
  'SUB',
  'SUP',
  'CODE',
])

/** Testo che è solo un URL o un dominio nudo (niente spazi): tipico dei link-riferimento. */
function isBareUrlOrDomain(s: string): boolean {
  if (!s || /\s/.test(s)) return false
  if (/^https?:\/\//i.test(s)) return true
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)
}

/** URL assoluto risolto sulla pagina d'origine; stringa vuota se non risolvibile. */
function absHref(href: string, pageUrl: string): string {
  try {
    return new URL(href, pageUrl).href
  } catch {
    return ''
  }
}

/** Sostituisce un elemento con i suoi figli (tiene il contenuto, butta l'elemento). */
function unwrap(el: Element): void {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

/**
 * Un link è "vero" (da tenere) solo se vive DENTRO un flusso di testo: ha del testo
 * o altri elementi inline accanto a sé, sulla stessa riga (es. "vedi <a>la guida</a>
 * per i dettagli"). Se invece è l'unico contenuto del suo blocco — un titolo, una
 * voce di menu, una CTA — è navigazionale. Sale attraverso i wrapper inline così un
 * link avvolto in <strong>/<span> resta valido. Regola GLOBALE (non per un sito).
 */
function isInlineInFlow(a: Element): boolean {
  let node: Element = a
  while (true) {
    const parent = node.parentElement
    if (!parent) return false
    for (const sib of parent.childNodes) {
      if (sib === node) continue
      if (sib.nodeType === Node.TEXT_NODE) {
        if ((sib.textContent ?? '').trim()) return true
      } else if (sib.nodeType === Node.ELEMENT_NODE) {
        const el = sib as Element
        if (INLINE_TAGS.has(el.tagName) && (el.textContent ?? '').trim()) return true
      }
    }
    // Genitore non più inline → confine di blocco/root: niente testo adiacente, è "a sé".
    if (!INLINE_TAGS.has(parent.tagName)) return false
    node = parent
  }
}

/**
 * Pulizia "di prodotto" dei link sull'HTML sanitizzato (PRODUCT, sessione 2026-06-07,
 * regole validate su Reddit/ChatGPT reali). Tiene solo i link "veri" nel corpo del
 * testo; srotola tenendone il testo gli altri. Un `<a>` viene srotolato se:
 *  - RIFERIMENTO: testo vuoto / ≤2 char / numerico (footnote) / URL o dominio nudo;
 *  - HREF DUPLICATO (≥2 anchor con lo stesso URL): il browser spezza i link che
 *    avvolgono blocchi in tanti frammenti con lo stesso href (es. post Reddit, dove
 *    titolo + corpo puntano tutti al permalink) → strutturali;
 *  - NAV INTERNO: stesso hostname della pagina d'origine E non inline nel flusso
 *    (titolo, voce subreddit, link di navigazione del sito stesso).
 * Decisione in due fasi (decidi su tutto l'albero, poi srotola): così lo srotolamento
 * di un anchor non lascia testo sciolto che falserebbe il check di flusso degli altri.
 */
function cleanCapturedLinks(root: HTMLElement, pageUrl: string): void {
  let pageHost = ''
  try {
    pageHost = new URL(pageUrl).hostname
  } catch {
    // pageUrl assente/non valido: la regola "nav interno" semplicemente non scatterà.
  }

  const anchors = Array.from(root.querySelectorAll('a'))
  const counts = new Map<string, number>()
  for (const a of anchors) {
    const abs = absHref(a.getAttribute('href') ?? '', pageUrl)
    if (abs) counts.set(abs, (counts.get(abs) ?? 0) + 1)
  }

  const toUnwrap: Element[] = []
  for (const a of anchors) {
    const text = (a.textContent ?? '').trim()
    const abs = absHref(a.getAttribute('href') ?? '', pageUrl)
    let host = ''
    try {
      host = new URL(abs).hostname
    } catch {
      // href non risolvibile
    }
    const isReference =
      text === '' || text.length <= 2 || /^\d+$/.test(text) || isBareUrlOrDomain(text)
    const isDuplicate = abs !== '' && (counts.get(abs) ?? 0) >= 2
    const isInternalNav = pageHost !== '' && host === pageHost && !isInlineInFlow(a)
    if (isReference || isDuplicate || isInternalNav) toUnwrap.push(a)
  }
  for (const a of toUnwrap) unwrap(a)
}

/**
 * Sanitizzazione di SICUREZZA (allowlist semantica, niente immagini/script/stili):
 * usata al render e prima della copia, su HTML che potrebbe arrivare da localStorage
 * (manomettibile). NON tocca i link: la pulizia "di prodotto" avviene una sola volta
 * in cattura con `cleanCapturedHtml` (serve l'URL della pagina, qui non disponibile).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

/**
 * Sanitizzazione + pulizia "di prodotto" dei link, da usare UNA volta alla cattura
 * (il widget conosce `pageUrl` = pagina d'origine). Restituisce l'HTML canonico da
 * salvare nel promemoria. Vedi `cleanCapturedLinks` per le regole.
 */
export function cleanCapturedHtml(html: string, pageUrl: string): string {
  const root = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    RETURN_DOM: true,
  }) as unknown as HTMLElement
  cleanCapturedLinks(root, pageUrl)
  return root.innerHTML
}

/** Escape dei caratteri di markup, per inserire del plain-text dentro dell'HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Copia un contenuto in clipboard in due formati insieme: `text/html` (renderizzato,
 * letto dagli editor rich come Confluence/Docs → formattazione adattata ai loro
 * componenti) e `text/plain` (fallback per i campi testo). Richiede un gesto utente.
 */
export async function copyRichText(html: string, plain: string): Promise<void> {
  const safe = sanitizeHtml(html)
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([safe], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ])
    return
  }
  // Fallback: solo testo, dove `clipboard.write`/`ClipboardItem` non esistono.
  await navigator.clipboard.writeText(plain)
}
