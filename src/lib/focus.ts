export const COMMAND_BAR_INPUT_ID = 'tazly-command-bar-input'
export const COMMAND_BAR_INPUT_ATTR = 'data-tazly-command-input'

export function focusCommandBar() {
  // cmdk sovrascrive la prop `id` dell'input, quindi ci ancoriamo a un data-attribute inoltrato.
  const el = document.querySelector<HTMLInputElement>(`[${COMMAND_BAR_INPUT_ATTR}]`)
  el?.focus()
}

export function focusQuickAdd() {
  const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
  const input = root?.querySelector<HTMLInputElement>('input')
  input?.focus()
}
