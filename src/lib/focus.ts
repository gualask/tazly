export const COMMAND_BAR_INPUT_ID = 'tazly-command-bar-input'

export function focusCommandBar() {
  const el = document.getElementById(COMMAND_BAR_INPUT_ID) as HTMLInputElement | null
  el?.focus()
}

export function focusQuickAdd() {
  const root = document.querySelector<HTMLElement>('[data-tazly-quickadd-root]')
  const input = root?.querySelector<HTMLInputElement>('input')
  input?.focus()
}
