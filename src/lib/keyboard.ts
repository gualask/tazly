import type React from 'react'

export function tryArrowRightToNotepad(
  e: React.KeyboardEvent<HTMLInputElement>,
  el: HTMLInputElement | null,
  onAtEnd: () => void,
): boolean {
  if (e.key !== 'ArrowRight') return false
  const len = el?.value.length ?? 0
  if ((el?.selectionStart ?? len) !== len) return false
  if ((el?.selectionEnd ?? len) !== len) return false
  e.preventDefault()
  el?.blur()
  onAtEnd()
  return true
}
