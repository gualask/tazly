export const COMPOSER_ROOT_ATTR = 'data-tazly-composer-root'

/**
 * Mette il focus sull'input attualmente visibile del composer (selezione progetto
 * oppure categoria/titolo/tag a seconda dello step). Unico punto di rientro dalla
 * board e dal notepad verso la barra di inserimento.
 */
export function focusComposer() {
  const root = document.querySelector<HTMLElement>(`[${COMPOSER_ROOT_ATTR}]`)
  const input = root?.querySelector<HTMLInputElement>('input')
  input?.focus()
}

export const FILTER_BAR_ROOT_ATTR = 'data-tazly-filterbar-root'

/**
 * Mette il focus sul primo badge della barra filtri. Punto di ingresso da tastiera
 * (⌥F) per poi navigare i tag con le frecce.
 */
export function focusFilterBar() {
  const root = document.querySelector<HTMLElement>(`[${FILTER_BAR_ROOT_ATTR}]`)
  const button = root?.querySelector<HTMLButtonElement>('button')
  button?.focus()
}
