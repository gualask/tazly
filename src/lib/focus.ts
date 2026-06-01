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
